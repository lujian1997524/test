import { defineComponent, computed, type PropType } from 'vue'
import { Transition, Teleport } from 'vue'
import { useResponsive } from '../../composables/useResponsive.ts'

interface ResponsiveContainerProps {
  children?: any
  className?: string
  mobileClassName?: string
  tabletClassName?: string
  desktopClassName?: string
}

export const ResponsiveContainer = defineComponent({
  name: 'ResponsiveContainer',
  props: {
    className: {
      type: String,
      default: ''
    },
    mobileClassName: {
      type: String,
      default: ''
    },
    tabletClassName: {
      type: String,
      default: ''
    },
    desktopClassName: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots }) {
    const { device } = useResponsive()

    const getDeviceClassName = computed(() => {
      switch (device.value) {
        case 'mobile':
          return props.mobileClassName
        case 'tablet':
          return props.tabletClassName
        case 'desktop':
          return props.desktopClassName
        default:
          return ''
      }
    })

    return () => (
      <div class={`${props.className} ${getDeviceClassName.value}`}>
        {slots.default?.()}
      </div>
    )
  }
})

interface AdaptiveLayoutProps {
  children?: any
  direction?: 'row' | 'column'
  mobileDirection?: 'row' | 'column'
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export const AdaptiveLayout = defineComponent({
  name: 'AdaptiveLayout',
  props: {
    direction: {
      type: String as PropType<'row' | 'column'>,
      default: 'row'
    },
    mobileDirection: {
      type: String as PropType<'row' | 'column'>,
      default: 'column'
    },
    gap: {
      type: String as PropType<'sm' | 'md' | 'lg'>,
      default: 'md'
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots }) {
    const { isMobile } = useResponsive()
    
    const flexDirection = computed(() => isMobile.value ? props.mobileDirection : props.direction)
    const gapClass = computed(() => ({
      sm: 'gap-2',
      md: 'gap-4', 
      lg: 'gap-6'
    }[props.gap]))

    return () => (
      <div class={`flex flex-${flexDirection.value} ${gapClass.value} ${props.className}`}>
        {slots.default?.()}
      </div>
    )
  }
})

interface ResponsiveGridProps {
  children?: any
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export const ResponsiveGrid = defineComponent({
  name: 'ResponsiveGrid',
  props: {
    columns: {
      type: Object as PropType<{ mobile?: number; tablet?: number; desktop?: number }>,
      default: () => ({ mobile: 1, tablet: 2, desktop: 3 })
    },
    gap: {
      type: String as PropType<'sm' | 'md' | 'lg'>,
      default: 'md'
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots }) {
    const gapClass = computed(() => ({
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6'
    }[props.gap]))

    const gridCols = computed(() => 
      `grid-cols-${props.columns.mobile} md:grid-cols-${props.columns.tablet} lg:grid-cols-${props.columns.desktop}`
    )

    return () => (
      <div class={`grid ${gridCols.value} ${gapClass.value} ${props.className}`}>
        {slots.default?.()}
      </div>
    )
  }
})

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  children?: any
  title?: string
  position?: 'left' | 'right' | 'bottom'
}

export const MobileDrawer = defineComponent({
  name: 'MobileDrawer',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true
    },
    title: String,
    position: {
      type: String as PropType<'left' | 'right' | 'bottom'>,
      default: 'left'
    }
  },
  setup(props, { slots }) {
    const slideVariants = {
      left: {
        closed: { transform: 'translateX(-100%)' },
        open: { transform: 'translateX(0)' }
      },
      right: {
        closed: { transform: 'translateX(100%)' },
        open: { transform: 'translateX(0)' }
      },
      bottom: {
        closed: { transform: 'translateY(100%)' },
        open: { transform: 'translateY(0)' }
      }
    }

    const drawerPositionClass = {
      left: 'left-0 top-0 h-full w-80 max-w-[85vw]',
      right: 'right-0 top-0 h-full w-80 max-w-[85vw]',
      bottom: 'bottom-0 left-0 right-0 h-auto max-h-[85vh]'
    }[props.position]

    return () => (
      <Teleport to="body">
        <Transition
          enterActiveClass="transition-all duration-300"
          leaveActiveClass="transition-all duration-300"
          enterFromClass="opacity-0"
          enterToClass="opacity-100"
          leaveFromClass="opacity-100"
          leaveToClass="opacity-0"
        >
          {props.isOpen && (
            <>
              {/* 背景遮罩 */}
              <div
                class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                onClick={props.onClose}
                style={{
                  opacity: 0,
                  animation: 'fadeIn 0.3s ease-out forwards'
                }}
              />
              
              {/* 抽屉内容 */}
              <div
                class={`fixed z-50 bg-white/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ${drawerPositionClass}`}
                style={{
                  ...slideVariants[props.position].closed,
                  animation: 'slideIn 0.3s ease-out forwards'
                }}
              >
                {props.title && (
                  <div class="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-text-primary">{props.title}</h2>
                    <button
                      onClick={props.onClose}
                      class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                <div class="overflow-y-auto flex-1 p-4">
                  {slots.default?.()}
                </div>
              </div>

              <style jsx>{`
                @keyframes fadeIn {
                  to { opacity: 1; }
                }
                @keyframes slideIn {
                  to { transform: ${slideVariants[props.position].open.transform}; }
                }
              `}</style>
            </>
          )}
        </Transition>
      </Teleport>
    )
  }
})

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children?: any
  title?: string
  height?: 'half' | 'full' | 'auto'
}

export const BottomSheet = defineComponent({
  name: 'BottomSheet',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true
    },
    title: String,
    height: {
      type: String as PropType<'half' | 'full' | 'auto'>,
      default: 'auto'
    }
  },
  setup(props, { slots }) {
    const heightClass = computed(() => ({
      half: 'h-1/2',
      full: 'h-full',
      auto: 'h-auto max-h-[90vh]'
    }[props.height]))

    return () => (
      <Teleport to="body">
        <Transition
          enterActiveClass="transition-all duration-300"
          leaveActiveClass="transition-all duration-300"
          enterFromClass="opacity-0"
          enterToClass="opacity-100"
          leaveFromClass="opacity-100"
          leaveToClass="opacity-0"
        >
          {props.isOpen && (
            <>
              <div
                class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                onClick={props.onClose}
                style={{
                  opacity: 0,
                  animation: 'fadeIn 0.3s ease-out forwards'
                }}
              />
              
              <div
                class={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl rounded-t-2xl shadow-2xl transition-transform duration-300 ${heightClass.value}`}
                style={{
                  transform: 'translateY(100%)',
                  animation: 'slideUp 0.3s ease-out forwards'
                }}
              >
                {/* 拖拽指示器 */}
                <div class="flex justify-center p-2">
                  <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
                </div>
                
                {props.title && (
                  <div class="flex items-center justify-between px-4 pb-2">
                    <h2 class="text-lg font-semibold text-text-primary">{props.title}</h2>
                    <button
                      onClick={props.onClose}
                      class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                
                <div class="overflow-y-auto flex-1 px-4 pb-4">
                  {slots.default?.()}
                </div>
              </div>

              <style jsx>{`
                @keyframes fadeIn {
                  to { opacity: 1; }
                }
                @keyframes slideUp {
                  to { transform: translateY(0); }
                }
              `}</style>
            </>
          )}
        </Transition>
      </Teleport>
    )
  }
})