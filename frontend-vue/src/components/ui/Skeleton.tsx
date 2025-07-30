import { defineComponent, type PropType, type CSSProperties } from 'vue'

export interface SkeletonProps {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded'
  animation?: 'pulse' | 'wave' | 'none'
  lines?: number
  avatar?: boolean
  className?: string
}

export const Skeleton = defineComponent({
  name: 'Skeleton',
  props: {
    width: [String, Number],
    height: [String, Number],
    variant: {
      type: String as PropType<SkeletonProps['variant']>,
      default: 'text'
    },
    animation: {
      type: String as PropType<SkeletonProps['animation']>,
      default: 'pulse'
    },
    lines: {
      type: Number,
      default: 1
    },
    avatar: {
      type: Boolean,
      default: false
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const baseClasses = 'bg-gray-200 dark:bg-gray-700'
    
    const variantClasses = {
      text: 'rounded',
      rectangular: 'rounded-none',
      circular: 'rounded-full',
      rounded: 'rounded-ios-lg'
    }

    const getAnimationClasses = () => {
      switch (props.animation) {
        case 'pulse':
          return 'animate-pulse'
        case 'wave':
          return 'animate-shimmer'
        default:
          return ''
      }
    }

    const getSize = (): CSSProperties => {
      const style: CSSProperties = {}
      if (props.width) style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
      if (props.height) style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
      return style
    }

    const getDefaultSize = () => {
      switch (props.variant) {
        case 'text':
          return { height: '1em', width: '100%' }
        case 'circular':
          return { width: '40px', height: '40px' }
        default:
          return { height: '1.2em', width: '100%' }
      }
    }

    return () => {
      // 如果是头像骨架屏
      if (props.avatar) {
        return (
          <div class={`flex items-center space-x-3 ${props.className}`}>
            <div
              class={`
                w-10 h-10 ${baseClasses} ${variantClasses.circular} ${getAnimationClasses()}
              `}
            />
            <div class="flex-1 space-y-2">
              <div
                class={`
                  h-4 ${baseClasses} ${variantClasses.rounded} ${getAnimationClasses()}
                `}
                style={{ width: '60%' }}
              />
              <div
                class={`
                  h-3 ${baseClasses} ${variantClasses.rounded} ${getAnimationClasses()}
                `}
                style={{ width: '40%' }}
              />
            </div>
          </div>
        )
      }

      // 多行文本骨架屏
      if (props.lines > 1) {
        return (
          <div class={`space-y-2 ${props.className}`}>
            {Array.from({ length: props.lines }).map((_, index) => (
              <div
                key={index}
                class={`
                  ${baseClasses} ${variantClasses[props.variant!]} ${getAnimationClasses()}
                `}
                style={{
                  height: props.height ? (typeof props.height === 'number' ? `${props.height}px` : props.height) : '1em',
                  width: index === props.lines - 1 ? '60%' : '100%'
                }}
              />
            ))}
          </div>
        )
      }

      // 单个骨架屏
      return (
        <div
          class={`
            ${baseClasses} ${variantClasses[props.variant!]} ${getAnimationClasses()} ${props.className}
          `}
          style={{ ...getDefaultSize(), ...getSize() }}
        />
      )
    }
  }
})

// 预定义的骨架屏组合
export const SkeletonCard = defineComponent({
  name: 'SkeletonCard',
  props: {
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    return () => (
      <div class={`p-4 border border-gray-200 rounded-ios-xl ${props.className}`}>
        <div class="space-y-3">
          <Skeleton height="12px" width="60%" />
          <Skeleton height="8px" lines={2} />
          <div class="flex justify-between items-center mt-4">
            <Skeleton height="8px" width="30%" />
            <Skeleton height="20px" width="60px" variant="rounded" />
          </div>
        </div>
      </div>
    )
  }
})

export const SkeletonList = defineComponent({
  name: 'SkeletonList',
  props: {
    items: {
      type: Number,
      default: 3
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    return () => (
      <div class={`space-y-4 ${props.className}`}>
        {Array.from({ length: props.items }).map((_, index) => (
          <Skeleton key={index} avatar />
        ))}
      </div>
    )
  }
})