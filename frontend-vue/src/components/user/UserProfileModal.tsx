import { defineComponent, ref, watch, onMounted, type PropType } from 'vue'
import { Transition } from 'vue'
import { Button, Input, Modal } from '../ui/index.ts'
import { useAuth } from '../../composables/useAuth.ts'
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

interface UserProfile {
  name: string
  phone?: string
  email?: string
  department?: string
  position?: string
}

export const UserProfileModal = defineComponent({
  name: 'UserProfileModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true
    }
  },
  setup(props) {
    const { user, token } = useAuth()
    
    const profile = ref<UserProfile>({
      name: user.value?.name || '',
      phone: '',
      email: '',
      department: '',
      position: ''
    })
    const tempProfile = ref<UserProfile>(profile.value)
    const loading = ref(false)
    const saving = ref(false)
    const result = ref<{
      success: boolean
      message: string
    } | null>(null)

    // 获取用户详细信息
    const fetchUserProfile = async () => {
      if (!token.value || !user.value?.id) return
      
      try {
        loading.value = true
        const response = await fetch(`http://110.40.71.83:35001/api/users/${user.value.id}`, {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const userProfile = {
            name: data.user?.name || user.value.name || '',
            phone: data.user?.phone || '',
            email: data.user?.email || '',
            department: data.user?.department || '',
            position: data.user?.position || ''
          }
          profile.value = userProfile
          tempProfile.value = userProfile
        } else {
          console.error('获取用户信息失败')
          // 使用基本用户信息作为备用
          const basicProfile = {
            name: user.value.name || '',
            phone: '',
            email: '',
            department: '',
            position: ''
          }
          profile.value = basicProfile
          tempProfile.value = basicProfile
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        // 使用基本用户信息作为备用
        const basicProfile = {
          name: user.value.name || '',
          phone: '',
          email: '',
          department: '',
          position: ''
        }
        profile.value = basicProfile
        tempProfile.value = basicProfile
      } finally {
        loading.value = false
      }
    }

    // 保存用户信息
    const handleSave = async () => {
      if (!token.value || !user.value?.id) return

      // 验证必填字段
      if (!tempProfile.value.name.trim()) {
        result.value = {
          success: false,
          message: '姓名不能为空'
        }
        return
      }

      try {
        saving.value = true
        result.value = null
        
        const response = await fetch(`http://110.40.71.83:35001/api/users/${user.value.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.value}`
          },
          body: JSON.stringify({
            name: tempProfile.value.name.trim(),
            phone: tempProfile.value.phone?.trim() || null,
            email: tempProfile.value.email?.trim() || null,
            department: tempProfile.value.department?.trim() || null,
            position: tempProfile.value.position?.trim() || null
          })
        })

        if (response.ok) {
          profile.value = tempProfile.value
          result.value = {
            success: true,
            message: '个人信息保存成功'
          }
          
          // 2秒后关闭模态框
          setTimeout(() => {
            props.onClose()
          }, 2000)
        } else {
          const errorData = await response.json()
          result.value = {
            success: false,
            message: `保存失败: ${errorData.message || '未知错误'}`
          }
        }
      } catch (error) {
        console.error('保存用户信息失败:', error)
        result.value = {
          success: false,
          message: '保存失败，请重试'
        }
      } finally {
        saving.value = false
      }
    }

    // 重置表单
    const handleReset = () => {
      tempProfile.value = profile.value
      result.value = null
    }

    // 监听模态框打开状态
    watch(() => props.isOpen, (newVal) => {
      if (newVal) {
        fetchUserProfile()
      }
    })

    return () => (
      <Modal
        isOpen={props.isOpen}
        onClose={props.onClose}
        title="个人信息"
        size="md"
      >
        <div class="space-y-6">
          {/* 用户基本信息显示 */}
          <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div class="w-16 h-16 rounded-full bg-ios18-blue flex items-center justify-center">
              <span class="text-white text-xl font-bold">
                {user.value?.name?.charAt(0)}
              </span>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{user.value?.name}</h3>
              <div class="flex items-center text-sm text-gray-600 mt-1">
                {user.value?.role === 'admin' && (
                  <ShieldCheckIcon class="w-4 h-4 mr-1" />
                )}
                <span>{user.value?.role === 'admin' ? '管理员' : '操作员'}</span>
              </div>
            </div>
          </div>

          {loading.value ? (
            <div class="space-y-4 animate-pulse">
              <div class="h-20 bg-gray-200 rounded"></div>
              <div class="h-20 bg-gray-200 rounded"></div>
              <div class="h-20 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <div class="space-y-4">
              {/* 姓名 */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon class="w-4 h-4 inline mr-1" />
                  姓名 *
                </label>
                <Input
                  type="text"
                  value={tempProfile.value.name}
                  onChange={(e) => tempProfile.value = {
                    ...tempProfile.value,
                    name: e.target.value
                  }}
                  placeholder="请输入姓名"
                  required
                />
              </div>

              {/* 手机号码 */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <PhoneIcon class="w-4 h-4 inline mr-1" />
                  手机号码
                </label>
                <Input
                  type="tel"
                  value={tempProfile.value.phone || ''}
                  onChange={(e) => tempProfile.value = {
                    ...tempProfile.value,
                    phone: e.target.value
                  }}
                  placeholder="请输入手机号码"
                />
              </div>

              {/* 邮箱 */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <EnvelopeIcon class="w-4 h-4 inline mr-1" />
                  邮箱地址
                </label>
                <Input
                  type="email"
                  value={tempProfile.value.email || ''}
                  onChange={(e) => tempProfile.value = {
                    ...tempProfile.value,
                    email: e.target.value
                  }}
                  placeholder="请输入邮箱地址"
                />
              </div>

              {/* 部门 */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <BuildingOfficeIcon class="w-4 h-4 inline mr-1" />
                  所属部门
                </label>
                <Input
                  type="text"
                  value={tempProfile.value.department || ''}
                  onChange={(e) => tempProfile.value = {
                    ...tempProfile.value,
                    department: e.target.value
                  }}
                  placeholder="请输入所属部门"
                />
              </div>

              {/* 职位 */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  职位
                </label>
                <Input
                  type="text"
                  value={tempProfile.value.position || ''}
                  onChange={(e) => tempProfile.value = {
                    ...tempProfile.value,
                    position: e.target.value
                  }}
                  placeholder="请输入职位"
                />
              </div>
            </div>
          )}

          {/* 保存结果提示 */}
          {result.value && (
            <Transition
              enterActiveClass="transition-all duration-300"
              leaveActiveClass="transition-all duration-200"
              enterFromClass="opacity-0 translate-y-2"
              enterToClass="opacity-100 translate-y-0"
              leaveFromClass="opacity-100 translate-y-0"
              leaveToClass="opacity-0 translate-y-2"
            >
              <div
                class={`p-3 rounded-lg flex items-center space-x-2 ${
                  result.value.success 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {result.value.success ? (
                  <CheckCircleIcon class="w-5 h-5" />
                ) : (
                  <ExclamationTriangleIcon class="w-5 h-5" />
                )}
                <span class="text-sm">{result.value.message}</span>
              </div>
            </Transition>
          )}
        </div>

        {/* 操作按钮 */}
        <div class="flex justify-end space-x-2 pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={loading.value || saving.value}
          >
            重置
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving.value}
            disabled={loading.value || saving.value || !tempProfile.value.name.trim()}
          >
            保存
          </Button>
        </div>
      </Modal>
    )
  }
})

export default UserProfileModal