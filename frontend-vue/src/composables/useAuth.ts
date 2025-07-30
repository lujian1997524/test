import { ref, computed, onMounted, provide, inject, type InjectionKey } from 'vue'
import { apiRequest, isLocalStorageAvailable } from '../utils/api.ts'
import { detectBackendWithRetry, getBackendUrl } from '../utils/envConfig.ts'

// 定义用户类型
export interface User {
  id: number
  name: string
  role: 'admin' | 'operator'
}

// 定义认证状态类型
interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (username: string) => Promise<boolean>
  logout: () => void
  hasRole: (role: 'admin' | 'operator') => boolean
  isAuthenticated: boolean
}

// 创建注入键
export const AuthInjectionKey: InjectionKey<AuthState> = Symbol('auth')

// 创建认证状态
export function createAuth() {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  // 初始状态设为true，避免SSR和客户端初始化时的闪烁
  const isLoading = ref(true)

  // 登出函数
  const logout = () => {
    user.value = null
    token.value = null
    
    // 安全清除localStorage
    if (isLocalStorageAvailable()) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
    
    // 调用后端登出接口
    if (token.value) {
      apiRequest('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      }).catch(console.error)
    }
  }

  // 验证token有效性
  const validateToken = async (tokenToValidate: string) => {
    try {
      const response = await apiRequest('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`,
        },
      })

      if (!response.ok) {
        console.warn('Token验证失败，自动登出')
        logout()
      }
    } catch (error) {
      console.error('Token验证错误:', error)
      logout()
    }
  }

  // 初始化认证状态
  const initAuth = async () => {
    // 只在客户端环境下执行认证检查
    if (typeof window === 'undefined') {
      return
    }

    console.log('🔑 AuthComposable 客户端初始化...')
    isLoading.value = true

    try {
      // 在Electron环境下检测后端连接
      if ((window as any).ELECTRON_ENV) {
        console.log('🔍 Electron环境：开始检测后端连接...')
        try {
          const availableBackend = await Promise.race([
            detectBackendWithRetry(2), // 减少重试次数
            new Promise(resolve => setTimeout(() => resolve(null), 5000)) // 5秒超时
          ])
          if (availableBackend) {
            console.log('✅ 后端检测成功:', availableBackend)
          } else {
            console.warn('⚠️ 后端检测失败或超时，将使用默认地址')
            // 设置默认后端地址
            ;(window as any).BACKEND_URL = getBackendUrl()
          }
        } catch (error) {
          console.warn('⚠️ 后端检测异常:', error)
          // 设置默认后端地址
          ;(window as any).BACKEND_URL = getBackendUrl()
        }
      }
      
      // 检查localStorage是否可用
      if (isLocalStorageAvailable()) {
        const storedToken = localStorage.getItem('auth_token')
        const storedUser = localStorage.getItem('auth_user')
        
        console.log('📦 存储的认证数据:', { hasToken: !!storedToken, hasUser: !!storedUser })
        
        if (storedToken && storedUser) {
          try {
            token.value = storedToken
            user.value = JSON.parse(storedUser)
            console.log('✅ 从存储恢复认证状态')
            // 验证token有效性（可能失败，但不影响加载状态）
            validateToken(storedToken).catch(() => {
              console.warn('⚠️ Token验证失败，但继续加载应用')
            })
          } catch (error) {
            console.error('解析存储的用户信息失败:', error)
            logout()
          }
        } else {
          console.log('❌ 没有找到存储的认证信息')
        }
      } else {
        console.warn('⚠️ localStorage 不可用，跳过认证恢复')
      }
    } catch (error) {
      console.error('❌ 访问localStorage失败:', error)
    } finally {
      // 无论如何都要结束loading状态
      isLoading.value = false
      console.log('✅ AuthComposable 初始化完成')
    }
  }

  // 登录函数
  const login = async (username: string): Promise<boolean> => {
    try {
      isLoading.value = true
      
      console.log('🔐 开始登录，用户名:', username)
      
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ name: username }),
      })

      console.log('📡 收到响应:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      let data: any = {}
      
      // 安全地解析JSON响应
      try {
        const text = await response.text()
        console.log('📝 响应文本:', text)
        
        if (text) {
          data = JSON.parse(text)
          console.log('📊 解析后的数据:', data)
        }
      } catch (jsonError) {
        console.error('JSON解析失败:', jsonError)
        console.error('响应状态:', response.status, response.statusText)
      }

      if (response.ok && data.token && data.user) {
        token.value = data.token
        user.value = data.user
        
        // 存储到localStorage（检查可用性）
        if (isLocalStorageAvailable()) {
          localStorage.setItem('auth_token', data.token)
          localStorage.setItem('auth_user', JSON.stringify(data.user))
        }
        
        console.log('✅ 登录成功:', data.user)
        return true
      } else {
        const errorMsg = data.error || data.message || `服务器错误 (${response.status})`
        console.error('❌ 登录失败:', errorMsg)
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('登录错误:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 检查用户角色
  const hasRole = (role: 'admin' | 'operator'): boolean => {
    if (!user.value) return false
    if (role === 'operator') {
      return user.value.role === 'admin' || user.value.role === 'operator'
    }
    return user.value.role === role
  }

  // 计算属性 - 考虑初始化状态，避免闪烁
  const isAuthenticated = computed(() => {
    // 如果正在加载中，返回true避免显示登录界面
    if (isLoading.value) {
      return true
    }
    return !!user.value && !!token.value
  })

  // 在组件挂载时初始化
  onMounted(() => {
    // 立即开始初始化，不设置超时保护
    initAuth()
  })

  // 如果在客户端环境，立即开始初始化
  if (typeof window !== 'undefined') {
    // 使用 nextTick 确保在 Vue 组件挂载后执行
    import('vue').then(({ nextTick }) => {
      nextTick(() => {
        initAuth()
      })
    })
  }

  return {
    user,
    token,
    isLoading,
    login,
    logout,
    hasRole,
    isAuthenticated
  }
}

// 使用认证状态的组合式API
export function useAuth(): AuthState {
  const auth = inject(AuthInjectionKey)
  if (!auth) {
    throw new Error('useAuth必须在AuthProvider内部使用')
  }
  return auth
}