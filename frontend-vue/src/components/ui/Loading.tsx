import { defineComponent, type PropType } from 'vue'

export interface LoadingProps {
  type?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'ring' | 'wave'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white' | 'gray'
  text?: string
  overlay?: boolean
  className?: string
}

export const Loading = defineComponent({
  name: 'Loading',
  props: {
    type: {
      type: String as PropType<LoadingProps['type']>,
      default: 'spinner'
    },
    size: {
      type: String as PropType<LoadingProps['size']>,
      default: 'md'
    },
    color: {
      type: String as PropType<LoadingProps['color']>,
      default: 'primary'
    },
    text: String,
    overlay: {
      type: Boolean,
      default: false
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const sizeClasses = {
      xs: { loader: 'w-4 h-4', text: 'text-xs' },
      sm: { loader: 'w-5 h-5', text: 'text-sm' },
      md: { loader: 'w-6 h-6', text: 'text-base' },
      lg: { loader: 'w-8 h-8', text: 'text-lg' },
      xl: { loader: 'w-12 h-12', text: 'text-xl' }
    }

    const colorClasses = {
      primary: 'text-ios18-blue border-ios18-blue',
      secondary: 'text-gray-600 border-gray-600',
      white: 'text-white border-white',
      gray: 'text-gray-400 border-gray-400'
    }

    // 旋转加载器
    const SpinnerLoader = () => (
      <div
        class={`${sizeClasses[props.size!].loader} border-2 border-t-transparent rounded-full ${colorClasses[props.color!]} animate-spin`}
      />
    )

    // 点状加载器
    const DotsLoader = () => (
      <div class={`flex space-x-1 ${sizeClasses[props.size!].loader}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            class={`w-2 h-2 rounded-full ${colorClasses[props.color!].split(' ')[0]} bg-current animate-bounce`}
            style={{
              animationDelay: `${i * 0.15}s`
            }}
          />
        ))}
      </div>
    )

    // 脉冲加载器
    const PulseLoader = () => (
      <div
        class={`${sizeClasses[props.size!].loader} rounded-full ${colorClasses[props.color!].split(' ')[0]} bg-current animate-pulse`}
      />
    )

    // 条状加载器
    const BarsLoader = () => (
      <div class={`flex items-end space-x-1 ${sizeClasses[props.size!].loader}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            class={`w-1 bg-current ${colorClasses[props.color!].split(' ')[0]}`}
            style={{
              height: '40%',
              animation: `barScale 1s infinite ${i * 0.1}s`
            }}
          />
        ))}
      </div>
    )

    // 环形加载器
    const RingLoader = () => (
      <div class={`relative ${sizeClasses[props.size!].loader}`}>
        <div
          class={`absolute inset-0 border-2 border-t-transparent rounded-full ${colorClasses[props.color!]} animate-spin`}
        />
        <div
          class={`absolute inset-1 border-2 border-b-transparent rounded-full ${colorClasses[props.color!]} opacity-60`}
          style={{
            animation: 'spin 1.5s linear infinite reverse'
          }}
        />
      </div>
    )

    // 波浪加载器
    const WaveLoader = () => (
      <div class={`flex items-center space-x-1 ${sizeClasses[props.size!].loader}`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            class={`w-1 h-4 bg-current ${colorClasses[props.color!].split(' ')[0]}`}
            style={{
              animation: `wave 0.8s infinite ${i * 0.1}s`
            }}
          />
        ))}
      </div>
    )

    // 获取加载器组件
    const getLoader = () => {
      switch (props.type) {
        case 'dots': return <DotsLoader />
        case 'pulse': return <PulseLoader />
        case 'bars': return <BarsLoader />
        case 'ring': return <RingLoader />
        case 'wave': return <WaveLoader />
        default: return <SpinnerLoader />
      }
    }

    const content = () => (
      <div class={`flex flex-col items-center space-y-3 ${props.className}`}>
        {getLoader()}
        {props.text && (
          <p class={`${sizeClasses[props.size!].text} ${colorClasses[props.color!].split(' ')[0]} font-medium`}>
            {props.text}
          </p>
        )}
      </div>
    )

    if (props.overlay) {
      return () => (
        <div class="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div class="bg-white rounded-ios-2xl p-8 shadow-ios-2xl">
            {content()}
          </div>
        </div>
      )
    }

    return content
  }
})

// 预设的加载组件
export const LoadingSpinner = defineComponent({
  name: 'LoadingSpinner',
  props: {
    size: String as PropType<LoadingProps['size']>,
    color: String as PropType<LoadingProps['color']>,
    text: String,
    className: String
  },
  setup(props) {
    return () => <Loading type="spinner" {...props} />
  }
})

export const LoadingDots = defineComponent({
  name: 'LoadingDots',
  props: {
    size: String as PropType<LoadingProps['size']>,
    color: String as PropType<LoadingProps['color']>,
    text: String,
    className: String
  },
  setup(props) {
    return () => <Loading type="dots" {...props} />
  }
})

export const LoadingPulse = defineComponent({
  name: 'LoadingPulse',
  props: {
    size: String as PropType<LoadingProps['size']>,
    color: String as PropType<LoadingProps['color']>,
    text: String,
    className: String
  },
  setup(props) {
    return () => <Loading type="pulse" {...props} />
  }
})

export const LoadingBars = defineComponent({
  name: 'LoadingBars',
  props: {
    size: String as PropType<LoadingProps['size']>,
    color: String as PropType<LoadingProps['color']>,
    text: String,
    className: String
  },
  setup(props) {
    return () => <Loading type="bars" {...props} />
  }
})

export const LoadingOverlay = defineComponent({
  name: 'LoadingOverlay',
  props: {
    type: String as PropType<LoadingProps['type']>,
    size: String as PropType<LoadingProps['size']>,
    color: String as PropType<LoadingProps['color']>,
    text: String,
    className: String
  },
  setup(props) {
    return () => <Loading overlay {...props} />
  }
})

// 按钮内加载器
export const ButtonLoading = defineComponent({
  name: 'ButtonLoading',
  props: {
    size: {
      type: String as PropType<LoadingProps['size']>,
      default: 'sm'
    }
  },
  setup(props) {
    return () => <Loading type="spinner" size={props.size} color="white" className="mr-2" />
  }
})

// 页面加载器
export const PageLoading = defineComponent({
  name: 'PageLoading',
  props: {
    text: {
      type: String,
      default: '加载中...'
    }
  },
  setup(props) {
    return () => (
      <div class="flex items-center justify-center min-h-screen">
        <Loading type="spinner" size="lg" text={props.text} />
      </div>
    )
  }
})

// 内容加载器
export const ContentLoading = defineComponent({
  name: 'ContentLoading',
  props: {
    lines: {
      type: Number,
      default: 3
    }
  },
  setup(props) {
    return () => (
      <div class="space-y-3 p-4">
        {Array.from({ length: props.lines }).map((_, i) => (
          <div
            key={i}
            class="h-4 bg-gray-200 rounded animate-pulse"
            style={{ 
              width: i === props.lines - 1 ? '60%' : '100%',
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>
    )
  }
})