import { defineComponent, type PropType } from 'vue'

export interface EmptyProps {
  image?: any | string
  title?: string
  description?: string
  action?: any
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// 预设的空状态图标
const EmptyIcons = {
  default: (
    <svg class="w-full h-full text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  noData: (
    <svg class="w-full h-full text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  noResults: (
    <svg class="w-full h-full text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  noFiles: (
    <svg class="w-full h-full text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  noNotifications: (
    <svg class="w-full h-full text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  network: (
    <svg class="w-full h-full text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
    </svg>
  )
}

export const Empty = defineComponent({
  name: 'Empty',
  props: {
    image: [Object, String],
    title: {
      type: String,
      default: '暂无数据'
    },
    description: String,
    action: Object,
    size: {
      type: String as PropType<EmptyProps['size']>,
      default: 'md'
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const sizeClasses = {
      sm: {
        container: 'py-8',
        image: 'w-16 h-16 mb-4',
        title: 'text-base',
        description: 'text-sm'
      },
      md: {
        container: 'py-12',
        image: 'w-20 h-20 mb-6',
        title: 'text-lg',
        description: 'text-base'
      },
      lg: {
        container: 'py-16',
        image: 'w-24 h-24 mb-8',
        title: 'text-xl',
        description: 'text-lg'
      }
    }

    // 获取图像内容
    const getImageContent = () => {
      if (!props.image) return EmptyIcons.default
      
      if (typeof props.image === 'string') {
        // 如果是预设图标名称
        if (props.image in EmptyIcons) {
          return EmptyIcons[props.image as keyof typeof EmptyIcons]
        }
        // 如果是图片URL
        return <img src={props.image} alt="Empty" class="w-full h-full object-contain" />
      }
      
      return props.image
    }

    return () => (
      <div
        class={`
          flex flex-col items-center justify-center text-center
          ${sizeClasses[props.size!].container} ${props.className}
        `}
        style={{
          opacity: 0,
          transform: 'translateY(20px)',
          animation: 'emptyEnter 0.4s ease-out forwards'
        }}
      >
        {/* 图像 */}
        <div
          class={`${sizeClasses[props.size!].image} flex items-center justify-center`}
          style={{
            transform: 'scale(0.8)',
            animation: 'emptyImageEnter 0.4s ease-out 0.1s forwards'
          }}
        >
          {getImageContent()}
        </div>

        {/* 标题 */}
        <h3
          class={`font-semibold text-gray-900 mb-2 ${sizeClasses[props.size!].title}`}
          style={{
            opacity: 0,
            animation: 'emptyTextEnter 0.4s ease-out 0.2s forwards'
          }}
        >
          {props.title}
        </h3>

        {/* 描述 */}
        {props.description && (
          <p
            class={`text-gray-500 mb-6 max-w-md leading-relaxed ${sizeClasses[props.size!].description}`}
            style={{
              opacity: 0,
              animation: 'emptyTextEnter 0.4s ease-out 0.3s forwards'
            }}
          >
            {props.description}
          </p>
        )}

        {/* 操作按钮 */}
        {props.action && (
          <div
            style={{
              opacity: 0,
              transform: 'translateY(10px)',
              animation: 'emptyActionEnter 0.4s ease-out 0.4s forwards'
            }}
          >
            {props.action}
          </div>
        )}
      </div>
    )
  }
})

// 预设的空状态组件
export const EmptyData = defineComponent({
  name: 'EmptyData',
  props: {
    title: String,
    description: String,
    action: Object,
    size: String as PropType<EmptyProps['size']>,
    className: String
  },
  setup(props) {
    return () => <Empty image="noData" title="暂无数据" {...props} />
  }
})

export const EmptySearch = defineComponent({
  name: 'EmptySearch',
  props: {
    title: String,
    description: String,
    action: Object,
    size: String as PropType<EmptyProps['size']>,
    className: String
  },
  setup(props) {
    return () => (
      <Empty 
        image="noResults" 
        title="未找到相关结果" 
        description="尝试调整搜索条件或使用其他关键词"
        {...props} 
      />
    )
  }
})

export const EmptyFiles = defineComponent({
  name: 'EmptyFiles',
  props: {
    title: String,
    description: String,
    action: Object,
    size: String as PropType<EmptyProps['size']>,
    className: String
  },
  setup(props) {
    return () => (
      <Empty 
        image="noFiles" 
        title="暂无文件" 
        description="还没有上传任何文件"
        {...props} 
      />
    )
  }
})

export const EmptyNotifications = defineComponent({
  name: 'EmptyNotifications',
  props: {
    title: String,
    description: String,
    action: Object,
    size: String as PropType<EmptyProps['size']>,
    className: String
  },
  setup(props) {
    return () => (
      <Empty 
        image="noNotifications" 
        title="暂无通知" 
        description="您已查看所有通知"
        {...props} 
      />
    )
  }
})

export const NetworkError = defineComponent({
  name: 'NetworkError',
  props: {
    title: String,
    description: String,
    action: Object,
    size: String as PropType<EmptyProps['size']>,
    className: String
  },
  setup(props) {
    return () => (
      <Empty 
        image="network" 
        title="网络连接失败" 
        description="请检查您的网络连接并重试"
        {...props} 
      />
    )
  }
})