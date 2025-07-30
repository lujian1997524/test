import { defineComponent, ref, watch, onMounted, onUnmounted } from 'vue'
import { Transition, TransitionGroup } from 'vue'
import { useNotificationStore } from '../../stores/notificationStore.ts'
import type { NotificationMessage } from '../../utils/sseManager.ts'
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline'

// 内置图标映射
const iconMap = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon
}

// 样式映射（采用设计系统Notification组件风格）
const styleMap = {
  success: {
    icon: 'text-green-500',
    bg: 'bg-green-50 border-green-200',
    title: 'text-green-800',
    message: 'text-green-700',
    borderColor: 'border-l-green-500',
    progressBg: 'bg-green-400'
  },
  error: {
    icon: 'text-red-500',
    bg: 'bg-red-50 border-red-200',
    title: 'text-red-800',
    message: 'text-red-700',
    borderColor: 'border-l-red-500',
    progressBg: 'bg-red-400'
  },
  warning: {
    icon: 'text-yellow-500',
    bg: 'bg-yellow-50 border-yellow-200',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
    borderColor: 'border-l-yellow-500',
    progressBg: 'bg-yellow-400'
  },
  info: {
    icon: 'text-blue-500',
    bg: 'bg-blue-50 border-blue-200',
    title: 'text-blue-800',
    message: 'text-blue-700',
    borderColor: 'border-l-blue-500',
    progressBg: 'bg-blue-400'
  }
}

// 单个通知项组件
const NotificationItem = defineComponent({
  name: 'NotificationItem',
  props: {
    notification: {
      type: Object as () => NotificationMessage,
      required: true
    },
    onClose: {
      type: Function as () => (() => void),
      required: true
    },
    onClick: {
      type: Function as () => (() => void),
      default: undefined
    }
  },
  setup(props) {
    const isVisible = ref(true)
    
    const styles = styleMap[props.notification.type]
    const IconComponent = iconMap[props.notification.type]

    const handleClick = () => {
      if (props.notification.onClick) {
        props.notification.onClick()
      } else if (props.onClick) {
        props.onClick()
      }
      handleClose()
    }

    const handleClose = () => {
      isVisible.value = false
      setTimeout(() => props.onClose(), 300) // 等待动画完成
    }

    return () => (
      <Transition
        enterActiveClass="transition-all duration-300 ease-out"
        leaveActiveClass="transition-all duration-300 ease-in"
        enterFromClass="opacity-0 translate-x-96 scale-75"
        enterToClass="opacity-100 translate-x-0 scale-100"
        leaveFromClass="opacity-100 translate-x-0 scale-100"
        leaveToClass="opacity-0 translate-x-96 scale-75"
      >
        {isVisible.value && (
          <div
            class={`
              relative w-full max-w-sm
              ${styles.bg}
              border-l-4 ${styles.borderColor}
              backdrop-blur-lg
              rounded-lg shadow-lg
              p-4 mb-3
              cursor-pointer
              hover:shadow-xl
              transition-all duration-200
            `}
            onClick={handleClick}
          >
            <div class="flex items-start space-x-3">
              {/* 图标 */}
              <div class={`flex-shrink-0 ${styles.icon}`}>
                <IconComponent class="w-5 h-5" />
              </div>
              
              {/* 内容 */}
              <div class="flex-1 min-w-0">
                <div class={`font-semibold text-sm ${styles.title} mb-1`}>
                  {props.notification.title}
                </div>
                <div class={`text-sm ${styles.message} leading-relaxed`}>
                  {props.notification.message}
                </div>
                <div class="text-gray-500 text-xs mt-2">
                  {new Date(props.notification.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {/* 关闭按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClose()
                }}
                class={`
                  flex-shrink-0 p-1 rounded-full
                  ${styles.icon} hover:bg-black/10
                  transition-colors duration-200
                `}
              >
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>
            
            {/* 进度条（如果有持续时间）*/}
            {props.notification.duration && props.notification.duration > 0 && (
              <div
                class={`
                  absolute bottom-0 left-0 h-1 
                  ${styles.progressBg}
                  rounded-bl-lg
                  animate-pulse
                `}
                style={{
                  animation: `shrink ${props.notification.duration / 1000}s linear forwards`
                }}
              />
            )}
          </div>
        )}
      </Transition>
    )
  }
})

// 通知容器组件
export const NotificationContainer = defineComponent({
  name: 'NotificationContainer',
  setup() {
    const { notifications, removeNotification } = useNotificationStore()

    // 调试日志：监控通知数组变化
    watch(notifications, (newNotifications) => {
      console.log('📱 NotificationContainer - 通知列表更新:', (newNotifications || []).map(n => ({
        id: n.id,
        title: n.title,
        timestamp: n.timestamp
      })))
    }, { deep: true })

    return () => (
      <div class="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none">
        <TransitionGroup
          enterActiveClass="transition-all duration-300 ease-out"
          leaveActiveClass="transition-all duration-300 ease-in"
          enterFromClass="opacity-0 translate-x-96 scale-75"
          enterToClass="opacity-100 translate-x-0 scale-100"
          leaveFromClass="opacity-100 translate-x-0 scale-100"
          leaveToClass="opacity-0 translate-x-96 scale-75"
          moveClass="transition-transform duration-300"
        >
          {(notifications || []).map((notification) => {
            console.log('🗝️ 渲染通知key:', notification.id)
            return (
              <div key={notification.id} class="pointer-events-auto">
                <NotificationItem
                  notification={notification}
                  onClose={() => removeNotification(notification.id)}
                />
              </div>
            )
          })}
        </TransitionGroup>
      </div>
    )
  }
})

// SSE连接状态指示器组件
export const SSEConnectionIndicator = defineComponent({
  name: 'SSEConnectionIndicator',
  setup() {
    const { isSSEConnected } = useNotificationStore()

    return () => {
      if (isSSEConnected.value) {
        // 连接正常时不显示
        return null
      }

      return (
        <Transition
          enterActiveClass="transition-all duration-300"
          leaveActiveClass="transition-all duration-200"
          enterFromClass="opacity-0 translate-y-5"
          enterToClass="opacity-100 translate-y-0"
          leaveFromClass="opacity-100 translate-y-0"
          leaveToClass="opacity-0 translate-y-5"
        >
          <div class="fixed bottom-6 left-6 z-50 pointer-events-none">
            <div class="bg-red-50 border border-red-200 border-l-4 border-l-red-500 backdrop-blur-lg rounded-lg shadow-lg px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span class="text-red-700 text-sm font-medium">
                  实时同步已断开
                </span>
              </div>
            </div>
          </div>
        </Transition>
      )
    }
  }
})

export default NotificationContainer