import { defineComponent, type PropType } from 'vue'

export type StatusType = 'empty' | 'pending' | 'in_progress' | 'completed'

export interface StatusIndicatorProps {
  status: StatusType
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onClick?: () => void
  showLabel?: boolean
  className?: string
}

const statusConfig = {
  empty: {
    color: 'bg-transparent border-gray-300',
    icon: '',
    label: '空白',
    textColor: 'text-gray-400'
  },
  pending: {
    color: 'bg-gray-200 border-gray-400',
    icon: '○',
    label: '待处理',
    textColor: 'text-gray-600'
  },
  in_progress: {
    color: 'bg-status-warning',
    icon: '●',
    label: '进行中',
    textColor: 'text-white'
  },
  completed: {
    color: 'bg-status-success',
    icon: '✓',
    label: '已完成',
    textColor: 'text-white'
  }
}

export const StatusIndicator = defineComponent({
  name: 'StatusIndicator',
  props: {
    status: {
      type: String as PropType<StatusType>,
      required: true
    },
    size: {
      type: String as PropType<StatusIndicatorProps['size']>,
      default: 'md'
    },
    interactive: {
      type: Boolean,
      default: false
    },
    onClick: {
      type: Function as PropType<() => void>
    },
    showLabel: {
      type: Boolean,
      default: false
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const config = statusConfig[props.status]
    
    const sizeClasses = {
      sm: 'w-4 h-4 text-xs',
      md: 'w-6 h-6 text-sm',
      lg: 'w-8 h-8 text-base'
    }

    const baseClasses = `
      ${sizeClasses[props.size!]} ${config.color} ${config.textColor}
      rounded-full flex items-center justify-center font-medium
      transition-all duration-200
      ${props.status === 'pending' || props.status === 'empty' ? 'border-2' : ''}
      ${props.interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}
    `

    const handleClick = () => {
      if (props.onClick) {
        props.onClick()
      }
    }

    const IndicatorElement = () => (
      <div
        class={`${baseClasses} ${props.className}`}
        onClick={handleClick}
        style={{
          transform: 'scale(1)',
          animation: 'statusEnter 0.3s ease-out'
        }}
      >
        {props.status === 'pending' || props.status === 'empty' ? null : config.icon}
      </div>
    )

    if (props.showLabel) {
      return () => (
        <div class="flex items-center space-x-2">
          <IndicatorElement />
          <span class="text-sm text-text-secondary font-medium">
            {config.label}
          </span>
        </div>
      )
    }

    return IndicatorElement
  }
})

// 状态切换组件
export interface StatusToggleProps {
  status: StatusType
  onChange: (newStatus: StatusType) => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

export const StatusToggle = defineComponent({
  name: 'StatusToggle',
  props: {
    status: {
      type: String as PropType<StatusType>,
      required: true
    },
    onChange: {
      type: Function as PropType<(newStatus: StatusType) => void>,
      required: true
    },
    size: {
      type: String as PropType<StatusToggleProps['size']>,
      default: 'md'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const getNextStatus = (current: StatusType): StatusType => {
      switch (current) {
        case 'empty':
          return 'pending'
        case 'pending':
          return 'in_progress'
        case 'in_progress':
          return 'completed'
        case 'completed':
          return 'empty'
        default:
          return 'empty'
      }
    }

    const handleClick = () => {
      if (props.disabled) return
      const nextStatus = getNextStatus(props.status)
      props.onChange(nextStatus)
    }

    return () => (
      <StatusIndicator
        status={props.status}
        size={props.size}
        interactive={!props.disabled}
        onClick={handleClick}
        className={`${props.className} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    )
  }
})