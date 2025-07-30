import { defineComponent, type PropType } from 'vue'

export interface SwitchProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

export const Switch = defineComponent({
  name: 'Switch',
  props: {
    checked: {
      type: Boolean,
      default: false
    },
    onChange: {
      type: Function as PropType<(checked: boolean) => void>
    },
    disabled: {
      type: Boolean,
      default: false
    },
    size: {
      type: String as PropType<SwitchProps['size']>,
      default: 'md'
    },
    label: String,
    className: {
      type: String,
      default: ''
    }
  },
  emits: ['update:checked', 'change'],
  setup(props, { emit }) {
    const sizeClasses = {
      sm: {
        track: 'w-10 h-6',
        thumb: 'w-4 h-4',
        translate: 'translate-x-4'
      },
      md: {
        track: 'w-12 h-7',
        thumb: 'w-5 h-5',
        translate: 'translate-x-5'
      },
      lg: {
        track: 'w-14 h-8',
        thumb: 'w-6 h-6',
        translate: 'translate-x-6'
      }
    }

    const trackClasses = `
      ${sizeClasses[props.size!].track}
      relative inline-flex items-center rounded-full
      transition-colors duration-300 ease-in-out
      ${props.checked 
        ? 'bg-ios18-blue shadow-inner' 
        : 'bg-gray-200 dark:bg-gray-700'
      }
      ${props.disabled 
        ? 'opacity-50 cursor-not-allowed' 
        : 'cursor-pointer'
      }
    `

    const thumbClasses = `
      ${sizeClasses[props.size!].thumb}
      bg-white rounded-full shadow-lg
      transform transition-transform duration-300 ease-in-out
      ${props.checked ? sizeClasses[props.size!].translate : 'translate-x-1'}
    `

    const handleClick = () => {
      if (!props.disabled) {
        const newValue = !props.checked
        if (props.onChange) {
          props.onChange(newValue)
        }
        emit('update:checked', newValue)
        emit('change', newValue)
      }
    }

    const switchElement = () => (
      <div
        class={trackClasses}
        onClick={handleClick}
        aria-checked={props.checked}
        role="switch"
        style={{
          transform: props.disabled ? 'none' : 'scale(1)'
        }}
      >
        <div
          class={thumbClasses}
          style={{
            transition: 'transform 0.3s ease-in-out'
          }}
        />
      </div>
    )

    return () => {
      if (props.label) {
        return (
          <div class={`flex items-center space-x-3 ${props.className}`}>
            {switchElement()}
            <label 
              class={`text-text-primary font-medium ${props.disabled ? 'opacity-50' : 'cursor-pointer'}`}
              onClick={handleClick}
            >
              {props.label}
            </label>
          </div>
        )
      }

      return <div class={props.className}>{switchElement()}</div>
    }
  }
})