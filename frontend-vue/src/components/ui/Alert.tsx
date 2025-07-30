import { defineComponent, type PropType, type VNode } from 'vue'
import { Transition } from 'vue'

export interface AlertProps {
  children?: VNode
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'error' | 'primary'
  title?: string
  onClose?: () => void
  closable?: boolean
  icon?: VNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Alert = defineComponent({
  name: 'Alert',
  props: {
    variant: {
      type: String as PropType<'info' | 'success' | 'warning' | 'danger' | 'error' | 'primary'>,
      default: 'info'
    },
    title: String,
    onClose: Function as PropType<() => void>,
    closable: {
      type: Boolean,
      default: false
    },
    icon: Object as PropType<VNode>,
    className: {
      type: String,
      default: ''
    },
    size: {
      type: String as PropType<'sm' | 'md' | 'lg'>,
      default: 'md'
    }
  },
  setup(props, { slots }) {
    const variantStyles = {
      info: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-200',
        icon: '💡'
      },
      primary: {
        bg: 'bg-ios18-blue/10 dark:bg-ios18-blue/20',
        border: 'border-ios18-blue/30 dark:border-ios18-blue/50',
        text: 'text-ios18-blue dark:text-ios18-blue',
        icon: '🚀'
      },
      success: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-800 dark:text-green-200',
        icon: '✅'
      },
      warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-800 dark:text-yellow-200',
        icon: '⚠️'
      },
      danger: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-200',
        icon: '❌'
      },
      error: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-200',
        icon: '❌'
      }
    }

    const sizeStyles = {
      sm: 'p-2 text-sm',
      md: 'p-4 text-base',
      lg: 'p-6 text-lg'
    }

    return () => {
      const style = variantStyles[props.variant]
      const sizeStyle = sizeStyles[props.size]
      const defaultIcon = props.icon || style.icon

      return (
        <Transition
          enterActiveClass="transition-all duration-300"
          leaveActiveClass="transition-all duration-300"
          enterFromClass="opacity-0 -translate-y-2 scale-95"
          enterToClass="opacity-100 translate-y-0 scale-100"
          leaveFromClass="opacity-100 translate-y-0 scale-100"
          leaveToClass="opacity-0 -translate-y-2 scale-95"
        >
          <div
            class={`
              ${style.bg} ${style.border} ${style.text}
              border rounded-ios-xl ${sizeStyle}
              backdrop-blur-sm
              ${props.className}
            `}
          >
            <div class="flex items-start space-x-3">
              {/* 图标 */}
              {defaultIcon && (
                <div class="flex-shrink-0 mt-0.5">
                  {typeof defaultIcon === 'string' ? (
                    <span class="text-lg">{defaultIcon}</span>
                  ) : (
                    defaultIcon
                  )}
                </div>
              )}
              
              {/* 内容 */}
              <div class="flex-1 min-w-0">
                {props.title && (
                  <h4 class="font-semibold text-sm mb-1">
                    {props.title}
                  </h4>
                )}
                <div class="text-sm leading-relaxed">
                  {slots.default?.()}
                </div>
              </div>
              
              {/* 关闭按钮 */}
              {props.closable && props.onClose && (
                <button
                  onClick={props.onClose}
                  class={`
                    flex-shrink-0 p-1 rounded-lg
                    ${style.text} hover:bg-black/5 dark:hover:bg-white/5
                    transition-all duration-200 hover:scale-110 active:scale-90
                  `}
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </Transition>
      )
    }
  }
})