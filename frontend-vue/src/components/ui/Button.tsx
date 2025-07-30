import { defineComponent, type PropType } from 'vue'

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: (event: MouseEvent) => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export const Button = defineComponent({
  name: 'Button',
  props: {
    variant: {
      type: String as PropType<ButtonProps['variant']>,
      default: 'primary'
    },
    size: {
      type: String as PropType<ButtonProps['size']>,
      default: 'md'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    onClick: {
      type: Function as PropType<ButtonProps['onClick']>
    },
    className: {
      type: String,
      default: ''
    },
    type: {
      type: String as PropType<ButtonProps['type']>,
      default: 'button'
    }
  },
  setup(props, { slots, emit }) {
    const baseClasses = `
      inline-flex items-center justify-center font-medium rounded-ios-lg
      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ios18-blue focus:ring-opacity-50
      disabled:opacity-50 disabled:cursor-not-allowed
    `

    const variantClasses = {
      primary: `
        bg-ios18-blue text-white shadow-ios-md
        hover:bg-opacity-90 hover:shadow-ios-lg
        active:scale-95
      `,
      secondary: `
        bg-transparent text-ios18-blue border border-ios18-blue
        hover:bg-ios18-blue hover:bg-opacity-10
        active:scale-95
      `,
      outline: `
        bg-transparent text-ios18-blue border border-ios18-blue
        hover:bg-ios18-blue hover:bg-opacity-10
        active:scale-95
      `,
      danger: `
        bg-status-error text-white shadow-ios-md
        hover:bg-opacity-90 hover:shadow-ios-lg
        active:scale-95
      `,
      success: `
        bg-status-success text-white shadow-ios-md
        hover:bg-opacity-90 hover:shadow-ios-lg
        active:scale-95
      `,
      ghost: `
        bg-transparent text-text-primary
        hover:bg-macos15-control
        active:scale-95
      `
    }

    const sizeClasses = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    }

    const handleClick = (event: MouseEvent) => {
      if (props.disabled || props.loading) return
      
      if (props.onClick) {
        props.onClick(event)
      }
      
      emit('click', event)
    }

    return () => (
      <button
        type={props.type}
        class={`${baseClasses} ${variantClasses[props.variant!]} ${sizeClasses[props.size!]} ${props.className}`}
        onClick={handleClick}
        disabled={props.disabled || props.loading}
        style={{
          transform: props.disabled || props.loading ? 'none' : undefined
        }}
      >
        {props.loading ? (
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>加载中...</span>
          </div>
        ) : (
          slots.default?.()
        )}
      </button>
    )
  }
})