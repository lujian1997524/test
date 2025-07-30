import { defineComponent, ref, type PropType } from 'vue'
import { ActivityBar } from './ActivityBar.tsx'
import { useResponsive } from '../../composables/useResponsive.ts'
import { MobileDrawer, BottomSheet } from '../ui/ResponsiveLayout.tsx'
import { 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  DocumentIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

interface VSCodeLayoutProps {
  children?: any
  sidebar?: any
  activeView: 'active' | 'completed' | 'drawings' | 'workers' | 'dashboard' | 'settings'
  onViewChange: (view: 'active' | 'completed' | 'drawings' | 'workers' | 'dashboard' | 'settings') => void
  onSearchClick?: () => void
  onSystemSettingsClick?: () => void
  onProfileClick?: () => void
  onMobileSidebarAutoClose?: () => void
  className?: string
}

export const VSCodeLayout = defineComponent({
  name: 'VSCodeLayout',
  props: {
    sidebar: Object,
    activeView: {
      type: String as PropType<'active' | 'completed' | 'drawings' | 'workers' | 'dashboard' | 'settings'>,
      required: true
    },
    onViewChange: {
      type: Function as PropType<(view: 'active' | 'completed' | 'drawings' | 'workers' | 'dashboard' | 'settings') => void>,
      required: true
    },
    onSearchClick: Function as PropType<() => void>,
    onSystemSettingsClick: Function as PropType<() => void>,
    onProfileClick: Function as PropType<() => void>,
    onMobileSidebarAutoClose: Function as PropType<() => void>,
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots }) {
    const { isMobile, isTablet, isDesktop } = useResponsive()
    const showMobileSidebar = ref(false)
    const showUserMenu = ref(false)

    return () => {
      console.log('🏗️ VSCodeLayout: 开始渲染，activeView:', props.activeView)
      console.log('🏗️ VSCodeLayout: sidebar存在:', !!props.sidebar)
      console.log('🏗️ VSCodeLayout: 响应式状态 - Desktop:', isDesktop.value, 'Tablet:', isTablet.value, 'Mobile:', !isDesktop.value && !isTablet.value)
      
      // 桌面端布局 - VS Code风格
      if (isDesktop.value) {
        console.log('🏗️ VSCodeLayout: 使用桌面端布局')
        return (
          <div class={`h-screen bg-gray-50 flex overflow-hidden ${props.className}`}>
            {/* 活动栏 */}
            <ActivityBar
              activeView={props.activeView}
              onViewChange={props.onViewChange}
              onSearchClick={props.onSearchClick}
              onSystemSettingsClick={props.onSystemSettingsClick}
              onProfileClick={props.onProfileClick}
            />
            
            {/* 侧边栏 */}
            {props.sidebar ? (
              <div
                class="w-55 bg-white/80 backdrop-blur-xl border-r border-gray-200 flex-shrink-0 h-full"
                style={{ 
                  width: '220px'
                }}
              >
                {console.log('🏗️ VSCodeLayout: 渲染侧边栏内容')}
                {props.sidebar}
              </div>
            ) : (
              console.log('🏗️ VSCodeLayout: 侧边栏为空，不渲染')
            )}
            
            {/* 主内容区域 */}
            <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              <main class="flex-1 p-4 overflow-auto">
                <div class="h-full">
                  {slots.default?.()}
                </div>
              </main>
            </div>
          </div>
        )
      }

      // 平板端布局
      if (isTablet.value) {
        return (
          <div class={`min-h-screen bg-gray-50 flex ${props.className}`}>
            {/* 简化活动栏 */}
            <div class="w-16 bg-gray-100/80 backdrop-blur-xl border-r border-gray-200 flex-shrink-0">
              <div class="p-2 space-y-2">
                {['active', 'completed', 'drawings', 'workers'].map((view) => (
                  <button
                    key={view}
                    onClick={() => props.onViewChange(view as any)}
                    class={`
                      w-12 h-12 rounded-lg flex items-center justify-center text-xs font-medium
                      ${props.activeView === view 
                        ? 'bg-ios18-blue text-white' 
                        : 'text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    {view === 'active' ? '活跃' : 
                     view === 'completed' ? '过往' :
                     view === 'drawings' ? '图纸' : '工人'}
                  </button>
                ))}
              </div>
            </div>

            {/* 侧边栏 */}
            {props.sidebar && (
              <div class="bg-white/80 backdrop-blur-xl border-r border-gray-200 flex-shrink-0" style={{ width: '180px' }}>
                {props.sidebar}
              </div>
            )}
            
            {/* 主内容区域 */}
            <div class="flex-1 flex flex-col min-w-0">
              <main class="flex-1 p-4 overflow-auto">
                {slots.default?.()}
              </main>
            </div>
          </div>
        )
      }

      // 移动端布局
      return (
        <div class={`min-h-screen bg-gray-50 flex flex-col ${props.className}`}>
          {/* 移动端顶部栏 */}
          <div class="bg-white/80 backdrop-blur-xl border-b border-gray-200 p-4 flex-shrink-0">
            <div class="flex items-center justify-between">
              <button
                onClick={() => showMobileSidebar.value = true}
                class="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 class="text-lg font-bold">激光切割管理</h1>
              
              {/* 用户头像和菜单 */}
              <div class="relative">
                <button
                  onClick={() => showUserMenu.value = !showUserMenu.value}
                  class="p-2 rounded-lg hover:bg-gray-100"
                >
                  <UserCircleIcon class="w-6 h-6" />
                </button>
                
                {/* 用户菜单下拉 */}
                {showUserMenu.value && (
                  <div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div class="py-1">
                      <button
                        onClick={() => {
                          props.onSystemSettingsClick?.()
                          showUserMenu.value = false
                        }}
                        class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Cog6ToothIcon class="w-4 h-4" />
                        <span>系统设置</span>
                      </button>
                      <button
                        onClick={() => {
                          props.onProfileClick?.()
                          showUserMenu.value = false
                        }}
                        class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <ArrowRightOnRectangleIcon class="w-4 h-4" />
                        <span>退出登录</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 主内容区域 - 为底部导航栏留出空间 */}
          <main class="flex-1 p-4 overflow-auto pb-20">
            {slots.default?.()}
          </main>

          {/* 底部导航 - 固定定位 */}
          <div class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 p-2 z-40">
            <div class="flex justify-around items-center max-w-md mx-auto">
              {[
                { key: 'active', label: '活跃', icon: ClipboardDocumentListIcon },
                { key: 'completed', label: '过往', icon: CheckCircleIcon },
                { key: 'search', label: '搜索', icon: MagnifyingGlassIcon, isSearch: true },
                { key: 'drawings', label: '图纸', icon: DocumentIcon },
                { key: 'workers', label: '工人', icon: UsersIcon }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    if (item.isSearch) {
                      props.onSearchClick?.()
                    } else {
                      props.onViewChange(item.key as any)
                    }
                  }}
                  class={`
                    flex flex-col items-center p-2 rounded-lg min-h-[44px] min-w-[44px] transition-all
                    ${(props.activeView === item.key && !item.isSearch)
                      ? 'bg-ios18-blue text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon class="w-5 h-5 mb-1" />
                  <span class="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 移动端侧边栏抽屉 */}
          <MobileDrawer
            isOpen={showMobileSidebar.value}
            onClose={() => showMobileSidebar.value = false}
            title="功能菜单"
            position="left"
          >
            {props.sidebar && (
              <div onClick={() => {
                showMobileSidebar.value = false
                props.onMobileSidebarAutoClose?.()
              }}>
                {props.sidebar}
              </div>
            )}
          </MobileDrawer>
          
          {/* 用户菜单遮罩 */}
          {showUserMenu.value && (
            <div 
              class="fixed inset-0 z-30"
              onClick={() => showUserMenu.value = false}
            />
          )}
        </div>
      )
    }
  }
})