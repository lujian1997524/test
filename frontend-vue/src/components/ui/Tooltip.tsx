import { defineComponent, ref, computed, onMounted, onUnmounted, nextTick, type PropType, type CSSProperties } from 'vue'
import { Teleport, Transition } from 'vue'

export interface TooltipProps {
  children?: any
  content: any
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
  trigger?: 'hover' | 'click' | 'focus' | 'manual'
  delay?: number
  disabled?: boolean
  className?: string
  visible?: boolean
  onVisibleChange?: (visible: boolean) => void
}

export const Tooltip = defineComponent({
  name: 'Tooltip',
  props: {
    content: {
      required: true
    },
    placement: {
      type: String as PropType<TooltipProps['placement']>,
      default: 'top'
    },
    trigger: {
      type: String as PropType<TooltipProps['trigger']>,
      default: 'hover'
    },
    delay: {
      type: Number,
      default: 100
    },
    disabled: {
      type: Boolean,
      default: false
    },
    className: {
      type: String,
      default: ''
    },
    visible: Boolean,
    onVisibleChange: Function as PropType<(visible: boolean) => void>
  },
  setup(props, { slots, emit }) {
    const internalVisible = ref(false)
    const position = ref({ x: 0, y: 0 })
    const isMounted = ref(false)
    const triggerRef = ref<HTMLDivElement>()
    const tooltipRef = ref<HTMLDivElement>()
    const timeoutRef = ref<number>()

    // 确保只在客户端挂载后才添加交互属性
    onMounted(() => {
      isMounted.value = true
    })

    const isVisible = computed(() => 
      props.visible !== undefined ? props.visible : internalVisible.value
    )

    // 计算工具提示位置
    const calculatePosition = () => {
      if (!triggerRef.value) return { x: 0, y: 0 }

      const triggerRect = triggerRef.value.getBoundingClientRect()
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft
      const scrollY = window.pageYOffset || document.documentElement.scrollTop

      let x = 0
      let y = 0

      // 简化位置计算
      switch (props.placement) {
        case 'top':
          x = triggerRect.left + triggerRect.width / 2
          y = triggerRect.top - 8
          break
        case 'bottom':
          x = triggerRect.left + triggerRect.width / 2
          y = triggerRect.bottom + 8
          break
        case 'left':
          x = triggerRect.left - 8
          y = triggerRect.top + triggerRect.height / 2
          break
        case 'right':
          x = triggerRect.right + 8
          y = triggerRect.top + triggerRect.height / 2
          break
        default:
          x = triggerRect.left + triggerRect.width / 2
          y = triggerRect.top - 8
      }

      return { x: x + scrollX, y: y + scrollY }
    }

    // 显示工具提示
    const showTooltip = () => {
      if (props.disabled) return
      
      if (timeoutRef.value) {
        clearTimeout(timeoutRef.value)
      }

      if (props.delay > 0) {
        timeoutRef.value = window.setTimeout(() => {
          internalVisible.value = true
          props.onVisibleChange?.(true)
          emit('visible-change', true)
        }, props.delay)
      } else {
        internalVisible.value = true
        props.onVisibleChange?.(true)
        emit('visible-change', true)
      }
    }

    // 隐藏工具提示
    const hideTooltip = () => {
      if (timeoutRef.value) {
        clearTimeout(timeoutRef.value)
      }

      internalVisible.value = false
      props.onVisibleChange?.(false)
      emit('visible-change', false)
    }

    // 事件处理
    const handleMouseEnter = () => {
      if (props.trigger === 'hover') showTooltip()
    }

    const handleMouseLeave = () => {
      if (props.trigger === 'hover') hideTooltip()
    }

    const handleClick = () => {
      if (props.trigger === 'click') {
        if (isVisible.value) {
          hideTooltip()
        } else {
          showTooltip()
        }
      }
    }

    const handleFocus = () => {
      if (props.trigger === 'focus') showTooltip()
    }

    const handleBlur = () => {
      if (props.trigger === 'focus') hideTooltip()
    }

    // 位置更新
    const updatePosition = () => {
      if (isVisible.value && triggerRef.value) {
        nextTick(() => {
          const newPosition = calculatePosition()
          position.value = newPosition
        })
      }
    }

    // 监听位置变化
    const handleResize = () => updatePosition()
    const handleScroll = () => updatePosition()

    onMounted(() => {
      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleScroll)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
      if (timeoutRef.value) {
        clearTimeout(timeoutRef.value)
      }
    })

    // 监听visible状态变化，更新位置
    const unwatchVisible = computed(() => {
      if (isVisible.value) {
        nextTick(() => {
          updatePosition()
        })
      }
      return isVisible.value
    })

    // 获取箭头样式 - 简化版本
    const getArrowStyle = (): CSSProperties => {
      return {
        position: 'absolute',
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: '4px',
        borderColor: 'transparent',
        display: 'none' // 暂时隐藏箭头，先确保tooltip本身工作
      }
    }

    // 获取触发器属性
    const getTriggerProps = () => {
      const triggerProps: any = {
        ref: triggerRef,
        class: `inline-block ${props.className}`,
        onMouseenter: handleMouseEnter,
        onMouseleave: handleMouseLeave,
        onClick: handleClick,
        onFocus: handleFocus,
        onBlur: handleBlur
      }

      // 只在客户端挂载后添加交互属性，避免SSR不匹配
      if (isMounted.value) {
        if (props.trigger === 'focus') {
          triggerProps.tabindex = 0
        }
        if (props.trigger === 'click') {
          triggerProps.role = 'button'
        }
      }

      return triggerProps
    }

    return () => (
      <>
        <div {...getTriggerProps()}>
          {slots.default?.()}
        </div>

        <Teleport to="body">
          <Transition
            enterActiveClass="transition-all duration-150"
            leaveActiveClass="transition-all duration-150"
            enterFromClass="opacity-0 scale-80"
            enterToClass="opacity-100 scale-100"
            leaveFromClass="opacity-100 scale-100"
            leaveToClass="opacity-0 scale-80"
          >
            {isVisible.value && (
              <div
                ref={tooltipRef}
                class="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-ios-lg shadow-ios-lg max-w-xs break-words"
                style={{
                  left: `${position.value.x}px`,
                  top: `${position.value.y}px`
                }}
              >
                {typeof props.content === 'string' ? props.content : props.content}
                <div style={getArrowStyle()} />
              </div>
            )}
          </Transition>
        </Teleport>
      </>
    )
  }
})