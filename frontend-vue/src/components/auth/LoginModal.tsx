import { defineComponent, ref } from 'vue'
import { Transition } from 'vue'
import { useAuth } from '../../composables/useAuth.ts'
import { Button, Input } from '../ui/index.ts'
import { UserIcon } from '@heroicons/vue/24/outline'

export const LoginModal = defineComponent({
  name: 'LoginModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    }
  },
  setup(props) {
    const { login } = useAuth()
    const usernameRef = ref('')
    const errorRef = ref('')
    const loginLoading = ref(false) // 独立的登录加载状态

    // 创建计算属性来处理响应式数据
    const username = usernameRef
    const error = errorRef

    const handleSubmit = async (e: Event) => {
      e.preventDefault()
      const usernameVal = username.value || ''
      if (!usernameVal.trim()) {
        error.value = '请输入用户名'
        return
      }

      error.value = ''
      loginLoading.value = true // 开始登录加载
      
      try {
        const success = await login(usernameVal)
        if (!success) {
          error.value = '登录失败，请重试'
        }
      } finally {
        loginLoading.value = false // 结束登录加载
      }
      // 登录成功后模态框会自动关闭（通过isAuthenticated状态变化）
    }


    return () => (
      <Transition
        enterActiveClass="transition-all duration-200"
        leaveActiveClass="transition-all duration-200"
        enterFromClass="opacity-0"
        enterToClass="opacity-100"
        leaveFromClass="opacity-100"
        leaveToClass="opacity-0"
      >
        {props.isOpen && (
          <div
            class="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
          >
            {/* 毛玻璃背景 */}
            <div class="absolute inset-0 backdrop-blur-md" />
            
            {/* 登录卡片 */}
            <div
              class="relative w-full max-w-md mx-4 opacity-0 scale-95 translate-y-5"
              style={{
                animation: 'loginCardEnter 0.3s ease-out forwards'
              }}
            >
              <div 
                class="rounded-2xl p-8 shadow-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                {/* 标题 */}
                <div class="text-center mb-8">
                  <h1 class="text-2xl font-bold text-gray-900 mb-2">
                    激光切割生产管理系统
                  </h1>
                  <p class="text-gray-600 text-sm">
                    请输入用户名登录系统
                  </p>
                </div>

                {/* 登录表单 */}
                <form onSubmit={handleSubmit} class="space-y-6">
                  {/* 用户名输入 */}
                  <Input
                    label="用户名"
                    modelValue={username.value}
                    onUpdate:modelValue={(value: string) => {
                      username.value = value
                      error.value = ''
                    }}
                    placeholder="请输入用户名"
                    leftIcon={<UserIcon class="w-5 h-5" />}
                    error={error.value}
                  />

                  {/* 登录按钮 */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={!(username.value || '').trim() || loginLoading.value}
                    loading={loginLoading.value}
                    class="w-full"
                  >
                    {loginLoading.value ? '登录中...' : '登录系统'}
                  </Button>
                </form>

                {/* 底部信息 */}
                <div class="mt-6 text-center">
                  <p class="text-xs text-gray-500">
                    激光切割生产管理系统 v1.0
                  </p>
                </div>
              </div>
            </div>

            {/* CSS动画样式 - 使用内联样式 */}
            <style>
              {`
                @keyframes loginCardEnter {
                  to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                  }
                }
              `}
            </style>
          </div>
        )}
      </Transition>
    )
  }
})

export default LoginModal