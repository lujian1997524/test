'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

export interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
  trigger?: 'hover' | 'click' | 'focus' | 'manual'
  delay?: number
  disabled?: boolean
  className?: string
  visible?: boolean
  onVisibleChange?: (visible: boolean) => void
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  placement = 'top',
  trigger = 'hover',
  delay = 100,
  disabled = false,
  className = '',
  visible,
  onVisibleChange
}) => {
  const [internalVisible, setInternalVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const isVisible = visible !== undefined ? visible : internalVisible

  // 计算工具提示位置
  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const scrollX = window.pageXOffset
    const scrollY = window.pageYOffset

    let x = 0
    let y = 0

    switch (placement) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        y = triggerRect.top - tooltipRect.height - 8
        break
      case 'top-start':
        x = triggerRect.left
        y = triggerRect.top - tooltipRect.height - 8
        break
      case 'top-end':
        x = triggerRect.right - tooltipRect.width
        y = triggerRect.top - tooltipRect.height - 8
        break
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        y = triggerRect.bottom + 8
        break
      case 'bottom-start':
        x = triggerRect.left
        y = triggerRect.bottom + 8
        break
      case 'bottom-end':
        x = triggerRect.right - tooltipRect.width
        y = triggerRect.bottom + 8
        break
      case 'left':
        x = triggerRect.left - tooltipRect.width - 8
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        break
      case 'right':
        x = triggerRect.right + 8
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        break
    }

    // 边界检测
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (x < 0) x = 8
    if (x + tooltipRect.width > viewportWidth) x = viewportWidth - tooltipRect.width - 8
    if (y < 0) y = 8
    if (y + tooltipRect.height > viewportHeight) y = viewportHeight - tooltipRect.height - 8

    setPosition({ x: x + scrollX, y: y + scrollY })
  }

  // 显示工具提示
  const showTooltip = () => {
    if (disabled) return
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setInternalVisible(true)
      onVisibleChange?.(true)
    }, delay)
  }

  // 隐藏工具提示
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setInternalVisible(false)
    onVisibleChange?.(false)
  }

  // 事件处理
  const handleMouseEnter = () => {
    if (trigger === 'hover') showTooltip()
  }

  const handleMouseLeave = () => {
    if (trigger === 'hover') hideTooltip()
  }

  const handleClick = () => {
    if (trigger === 'click') {
      if (isVisible) {
        hideTooltip()
      } else {
        showTooltip()
      }
    }
  }

  const handleFocus = () => {
    if (trigger === 'focus') showTooltip()
  }

  const handleBlur = () => {
    if (trigger === 'focus') hideTooltip()
  }

  // 位置更新
  useEffect(() => {
    if (isVisible) {
      calculatePosition()
      
      const handleResize = () => calculatePosition()
      const handleScroll = () => calculatePosition()
      
      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleScroll)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [isVisible, placement])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // 获取箭头样式
  const getArrowStyle = () => {
    const arrowSize = 6
    const baseStyle = `absolute w-0 h-0 border-solid`
    
    switch (placement) {
      case 'top':
      case 'top-start':
      case 'top-end':
        return `${baseStyle} top-full left-1/2 transform -translate-x-1/2 border-l-${arrowSize} border-r-${arrowSize} border-t-${arrowSize} border-l-transparent border-r-transparent border-t-gray-900`
      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
        return `${baseStyle} bottom-full left-1/2 transform -translate-x-1/2 border-l-${arrowSize} border-r-${arrowSize} border-b-${arrowSize} border-l-transparent border-r-transparent border-b-gray-900`
      case 'left':
        return `${baseStyle} left-full top-1/2 transform -translate-y-1/2 border-t-${arrowSize} border-b-${arrowSize} border-l-${arrowSize} border-t-transparent border-b-transparent border-l-gray-900`
      case 'right':
        return `${baseStyle} right-full top-1/2 transform -translate-y-1/2 border-t-${arrowSize} border-b-${arrowSize} border-r-${arrowSize} border-t-transparent border-b-transparent border-r-gray-900`
      default:
        return ''
    }
  }

  if (typeof window === 'undefined') {
    return <div className={`inline-block ${className}`}>{children}</div>
  }

  return (
    <>
      <div
        ref={triggerRef}
        className={`inline-block ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </div>

      {createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              ref={tooltipRef}
              className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-ios-lg shadow-ios-lg max-w-xs break-words"
              style={{
                left: position.x,
                top: position.y
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              {content}
              <div className={getArrowStyle()} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}