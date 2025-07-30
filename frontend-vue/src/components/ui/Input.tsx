import { defineComponent, type PropType, ref } from 'vue'

export interface InputProps {
  label?: string
  error?: string
  hint?: string
  leftIcon?: any
  rightIcon?: any
  variant?: 'default' | 'filled' | 'glass'
  multiline?: boolean
  rows?: number
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const Input = defineComponent({
  name: 'Input',
  props: {
    label: String,
    error: String,
    hint: String,
    leftIcon: Object,
    rightIcon: Object,
    variant: {
      type: String as PropType<InputProps['variant']>,
      default: 'default'
    },
    multiline: {
      type: Boolean,
      default: false
    },
    rows: {
      type: Number,
      default: 3
    },
    modelValue: String,
    placeholder: String,
    disabled: Boolean,
    className: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'focus', 'blur', 'input'],
  setup(props, { emit, slots }) {
    const inputRef = ref<HTMLInputElement>()
    const textareaRef = ref<HTMLTextAreaElement>()

    const baseClasses = `
      w-full px-4 py-3 rounded-ios-lg border transition-all duration-200
      font-system text-base
      focus:outline-none focus:ring-2 focus:ring-ios18-blue focus:ring-opacity-50
      disabled:opacity-50 disabled:cursor-not-allowed
    `

    const variantClasses = {
      default: `
        bg-white border-macos15-separator
        focus:border-ios18-blue focus:bg-white
        hover:border-ios18-blue hover:border-opacity-50
      `,
      filled: `
        bg-macos15-control border-transparent
        focus:border-ios18-blue focus:bg-white
        hover:bg-opacity-80
      `,
      glass: `
        bg-bg-glass backdrop-blur-glass border-white border-opacity-20
        focus:border-ios18-blue focus:bg-white focus:bg-opacity-90
        hover:bg-white hover:bg-opacity-30
      `
    }

    const errorClasses = props.error ? 'border-status-error focus:ring-status-error' : ''

    const handleInput = (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement
      emit('update:modelValue', target.value)
      emit('input', event)
    }

    const handleFocus = (event: FocusEvent) => {
      emit('focus', event)
    }

    const handleBlur = (event: FocusEvent) => {
      emit('blur', event)
    }

    return () => (
      <div class="w-full">
        {props.label && (
          <label class="block text-sm font-medium text-text-primary mb-2">
            {props.label}
          </label>
        )}
        
        <div class="relative">
          {props.leftIcon && (
            <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
              {props.leftIcon}
            </div>
          )}
          
          {props.multiline ? (
            <textarea
              ref={textareaRef}
              rows={props.rows}
              class={`
                ${baseClasses} 
                ${variantClasses[props.variant!]} 
                ${errorClasses}
                ${props.leftIcon ? 'pl-10' : ''}
                ${props.rightIcon ? 'pr-10' : ''}
                ${props.className}
                resize-none
              `}
              value={props.modelValue}
              placeholder={props.placeholder}
              disabled={props.disabled}
              onInput={handleInput}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          ) : (
            <input
              ref={inputRef}
              class={`
                ${baseClasses} 
                ${variantClasses[props.variant!]} 
                ${errorClasses}
                ${props.leftIcon ? 'pl-10' : ''}
                ${props.rightIcon ? 'pr-10' : ''}
                ${props.className}
              `}
              value={props.modelValue}
              placeholder={props.placeholder}
              disabled={props.disabled}
              onInput={handleInput}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          )}
          
          {props.rightIcon && (
            <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
              {props.rightIcon}
            </div>
          )}
        </div>
        
        {props.error && (
          <p class="mt-2 text-sm text-status-error">
            {props.error}
          </p>
        )}
        
        {props.hint && !props.error && (
          <p class="mt-2 text-sm text-text-secondary">
            {props.hint}
          </p>
        )}
      </div>
    )
  }
})