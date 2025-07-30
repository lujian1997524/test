import { defineComponent, type PropType } from 'vue'

interface FormProps {
  onSubmit?: (e: Event) => void
  className?: string
}

export const Form = defineComponent({
  name: 'Form',
  props: {
    onSubmit: Function as PropType<(e: Event) => void>,
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots }) {
    const handleSubmit = (e: Event) => {
      e.preventDefault()
      props.onSubmit?.(e)
    }

    return () => (
      <form onSubmit={handleSubmit} class={`space-y-6 ${props.className}`}>
        {slots.default?.()}
      </form>
    )
  }
})

interface FormFieldProps {
  label?: string
  required?: boolean
  error?: string
  help?: string
  className?: string
}

export const FormField = defineComponent({
  name: 'FormField',
  props: {
    label: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    help: {
      type: String,
      default: ''
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots }) {
    return () => (
      <div class={`space-y-1 ${props.className}`}>
        {props.label && (
          <label class="block text-sm font-medium text-gray-700">
            {props.label}
            {props.required && <span class="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div class="relative">
          {slots.default?.()}
        </div>
        
        {props.error && (
          <div class="text-sm text-red-600">{props.error}</div>
        )}
        
        {props.help && !props.error && (
          <div class="text-sm text-gray-500">{props.help}</div>
        )}
      </div>
    )
  }
})

interface FormActionsProps {
  align?: 'left' | 'right' | 'center'
  className?: string
}

export const FormActions = defineComponent({
  name: 'FormActions',
  props: {
    align: {
      type: String as PropType<'left' | 'right' | 'center'>,
      default: 'right'
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots }) {
    const alignClass = {
      left: 'justify-start',
      right: 'justify-end',
      center: 'justify-center'
    }[props.align]

    return () => (
      <div class={`flex items-center space-x-3 ${alignClass} ${props.className}`}>
        {slots.default?.()}
      </div>
    )
  }
})

export default { Form, FormField, FormActions }