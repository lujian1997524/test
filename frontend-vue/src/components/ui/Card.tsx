import { defineComponent, type PropType } from 'vue'

export interface CardProps {
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
  glass?: boolean
}

export const Card = defineComponent({
  name: 'Card',
  props: {
    className: {
      type: String,
      default: ''
    },
    padding: {
      type: String as PropType<CardProps['padding']>,
      default: 'md'
    },
    hoverable: {
      type: Boolean,
      default: false
    },
    glass: {
      type: Boolean,
      default: true
    }
  },
  setup(props, { slots }) {
    const baseClasses = `
      rounded-ios-xl border border-white border-opacity-20
      transition-all duration-200
    `

    const glassClasses = props.glass ? `
      bg-bg-card backdrop-blur-glass
      shadow-ios-md
    ` : `
      bg-white shadow-ios-md
    `

    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    }

    const hoverClasses = props.hoverable ? `
      hover:shadow-ios-lg hover:scale-105 cursor-pointer
    ` : ''

    return () => (
      <div
        class={`${baseClasses} ${glassClasses} ${paddingClasses[props.padding!]} ${hoverClasses} ${props.className}`}
        style={{
          transform: props.hoverable ? 'scale(1)' : undefined,
          transition: 'all 0.2s ease'
        }}
      >
        {slots.default?.()}
      </div>
    )
  }
})