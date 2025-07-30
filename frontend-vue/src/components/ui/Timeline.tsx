import { defineComponent, type PropType, type VNode } from 'vue'
import { Transition, TransitionGroup } from 'vue'

export interface TimelineItem {
  id: string
  title: string
  description?: string
  timestamp?: string | Date
  icon?: VNode
  color?: string
  status?: 'success' | 'error' | 'warning' | 'info' | 'pending'
  content?: VNode
  actions?: VNode
}

export interface TimelineProps {
  items: TimelineItem[]
  mode?: 'left' | 'right' | 'alternate'
  size?: 'sm' | 'md' | 'lg'
  reverse?: boolean
  pending?: VNode
  className?: string
}

export const Timeline = defineComponent({
  name: 'Timeline',
  props: {
    items: {
      type: Array as PropType<TimelineItem[]>,
      required: true
    },
    mode: {
      type: String as PropType<'left' | 'right' | 'alternate'>,
      default: 'left'
    },
    size: {
      type: String as PropType<'sm' | 'md' | 'lg'>,
      default: 'md'
    },
    reverse: {
      type: Boolean,
      default: false
    },
    pending: Object as PropType<VNode>,
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots }) {
    const sizeClasses = {
      sm: {
        dot: 'w-3 h-3',
        title: 'text-sm',
        description: 'text-xs',
        timestamp: 'text-xs',
        spacing: 'space-y-4',
        dotSpacing: 'mt-1.5'
      },
      md: {
        dot: 'w-4 h-4',
        title: 'text-base',
        description: 'text-sm',
        timestamp: 'text-sm',
        spacing: 'space-y-6',
        dotSpacing: 'mt-2'
      },
      lg: {
        dot: 'w-5 h-5',
        title: 'text-lg',
        description: 'text-base',
        timestamp: 'text-base',
        spacing: 'space-y-8',
        dotSpacing: 'mt-2.5'
      }
    }

    const statusColors = {
      success: 'bg-green-500 border-green-500',
      error: 'bg-red-500 border-red-500',
      warning: 'bg-yellow-500 border-yellow-500',
      info: 'bg-blue-500 border-blue-500',
      pending: 'bg-gray-300 border-gray-300'
    }

    const defaultStatusIcons = {
      success: (
        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ),
      error: (
        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      warning: (
        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      info: (
        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      pending: (
        <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }

    const formatTimestamp = (timestamp: string | Date) => {
      if (!timestamp) return ''
      
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getItemPosition = (index: number) => {
      if (props.mode === 'alternate') {
        return index % 2 === 0 ? 'left' : 'right'
      }
      return props.mode
    }

    const renderTimelineItem = (item: TimelineItem, index: number, isLast: boolean) => {
      const position = getItemPosition(index)
      const statusColor = item.status ? statusColors[item.status] : statusColors.info
      const customColor = item.color ? `bg-${item.color} border-${item.color}` : statusColor

      return (
        <div
          key={item.id}
          class={`relative flex ${position === 'right' ? 'flex-row-reverse' : ''}`}
          style={{
            opacity: 0,
            transform: 'translateY(20px)',
            animation: `fadeInUp 0.3s ease-out forwards ${index * 0.1}s`
          }}
        >
          {/* 时间轴线 */}
          <div class="flex flex-col items-center">
            {/* 圆点 */}
            <div
              class={`
                ${sizeClasses[props.size].dot} rounded-full border-2 flex items-center justify-center
                ${customColor} relative z-10 flex-shrink-0
                ${sizeClasses[props.size].dotSpacing}
              `}
              style={{
                transform: 'scale(0)',
                animation: `scaleIn 0.2s ease-out forwards ${index * 0.1 + 0.2}s`
              }}
            >
              {item.icon || (item.status && defaultStatusIcons[item.status]) || (
                <div class="w-2 h-2 bg-white rounded-full" />
              )}
            </div>

            {/* 连接线 */}
            {!isLast && (
              <div
                class="w-0.5 bg-gray-200 flex-1 mt-2"
                style={{ 
                  minHeight: '24px',
                  transformOrigin: 'top',
                  transform: 'scaleY(0)',
                  animation: `scaleY 0.3s ease-out forwards ${index * 0.1 + 0.3}s`
                }}
              />
            )}
          </div>

          {/* 内容区域 */}
          <div
            class={`
              flex-1 pb-8
              ${position === 'right' ? 'pr-6 text-right' : 'pl-6'}
              ${props.mode === 'alternate' ? 'max-w-md' : ''}
            `}
            style={{
              opacity: 0,
              transform: `translateX(${position === 'right' ? '20px' : '-20px'})`,
              animation: `slideIn 0.3s ease-out forwards ${index * 0.1 + 0.1}s`
            }}
          >
            {/* 时间戳 */}
            {item.timestamp && (
              <div class={`${sizeClasses[props.size].timestamp} text-gray-500 mb-1`}>
                {formatTimestamp(item.timestamp)}
              </div>
            )}

            {/* 标题 */}
            <h3 class={`${sizeClasses[props.size].title} font-semibold text-gray-900 mb-2`}>
              {item.title}
            </h3>

            {/* 描述 */}
            {item.description && (
              <p class={`${sizeClasses[props.size].description} text-gray-600 mb-3 leading-relaxed`}>
                {item.description}
              </p>
            )}

            {/* 自定义内容 */}
            {item.content && (
              <div class="mb-3">
                {item.content}
              </div>
            )}

            {/* 操作按钮 */}
            {item.actions && (
              <div class={`flex ${position === 'right' ? 'justify-end' : 'justify-start'} space-x-2`}>
                {item.actions}
              </div>
            )}
          </div>
        </div>
      )
    }

    return () => {
      const displayItems = props.reverse ? [...props.items].reverse() : props.items

      return (
        <div class={`timeline-component ${props.className}`}>
          <div class={sizeClasses[props.size].spacing}>
            {displayItems.map((item, index) => 
              renderTimelineItem(item, index, index === displayItems.length - 1)
            )}

            {/* 待处理项 */}
            {props.pending && (
              <div
                class="relative flex"
                style={{
                  opacity: 0,
                  transform: 'translateY(20px)',
                  animation: `fadeInUp 0.3s ease-out forwards ${displayItems.length * 0.1}s`
                }}
              >
                {/* 时间轴线 */}
                <div class="flex flex-col items-center">
                  {/* 待处理圆点 */}
                  <div
                    class={`
                      ${sizeClasses[props.size].dot} rounded-full border-2 border-dashed
                      border-gray-300 bg-white flex items-center justify-center
                      ${sizeClasses[props.size].dotSpacing}
                    `}
                    style={{
                      animation: 'pulse 2s ease-in-out infinite'
                    }}
                  >
                    <div class="w-2 h-2 bg-gray-300 rounded-full" />
                  </div>
                </div>

                {/* 待处理内容 */}
                <div class="flex-1 pl-6">
                  <div class={`${sizeClasses[props.size].description} text-gray-400`}>
                    {props.pending}
                  </div>
                </div>
              </div>
            )}
          </div>

          <style>{`
            @keyframes fadeInUp {
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes scaleIn {
              to {
                transform: scale(1);
              }
            }
            @keyframes scaleY {
              to {
                transform: scaleY(1);
              }
            }
            @keyframes slideIn {
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
            @keyframes pulse {
              0%, 100% {
                transform: scale(1);
                opacity: 0.5;
              }
              50% {
                transform: scale(1.1);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )
    }
  }
})

// 预设组件
export const VerticalTimeline = defineComponent({
  name: 'VerticalTimeline',
  props: {
    items: {
      type: Array as PropType<TimelineItem[]>,
      required: true
    },
    size: {
      type: String as PropType<'sm' | 'md' | 'lg'>,
      default: 'md'
    },
    reverse: {
      type: Boolean,
      default: false
    },
    pending: Object as PropType<VNode>,
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    return () => (
      <Timeline mode="left" {...props} />
    )
  }
})

export const AlternateTimeline = defineComponent({
  name: 'AlternateTimeline', 
  props: {
    items: {
      type: Array as PropType<TimelineItem[]>,
      required: true
    },
    size: {
      type: String as PropType<'sm' | 'md' | 'lg'>,
      default: 'md'
    },
    reverse: {
      type: Boolean,
      default: false
    },
    pending: Object as PropType<VNode>,
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    return () => (
      <Timeline mode="alternate" {...props} />
    )
  }
})

export const SimpleTimeline = defineComponent({
  name: 'SimpleTimeline',
  props: {
    items: {
      type: Array as PropType<TimelineItem[]>,
      required: true
    },
    mode: {
      type: String as PropType<'left' | 'right' | 'alternate'>,
      default: 'left'
    },
    reverse: {
      type: Boolean,
      default: false
    },
    pending: Object as PropType<VNode>,
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    return () => (
      <Timeline size="sm" {...props} />
    )
  }
})