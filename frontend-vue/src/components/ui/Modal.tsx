import { defineComponent, type PropType, onMounted, onUnmounted, Teleport, Transition } from 'vue'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  closable?: boolean
  maskClosable?: boolean
  footer?: any
  className?: string
}

export const Modal = defineComponent({
  name: 'Modal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true
    },
    title: String,
    size: {
      type: String as PropType<ModalProps['size']>,
      default: 'md'
    },
    closable: {
      type: Boolean,
      default: true
    },
    maskClosable: {
      type: Boolean,
      default: true
    },
    footer: Object,
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots }) {
    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      '2xl': 'max-w-6xl',
      '3xl': 'max-w-7xl max-h-[80vh]',
      full: 'max-w-[95vw] max-h-[95vh]'
    }

    // 处理 ESC 键关闭
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && props.closable && props.isOpen) {
        props.onClose()
      }
    }

    onMounted(() => {
      if (props.isOpen) {
        document.addEventListener('keydown', handleEscape)
        document.body.style.overflow = 'hidden'
      }
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    })

    const handleMaskClick = () => {
      if (props.maskClosable) {
        props.onClose()
      }
    }

    const handleContentClick = (e: Event) => {
      e.stopPropagation()
    }

    return () => (
      <Teleport to="body">
        <Transition
          enterActiveClass="transition-opacity duration-200"
          leaveActiveClass="transition-opacity duration-200"
          enterFromClass="opacity-0"
          enterToClass="opacity-100"
          leaveFromClass="opacity-100"
          leaveToClass="opacity-0"
        >
          {props.isOpen && (
            <div class="fixed inset-0 z-50 overflow-y-auto">
              {/* 遮罩层 */}
              <div
                class="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleMaskClick}
              />
              
              {/* 模态框容器 */}
              <div class="flex min-h-full items-center justify-center p-4">
                <div
                  class={`
                    relative w-full ${sizeClasses[props.size!]}
                    bg-white/95 backdrop-blur-xl
                    rounded-ios-2xl shadow-ios-2xl
                    border border-white/20
                    ${props.className}
                  `}
                  style={{
                    animation: 'modalEnter 0.3s ease-out'
                  }}
                  onClick={handleContentClick}
                >
                  {/* 标题栏 */}
                  {(props.title || props.closable) && (
                    <div class="flex items-center justify-between p-6 border-b border-gray-200/50">
                      <h3 class="text-xl font-semibold text-gray-900">
                        {props.title}
                      </h3>
                      {props.closable && (
                        <button
                          onClick={props.onClose}
                          class="p-2 hover:bg-gray-100/50 rounded-ios-lg transition-colors"
                        >
                          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* 内容区域 */}
                  <div class={`p-6 ${props.size === '3xl' ? 'max-h-[60vh] overflow-y-auto' : ''}`}>
                    {slots.default?.()}
                  </div>
                  
                  {/* 底部操作区 */}
                  {props.footer && (
                    <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200/50">
                      {props.footer}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Transition>
      </Teleport>
    )
  }
})

// 确认对话框组件
export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'danger'
}

export const ConfirmModal = defineComponent({
  name: 'ConfirmModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true
    },
    onConfirm: {
      type: Function as PropType<() => void>,
      required: true
    },
    title: String,
    message: {
      type: String,
      required: true
    },
    confirmText: {
      type: String,
      default: '确认'
    },
    cancelText: {
      type: String,
      default: '取消'
    },
    type: {
      type: String as PropType<ConfirmModalProps['type']>,
      default: 'info'
    }
  },
  setup(props) {
    const typeStyles = {
      info: {
        icon: 'ℹ️',
        confirmBg: 'bg-ios18-blue hover:bg-blue-600'
      },
      warning: {
        icon: '⚠️',
        confirmBg: 'bg-yellow-500 hover:bg-yellow-600'
      },
      danger: {
        icon: '❌',
        confirmBg: 'bg-red-500 hover:bg-red-600'
      }
    }

    const style = typeStyles[props.type!]

    const handleConfirm = () => {
      props.onConfirm()
      props.onClose()
    }

    return () => (
      <Modal
        isOpen={props.isOpen}
        onClose={props.onClose}
        title={props.title}
        size="sm"
      >
        <div class="text-center space-y-4">
          <div class="text-4xl">{style.icon}</div>
          <p class="text-gray-700 text-base leading-relaxed">
            {props.message}
          </p>
        </div>
        
        <div class="flex items-center justify-center space-x-3 mt-6">
          <button
            onClick={props.onClose}
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-ios-lg hover:bg-gray-200 transition-colors font-medium"
          >
            {props.cancelText}
          </button>
          <button
            onClick={handleConfirm}
            class={`px-4 py-2 ${style.confirmBg} text-white rounded-ios-lg transition-colors font-medium`}
          >
            {props.confirmText}
          </button>
        </div>
      </Modal>
    )
  }
})