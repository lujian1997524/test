import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useResponsive } from './useResponsive'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage?: number
  networkRequests: number
  cacheHitRate: number
}

export const usePerformance = () => {
  const { isMobile } = useResponsive()
  const metrics = ref<PerformanceMetrics>({
    renderTime: 0,
    networkRequests: 0,
    cacheHitRate: 0
  })
  const isLowPerformanceMode = ref(false)

  // 优化建议
  const optimizationSuggestions = computed(() => {
    const suggestions: string[] = []
    
    if (metrics.value.renderTime > 3000) {
      suggestions.push('页面加载时间过长，建议启用低性能模式')
    }
    
    if (metrics.value.memoryUsage && metrics.value.memoryUsage > 100) {
      suggestions.push('内存使用过高，建议刷新页面释放内存')
    }
    
    if (metrics.value.networkRequests > 50) {
      suggestions.push('网络请求过多，建议启用离线模式')
    }
    
    return suggestions
  })

  // 强制低性能模式
  const enableLowPerformanceMode = () => {
    isLowPerformanceMode.value = true
    localStorage.setItem('low-performance-mode', 'true')
  }

  const disableLowPerformanceMode = () => {
    isLowPerformanceMode.value = false
    localStorage.setItem('low-performance-mode', 'false')
  }

  // 清理内存
  const clearMemory = () => {
    if ('gc' in window) {
      ;(window as any).gc()
    }
    // 清理本地缓存
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('dynamic')) {
            caches.delete(name)
          }
        })
      })
    }
  }

  let observer: PerformanceObserver | null = null
  let memoryInterval: NodeJS.Timeout | null = null

  onMounted(() => {
    // 检测设备性能
    const checkDevicePerformance = () => {
      // 基于设备和网络状况判断是否启用低性能模式
      const connection = (navigator as any).connection
      const isSlowConnection = connection && (
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g' ||
        connection.saveData
      )
      
      const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4
      const hasLimitedRAM = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4
      
      if (isMobile.value && (isSlowConnection || isLowEndDevice || hasLimitedRAM)) {
        isLowPerformanceMode.value = true
      }
    }

    checkDevicePerformance()

    // 性能监控
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          metrics.value = {
            ...metrics.value,
            renderTime: navEntry.loadEventEnd - navEntry.loadEventStart
          }
        }
        
        if (entry.entryType === 'resource') {
          metrics.value = {
            ...metrics.value,
            networkRequests: metrics.value.networkRequests + 1
          }
        }
      }
    })

    try {
      observer.observe({ type: 'navigation', buffered: true })
      observer.observe({ type: 'resource', buffered: true })
    } catch (error) {
      console.warn('Performance observer not supported:', error)
    }

    // 内存使用监控
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        metrics.value = {
          ...metrics.value,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
        }
      }
    }

    memoryInterval = setInterval(checkMemoryUsage, 10000) // 10秒检查一次
    checkMemoryUsage()
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
    if (memoryInterval) {
      clearInterval(memoryInterval)
    }
  })

  return {
    metrics,
    isLowPerformanceMode,
    optimizationSuggestions,
    enableLowPerformanceMode,
    disableLowPerformanceMode,
    clearMemory
  }
}