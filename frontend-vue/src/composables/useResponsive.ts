import { ref, computed, onMounted, onUnmounted } from 'vue'

// 响应式 Composable
export const useResponsive = () => {
  const windowSize = ref({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  })

  const device = ref<'mobile' | 'tablet' | 'desktop'>('desktop')
  const isTouchDevice = ref(false)
  const orientation = ref<'portrait' | 'landscape'>('landscape')

  // 计算属性
  const isMobile = computed(() => device.value === 'mobile')
  const isTablet = computed(() => device.value === 'tablet')
  const isDesktop = computed(() => device.value === 'desktop')
  const isPortrait = computed(() => orientation.value === 'portrait')
  const isLandscape = computed(() => orientation.value === 'landscape')

  let handleResize: () => void

  onMounted(() => {
    handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      windowSize.value = { width, height }
      
      // 设备类型判断
      if (width < 768) {
        device.value = 'mobile'
      } else if (width < 1024) {
        device.value = 'tablet'
      } else {
        device.value = 'desktop'
      }

      // 触摸设备检测
      isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // 方向检测
      orientation.value = height > width ? 'portrait' : 'landscape'
    }

    handleResize()
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
  })

  onUnmounted(() => {
    if (handleResize) {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  })

  return {
    windowSize,
    device,
    isTouchDevice,
    orientation,
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    isLandscape
  }
}

// 断点检测 Composable
export const useBreakpoint = (breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl') => {
  const matches = ref(false)

  let checkBreakpoint: () => void

  onMounted(() => {
    const breakpoints = {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536
    }

    checkBreakpoint = () => {
      matches.value = window.innerWidth >= breakpoints[breakpoint]
    }

    checkBreakpoint()
    window.addEventListener('resize', checkBreakpoint)
  })

  onUnmounted(() => {
    if (checkBreakpoint) {
      window.removeEventListener('resize', checkBreakpoint)
    }
  })

  return matches
}

// 媒体查询 Composable
export const useMediaQuery = (query: string) => {
  const matches = ref(false)

  let media: MediaQueryList
  let updateMatch: () => void

  onMounted(() => {
    media = window.matchMedia(query)
    
    updateMatch = () => {
      matches.value = media.matches
    }
    updateMatch()
    
    media.addEventListener('change', updateMatch)
  })

  onUnmounted(() => {
    if (media && updateMatch) {
      media.removeEventListener('change', updateMatch)
    }
  })

  return matches
}