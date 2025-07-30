import { ref, onMounted, onUnmounted } from 'vue'

// 触摸手势类型
export type GestureType = 'tap' | 'swipe' | 'pinch' | 'longpress' | 'pan'

export interface TouchPoint {
  x: number
  y: number
  id: number
  timestamp: number
}

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
}

export interface PinchGesture {
  scale: number
  center: { x: number; y: number }
}

export interface TouchGestureHandlers {
  onTap?: (point: TouchPoint) => void
  onSwipe?: (swipe: SwipeDirection) => void
  onPinch?: (pinch: PinchGesture) => void
  onLongPress?: (point: TouchPoint) => void
  onPanStart?: (point: TouchPoint) => void
  onPanMove?: (point: TouchPoint) => void
  onPanEnd?: (point: TouchPoint) => void
}

export interface TouchOptions {
  // 滑动阈值（像素）
  swipeThreshold?: number
  // 长按时间（毫秒）
  longPressDelay?: number
  // 双击时间间隔（毫秒）
  doubleTapDelay?: number
  // 缩放最小变化阈值
  pinchThreshold?: number
  // 是否阻止默认事件
  preventDefault?: boolean
}

export const useTouch = (
  elementRef: any,
  handlers: TouchGestureHandlers,
  options: TouchOptions = {}
) => {
  const {
    swipeThreshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300,
    pinchThreshold = 0.1,
    preventDefault = true
  } = options

  const isPressed = ref(false)
  const touchState = ref<{
    touches: TouchPoint[]
    startTime: number
    startDistance?: number
    lastTap?: number
    longPressTimer?: NodeJS.Timeout
  }>({
    touches: [],
    startTime: 0
  })

  // 计算两点距离
  const getDistance = (touch1: TouchPoint, touch2: TouchPoint) => {
    const dx = touch1.x - touch2.x
    const dy = touch1.y - touch2.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  // 计算滑动方向
  const getSwipeDirection = (
    start: TouchPoint,
    end: TouchPoint
  ): SwipeDirection | null => {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < swipeThreshold) return null
    
    const velocity = distance / (end.timestamp - start.timestamp)
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return {
        direction: dx > 0 ? 'right' : 'left',
        distance,
        velocity
      }
    } else {
      return {
        direction: dy > 0 ? 'down' : 'up',
        distance,
        velocity
      }
    }
  }

  // 转换原生触摸事件为TouchPoint
  const getTouchPoints = (touches: TouchList): TouchPoint[] => {
    return Array.from(touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      id: touch.identifier,
      timestamp: Date.now()
    }))
  }

  // 处理触摸开始
  const handleTouchStart = (event: TouchEvent) => {
    if (preventDefault) {
      event.preventDefault()
    }
    
    const touches = getTouchPoints(event.touches)
    const now = Date.now()
    
    isPressed.value = true
    
    // 设置长按定时器
    const longPressTimer = setTimeout(() => {
      if (touches.length === 1 && handlers.onLongPress) {
        handlers.onLongPress(touches[0])
      }
    }, longPressDelay)

    touchState.value = {
      ...touchState.value,
      touches,
      startTime: now,
      startDistance: touches.length === 2 ? getDistance(touches[0], touches[1]) : undefined,
      longPressTimer
    }

    // 处理拖拽开始
    if (touches.length === 1 && handlers.onPanStart) {
      handlers.onPanStart(touches[0])
    }
  }

  // 处理触摸移动
  const handleTouchMove = (event: TouchEvent) => {
    if (preventDefault) {
      event.preventDefault()
    }
    
    const touches = getTouchPoints(event.touches)
    
    // 清除长按定时器（移动时取消长按）
    if (touchState.value.longPressTimer) {
      clearTimeout(touchState.value.longPressTimer)
    }

    // 处理缩放手势
    if (touches.length === 2 && touchState.value.startDistance && handlers.onPinch) {
      const currentDistance = getDistance(touches[0], touches[1])
      const scale = currentDistance / touchState.value.startDistance
      
      if (Math.abs(scale - 1) > pinchThreshold) {
        const center = {
          x: (touches[0].x + touches[1].x) / 2,
          y: (touches[0].y + touches[1].y) / 2
        }
        
        handlers.onPinch({ scale, center })
      }
    }

    // 处理拖拽移动
    if (touches.length === 1 && handlers.onPanMove) {
      handlers.onPanMove(touches[0])
    }

    touchState.value = {
      ...touchState.value,
      touches,
      longPressTimer: undefined
    }
  }

  // 处理触摸结束
  const handleTouchEnd = (event: TouchEvent) => {
    if (preventDefault) {
      event.preventDefault()
    }
    
    const now = Date.now()
    isPressed.value = false
    
    // 清除长按定时器
    if (touchState.value.longPressTimer) {
      clearTimeout(touchState.value.longPressTimer)
    }

    const { touches: startTouches, startTime, lastTap } = touchState.value
    const endTouches = getTouchPoints(event.changedTouches)
    
    if (startTouches.length === 1 && endTouches.length === 1) {
      const startTouch = startTouches[0]
      const endTouch = endTouches[0]
      const duration = now - startTime
      
      // 检测滑动手势
      const swipe = getSwipeDirection(startTouch, endTouch)
      if (swipe && handlers.onSwipe) {
        handlers.onSwipe(swipe)
      }
      // 检测点击手势（如果没有滑动）
      else if (!swipe && duration < 300) {
        // 检测双击
        if (lastTap && (now - lastTap) < doubleTapDelay) {
          // 这里可以扩展双击处理
          console.log('双击检测')
        }
        
        if (handlers.onTap) {
          handlers.onTap(endTouch)
        }
        
        touchState.value = {
          touches: [],
          startTime: 0,
          lastTap: now
        }
        return
      }
      
      // 处理拖拽结束
      if (handlers.onPanEnd) {
        handlers.onPanEnd(endTouch)
      }
    }

    touchState.value = {
      touches: [],
      startTime: 0,
      lastTap: touchState.value.lastTap
    }
  }

  // 绑定事件监听器
  onMounted(() => {
    const element = elementRef.value
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault })
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault })
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault })
  })

  onUnmounted(() => {
    const element = elementRef.value
    if (!element) return

    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
  })

  return {
    isPressed,
    touchState: {
      isActive: touchState.value.touches.length > 0,
      touchCount: touchState.value.touches.length,
      touches: touchState.value.touches
    }
  }
}

// 简化的滑动Composable
export const useSwipe = (
  elementRef: any,
  onSwipe: (direction: SwipeDirection) => void,
  threshold: number = 50
) => {
  return useTouch(elementRef, { onSwipe }, { swipeThreshold: threshold })
}

// 简化的长按Composable
export const useLongPress = (
  elementRef: any,
  onLongPress: () => void,
  delay: number = 500
) => {
  return useTouch(
    elementRef,
    { onLongPress: () => onLongPress() },
    { longPressDelay: delay }
  )
}