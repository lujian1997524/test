import { defineComponent, ref, onMounted, onUnmounted, nextTick, type PropType } from 'vue'
import { Teleport, Transition } from 'vue'
import { Button } from '../ui/index.ts'
import { useAuth } from '../../composables/useAuth.ts'
import {
  UserIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ChevronUpIcon,
  ShieldCheckIcon
} from '@heroicons/vue/24/outline'

interface UserMenuProps {
  onProfileClick?: () => void
  onSettingsClick?: () => void
  className?: string
}

export const UserMenu = defineComponent({
  name: 'UserMenu',
  props: {
    onProfileClick: Function as PropType<() => void>,
    onSettingsClick: Function as PropType<() => void>,
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { emit }) {
    const isOpen = ref(false)
    const { user, logout } = useAuth()
    const menuRef = ref<HTMLDivElement>()
    const buttonRef = ref<HTMLButtonElement>()
    const menuPosition = ref({ top: 0, left: 0 })

    // 计算菜单位置
    const calculateMenuPosition = () => {
      if (buttonRef.value) {
        const rect = buttonRef.value.getBoundingClientRect()
        const menuWidth = 192 // w-48 = 12rem = 192px
        const menuHeight = 200 // 估计高度
        
        let left = rect.right + 8 // ml-2 = 8px
        let top = rect.bottom - menuHeight // 从底部向上对齐
        
        // 确保菜单不会超出视窗
        if (left + menuWidth > window.innerWidth) {
          left = rect.left - menuWidth - 8
        }
        
        if (top < 0) {
          top = rect.top
        }
        
        menuPosition.value = { top, left }
      }
    }

    // 点击外部关闭菜单
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
        isOpen.value = false
      }
    }

    onMounted(() => {
      document.addEventListener('mousedown', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('mousedown', handleClickOutside)
    })

    const handleLogout = () => {
      if (confirm('确定要退出登录吗？')) {
        logout()
        isOpen.value = false
      }
    }

    const menuItems = [
      {
        icon: UserIcon,
        label: '个人信息',
        onClick: () => {
          props.onProfileClick?.()
          isOpen.value = false
        }
      },
      {
        icon: CogIcon,
        label: '系统设置',
        onClick: () => {
          props.onSettingsClick?.()
          isOpen.value = false
        }
      },
      {
        icon: ArrowRightOnRectangleIcon,
        label: '退出登录',
        onClick: handleLogout,
        className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
      }
    ]

    return () => (
      <div ref={menuRef} class={`relative ${props.className}`}>
        {/* 用户头像按钮 */}
        <button
          ref={buttonRef}
          onClick={() => {
            if (!isOpen.value) {
              calculateMenuPosition()
            }
            isOpen.value = !isOpen.value
          }}
          class={`
            w-12 h-12 rounded-lg bg-white/50 flex items-center justify-center group relative transition-all duration-200
            ${isOpen.value ? 'bg-ios18-blue/10 border border-ios18-blue/20' : 'hover:bg-gray-100'}
          `}
        >
          <div class="w-8 h-8 rounded-full bg-ios18-blue flex items-center justify-center">
            <span class="text-white text-sm font-medium">
              {user.value?.name?.charAt(0)}
            </span>
          </div>
          
          {/* 展开指示器 */}
          <ChevronUpIcon 
            class={`
              absolute -top-1 -right-1 w-3 h-3 text-gray-400 transition-transform duration-200
              ${isOpen.value ? 'rotate-0' : 'rotate-180'}
            `}
          />
          
          {/* Tooltip */}
          {!isOpen.value && (
            <div class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
              {user.value?.name} ({user.value?.role === 'admin' ? '管理员' : '操作员'})
            </div>
          )}
        </button>

        {/* 用户菜单 - 使用Portal渲染到body避免被任何容器遮挡 */}
        <Teleport to="body">
          <Transition
            enterActiveClass="transition-all duration-[150ms]"
            leaveActiveClass="transition-all duration-[150ms]"
            enterFromClass="opacity-0 scale-95 translate-y-2"
            enterToClass="opacity-100 scale-100 translate-y-0"
            leaveFromClass="opacity-100 scale-100 translate-y-0"
            leaveToClass="opacity-0 scale-95 translate-y-2"
          >
            {isOpen.value && (
              <div
                class="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
                style={{ 
                  top: `${menuPosition.value.top}px`,
                  left: `${menuPosition.value.left}px`,
                  backgroundColor: 'white',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  zIndex: 99999
                }}
              >
                {/* 用户信息头部 */}
                <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full bg-ios18-blue flex items-center justify-center">
                      <span class="text-white text-sm font-medium">
                        {user.value?.name?.charAt(0)}
                      </span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="font-medium text-gray-900 truncate">
                        {user.value?.name}
                      </div>
                      <div class="flex items-center text-xs text-gray-500">
                        {user.value?.role === 'admin' && (
                          <ShieldCheckIcon class="w-3 h-3 mr-1" />
                        )}
                        {user.value?.role === 'admin' ? '管理员' : '操作员'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 菜单项 */}
                <div class="py-1">
                  {menuItems.map((item, index) => {
                    const IconComponent = item.icon
                    
                    return (
                      <button
                        key={index}
                        onClick={item.onClick}
                        class={`
                          w-full flex items-center px-4 py-2 text-sm text-left transition-colors
                          ${item.className || 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}
                        `}
                      >
                        <IconComponent class="w-4 h-4 mr-3" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </Transition>
        </Teleport>
      </div>
    )
  }
})