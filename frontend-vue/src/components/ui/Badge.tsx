import { defineComponent, type PropType, computed } from 'vue'

export interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  count?: number
  maxCount?: number
  className?: string
}

export const Badge = defineComponent({
  name: 'Badge',
  props: {
    variant: {
      type: String as PropType<BadgeProps['variant']>,
      default: 'primary'
    },
    size: {
      type: String as PropType<BadgeProps['size']>,
      default: 'md'
    },
    dot: {
      type: Boolean,
      default: false
    },
    count: Number,
    maxCount: {
      type: Number,
      default: 99
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots }) {
    const variantClasses = {
      primary: 'bg-ios18-blue text-white',
      secondary: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      success: 'bg-ios18-teal text-white',
      warning: 'bg-yellow-500 text-white',
      danger: 'bg-red-500 text-white',
      info: 'bg-ios18-indigo text-white',
      outline: 'bg-transparent border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
    }

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base'
    }

    const dotSizeClasses = {
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3'
    }

    const displayCount = computed(() => {
      if (props.count !== undefined) {
        return props.count > props.maxCount ? `${props.maxCount}+` : props.count.toString()
      }
      return ''
    })

    const badgeContent = () => {
      if (props.dot) {
        return (
          <div
            class={`${dotSizeClasses[props.size!]} ${variantClasses[props.variant!]} rounded-full`}
            style={{
              animation: 'badgeEnter 0.3s spring'
            }}
          />
        )
      } else {
        return (
          <span
            class={`
              ${sizeClasses[props.size!]} ${variantClasses[props.variant!]}
              inline-flex items-center justify-center
              rounded-full font-medium leading-none
              shadow-sm
            `}
            style={{
              animation: 'badgeEnter 0.3s spring'
            }}
          >
            {props.count !== undefined ? displayCount.value : slots.default?.()}
          </span>
        )
      }
    }

    return () => {
      // 如果是数字徽章且没有内容，只显示徽章
      if (props.count !== undefined && !slots.default) {
        return <div class={props.className}>{badgeContent()}</div>
      }

      // 如果是点徽章且没有内容，只显示徽章
      if (props.dot && !slots.default) {
        return <div class={props.className}>{badgeContent()}</div>
      }

      // 如果有子元素，作为相对定位的容器
      if (slots.default && (props.count !== undefined || props.dot)) {
        return (
          <div class={`relative inline-flex ${props.className}`}>
            {slots.default()}
            <div class="absolute -top-1 -right-1 z-10">
              {badgeContent()}
            </div>
          </div>
        )
      }

      return <div class={props.className}>{badgeContent()}</div>
    }
  }
})