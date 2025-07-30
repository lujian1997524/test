import { defineComponent, computed, type PropType } from 'vue'

export interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'linear' | 'circular'
  color?: 'primary' | 'success' | 'warning' | 'danger'
  showLabel?: boolean
  label?: string
  animated?: boolean
  striped?: boolean
  className?: string
}

export const ProgressBar = defineComponent({
  name: 'ProgressBar',
  props: {
    value: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      default: 100
    },
    size: {
      type: String as PropType<'sm' | 'md' | 'lg'>,
      default: 'md'
    },
    variant: {
      type: String as PropType<'linear' | 'circular'>,
      default: 'linear'
    },
    color: {
      type: String as PropType<'primary' | 'success' | 'warning' | 'danger'>,
      default: 'primary'
    },
    showLabel: {
      type: Boolean,
      default: false
    },
    label: String,
    animated: {
      type: Boolean,
      default: true
    },
    striped: {
      type: Boolean,
      default: false
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const percentage = computed(() => Math.min(Math.max((props.value / props.max) * 100, 0), 100))

    const colorClasses = {
      primary: 'bg-ios18-blue',
      success: 'bg-ios18-teal',
      warning: 'bg-yellow-500',
      danger: 'bg-red-500'
    }

    const sizeClasses = {
      sm: props.variant === 'linear' ? 'h-1' : 'w-8 h-8',
      md: props.variant === 'linear' ? 'h-2' : 'w-12 h-12',
      lg: props.variant === 'linear' ? 'h-3' : 'w-16 h-16'
    }

    return () => {
      if (props.variant === 'circular') {
        const circleSize = {
          sm: { size: 32, strokeWidth: 3 },
          md: { size: 48, strokeWidth: 4 },
          lg: { size: 64, strokeWidth: 5 }
        }
        
        const { size: circlePixelSize, strokeWidth } = circleSize[props.size]
        const radius = (circlePixelSize - strokeWidth) / 2
        const circumference = radius * 2 * Math.PI
        const strokeDashoffset = circumference - (percentage.value / 100) * circumference

        return (
          <div class={`relative inline-flex items-center justify-center ${props.className}`}>
            <svg
              class="transform -rotate-90"
              width={circlePixelSize}
              height={circlePixelSize}
            >
              {/* 背景圆环 */}
              <circle
                cx={circlePixelSize / 2}
                cy={circlePixelSize / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="transparent"
                class="text-gray-200 dark:text-gray-700"
              />
              {/* 进度圆环 */}
              <circle
                cx={circlePixelSize / 2}
                cy={circlePixelSize / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                class={`${colorClasses[props.color]} transition-all duration-1000 ease-in-out`}
                style={{
                  strokeDashoffset: props.animated ? strokeDashoffset : circumference - (percentage.value / 100) * circumference
                }}
              />
            </svg>
            {/* 中心文字 */}
            {props.showLabel && (
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-xs font-semibold text-text-primary">
                  {props.label || `${Math.round(percentage.value)}%`}
                </span>
              </div>
            )}
          </div>
        )
      }

      // 线性进度条
      return (
        <div class={props.className}>
          {/* 标签 */}
          {(props.showLabel || props.label) && (
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm text-text-secondary">
                {props.label || '进度'}
              </span>
              <span class="text-sm font-medium text-text-primary">
                {Math.round(percentage.value)}%
              </span>
            </div>
          )}
          
          {/* 进度条容器 */}
          <div class={`
            ${sizeClasses[props.size]}
            bg-gray-200 dark:bg-gray-700
            rounded-full overflow-hidden
            shadow-inner
          `}>
            {/* 进度条填充 */}
            <div
              class={`
                h-full ${colorClasses[props.color]} rounded-full
                ${props.striped ? 'bg-stripes' : ''}
                ${props.animated && props.striped ? 'animate-stripes' : ''}
                shadow-sm transition-all duration-1000 ease-in-out
              `}
              style={{
                width: `${percentage.value}%`,
                backgroundImage: props.striped ? 
                  'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)' :
                  undefined,
                backgroundSize: props.striped ? '1rem 1rem' : undefined
              }}
            />
          </div>
        </div>
      )
    }
  }
})

// 预定义的进度条组合
export const ProgressWithSteps = defineComponent({
  name: 'ProgressWithSteps',
  props: {
    steps: {
      type: Array as PropType<Array<{ label: string; completed: boolean }>>,
      required: true
    },
    currentStep: {
      type: Number,
      required: true
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const progress = computed(() => ((props.currentStep + 1) / props.steps.length) * 100)

    return () => (
      <div class={props.className}>
        <ProgressBar 
          value={progress.value} 
          animated 
          showLabel 
          label={`步骤 ${props.currentStep + 1} / ${props.steps.length}`}
        />
        <div class="flex justify-between mt-2">
          {props.steps.map((step, index) => (
            <div 
              key={index}
              class={`text-xs ${
                index <= props.currentStep ? 'text-ios18-blue font-medium' : 'text-gray-400'
              }`}
            >
              {step.label}
            </div>
          ))}
        </div>
      </div>
    )
  }
})