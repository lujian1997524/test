import { defineComponent, ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { Transition } from 'vue'
import { LoginModal } from '../components/auth/LoginModal.tsx'
import { ProjectTree } from '../components/materials/ProjectTree.tsx'
import { PastProjectsTree } from '../components/projects/PastProjectsTree.tsx'
import { MaterialsTable } from '../components/materials/MaterialsTable.tsx'
import { MaterialsCardView } from '../components/materials/MaterialsCardView.tsx'
import { PastProjectsCardView } from '../components/projects/PastProjectsCardView.tsx'
import { WorkerManagement } from '../components/workers/WorkerManagement.tsx'
import { WorkersSidebar } from '../components/workers/WorkersSidebar.tsx'
import { ProjectDetail } from '../components/projects/ProjectDetail.tsx'
import { ProjectModal } from '../components/materials/ProjectModal.tsx'
import { ThicknessSpecModal } from '../components/materials/ThicknessSpecModal.tsx'
import { DashboardModal } from '../components/materials/DashboardModal.tsx'
import { DrawingLibrary, DrawingsSidebar } from '../components/drawings/index.ts'
import { SearchModal } from '../components/search/SearchModal.tsx'
import { SettingsPage } from '../components/settings/SettingsPage.tsx'
import { UserProfileModal } from '../components/user/UserProfileModal.tsx'
import { useAuth } from '../composables/useAuth.ts'
import { useProjectStore, useMaterialStore } from '../stores/index.ts'
import { NotificationContainer } from '../components/ui/NotificationContainer.tsx'
import { useNotificationStore } from '../stores/notificationStore.ts'
import { Card, Button } from '../components/ui/index.ts'
import { VSCodeLayout } from '../components/layout/VSCodeLayout.tsx'

const HomeWrapper = defineComponent({
  name: 'Home',
  setup() {
    const { isAuthenticated } = useAuth()

    return () => (
      <>
        {/* 登录模态框 - 未登录时显示，强制模态 */}
        <LoginModal isOpen={!isAuthenticated.value} />
        
        {/* 主页面内容 - 始终渲染，未登录时显示模糊效果 */}
        <div class={!isAuthenticated.value ? 'filter blur-sm pointer-events-none' : ''}>
          <HomeContent />
        </div>
      </>
    )
  }
})

const HomeContent = defineComponent({
  name: 'HomeContent',
  setup() {
    const selectedProjectId = ref<number | null>(null)
    const viewType = ref<'active' | 'completed' | 'drawings' | 'workers' | 'dashboard' | 'settings'>('active')
    const workerNameFilter = ref('')
    const thicknessFilter = ref('')
    const showProjectModal = ref(false)
    const showThicknessSpecModal = ref(false)
    const showDashboardModal = ref(false)
    const editingProject = ref<any>(null)
    const drawingCategory = ref('all')
    const drawingStats = ref<{[key: string]: number}>({})
    const selectedDepartment = ref<string>('all')
    const showSearchModal = ref(false)
    const showSettingsPage = ref(false)
    const showUserProfileModal = ref(false)
    const showDrawingUpload = ref(false)
    const isSorting = ref(false)
    
    // 认证信息
    const { token, isAuthenticated, user, logout } = useAuth()
    const { connectSSE, disconnectSSE } = useNotificationStore()
    
    // Pinia状态管理
    const { 
      createProject,
      updateProject,
      deleteProject,
      fetchProjects,
      setupSSEListeners
    } = useProjectStore()
    
    const { fetchMaterials } = useMaterialStore()

    // 批量排序功能
    const handleBatchSort = async (reorderedItems: any[]) => {
      try {
        isSorting.value = true
        
        // 使用单项目更新API逐个更新排序位置
        const updatePromises = reorderedItems.map(async (item) => {
          const response = await fetch(`http://110.40.71.83:35001/api/projects/${item.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token.value}`,
            },
            body: JSON.stringify({
              ...item,
              sortOrder: item.newPosition
            })
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error(`更新项目 ${item.name} 排序失败:`, errorText)
            throw new Error(`更新项目 ${item.name} 排序失败: ${response.status}`)
          }
          
          return response.json()
        })
        
        // 等待所有更新完成
        await Promise.all(updatePromises)

        // 刷新项目数据
        await fetchProjects()
        
        console.log('✅ 批量排序成功')
      } catch (error) {
        console.error('更新项目排序失败:', error)
        throw error
      } finally {
        isSorting.value = false
      }
    }

    // 获取图纸统计信息  
    const fetchDrawingStats = async () => {
      if (!token.value) return
      
      try {
        const response = await fetch('http://110.40.71.83:35001/api/drawings?limit=1000', {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const drawings = data.drawings || []
          
          const stats: {[key: string]: number} = {
            'all': drawings.length,
            'project-drawings': drawings.filter((d: any) => !d.isCommonPart && d.projectIds?.length > 0).length,
            'common-parts': drawings.filter((d: any) => d.isCommonPart).length,
          }
          
          drawingStats.value = stats
        }
      } catch (error) {
        console.error('获取图纸统计失败:', error)
      }
    }

    // 数据获取 - 依赖于认证状态
    watch([isAuthenticated, token], ([newIsAuth, newToken]) => {
      if (newIsAuth && newToken) {
        fetchProjects()
        fetchDrawingStats()
      }
    }, { immediate: true })

    // SSE连接管理
    watch([isAuthenticated, token], ([newIsAuth, newToken]) => {
      if (newIsAuth && newToken) {
        connectSSE(newToken).then((success) => {
          if (success) {
            setupSSEListeners()
          }
        })
      }
    }, { immediate: true })

    onUnmounted(() => {
      if (isAuthenticated.value && token.value) {
        disconnectSSE()
      }
    })

    // 处理视图切换
    const handleViewChange = (view: 'active' | 'completed' | 'drawings' | 'workers' | 'dashboard' | 'settings') => {
      // 特殊处理
      if (view === 'dashboard') {
        showDashboardModal.value = true
      } else if (view === 'settings') {
        showThicknessSpecModal.value = true // 板材厚度规格管理
      } else {
        viewType.value = view
        selectedProjectId.value = null
      }
    }

    // 项目操作
    const handleCreateProject = async (projectData: any) => {
      const result = await createProject(projectData)
      if (result) {
        showProjectModal.value = false
      } else {
        window.alert('创建项目失败，请重试')
      }
    }

    const handleUpdateProject = async (projectData: any) => {
      if (!editingProject.value) return
      const result = await updateProject(editingProject.value.id, projectData)
      if (result) {
        showProjectModal.value = false
        editingProject.value = null
      } else {
        window.alert('更新项目失败，请重试')
      }
    }

    const handleDeleteProject = async (projectId: number) => {
      const confirmed = window.confirm('确定要删除这个项目吗？此操作不可撤销。')
      if (!confirmed) return

      const success = await deleteProject(projectId)
      if (!success) {
        window.alert('删除项目失败，请重试')
      }
    }

    const handleSelectProject = (projectId: number | null) => {
      selectedProjectId.value = projectId
    }

    const openCreateModal = () => {
      console.log('🚀 openCreateModal called')
      editingProject.value = null
      showProjectModal.value = true
      console.log('🚀 showProjectModal set to:', showProjectModal.value)
    }

    const openEditModal = (project: any) => {
      editingProject.value = project
      showProjectModal.value = true
    }

    // 静默刷新
    const silentRefresh = async (type: 'active' | 'completed') => {
      try {
        if (type === 'completed') {
          const { fetchPastProjects } = useProjectStore()
          await fetchPastProjects()
        } else {
          await fetchProjects()
        }
      } catch (error) {
        console.error('静默刷新失败:', error)
      }
    }

    // 处理搜索结果导航
    const handleSearchNavigate = (result: any) => {
      switch (result.type) {
        case 'projects':
          // 跳转到对应项目视图
          viewType.value = result.status === 'completed' ? 'completed' : 'active'
          selectedProjectId.value = result.id
          break
          
        case 'workers':
          // 跳转到工人管理，并筛选到对应部门
          viewType.value = 'workers'
          selectedDepartment.value = result.department || 'all'
          break
          
        case 'drawings':
          // 跳转到图纸库，并筛选到对应分类
          viewType.value = 'drawings'
          drawingCategory.value = result.category || 'all'
          break
          
        case 'departments':
          // 跳转到工人管理，选中该部门
          viewType.value = 'workers'
          selectedDepartment.value = result.name
          break
      }
    }

    // 全局快捷键监听
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K 或 Cmd+K 打开搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        showSearchModal.value = true
      }
    }

    onMounted(() => {
      document.addEventListener('keydown', handleGlobalKeyDown)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
    })

    const handleSilentRefreshActive = () => silentRefresh('active')
    const handleSilentRefreshCompleted = () => silentRefresh('completed')

    // 处理用户个人信息点击
    const handleProfileClick = () => {
      showUserProfileModal.value = true
    }

    // 处理系统设置点击
    const handleSystemSettingsClick = () => {
      showSettingsPage.value = true
    }

    // 渲染侧边栏
    const renderSidebar = () => {
      switch (viewType.value) {
        case 'active':
          return (
            <ProjectTree
              selectedProjectId={selectedProjectId.value}
              onProjectSelect={handleSelectProject}
              onEditProject={openEditModal}
              onCreateProject={openCreateModal}
              onMobileItemClick={() => {}} // 移动端点击项目时关闭侧边栏的占位
              onBatchSort={handleBatchSort}
              isSorting={isSorting.value}
              className="h-full"
            />
          )
        
        case 'completed':
          return (
            <PastProjectsTree
              selectedProjectId={selectedProjectId.value}
              onProjectSelect={handleSelectProject}
              onMobileItemClick={() => {}} // 移动端点击项目时关闭侧边栏的占位
              className="h-full"
            />
          )
        
        case 'drawings':
          return (
            <DrawingsSidebar
              selectedCategory={drawingCategory.value}
              onCategoryChange={(cat) => drawingCategory.value = cat}
              onRefresh={fetchDrawingStats}
              onUploadClick={() => showDrawingUpload.value = true}
              onMobileItemClick={() => {}} // 移动端点击分类时关闭侧边栏的占位
              className="h-full"
            />
          )
        
        case 'workers':
          return (
            <WorkersSidebar
              selectedDepartment={selectedDepartment.value}
              onDepartmentChange={(dept) => selectedDepartment.value = dept}
              onMobileItemClick={() => {}} // 移动端点击部门时关闭侧边栏的占位
              onRefresh={() => {
                // 触发工人数据刷新事件
                window.dispatchEvent(new CustomEvent('refresh-workers'))
              }}
              className="h-full"
            />
          )
        
        case 'dashboard':
          // 仪表盘视图不需要侧边栏
          return null
        
        case 'settings':
          // 设置视图不需要侧边栏
          return null
        
        default:
          // 默认显示活动项目侧边栏
          return (
            <ProjectTree
              selectedProjectId={selectedProjectId.value}
              onProjectSelect={handleSelectProject}
              onEditProject={openEditModal}
              onCreateProject={openCreateModal}
              className="h-full"
            />
          )
      }
    }

    // 渲染主内容区域
    const renderMainContent = () => {
      if (viewType.value === 'workers') {
        return (
          <div
            key="worker-management"
            class="opacity-0"
            style={{
              animation: 'slideInRight 0.3s ease-in-out forwards'
            }}
          >
            <WorkerManagement 
              className="h-full" 
              selectedDepartment={selectedDepartment.value}
              onDepartmentChange={(dept) => selectedDepartment.value = dept}
            />
          </div>
        )
      }
      
      if (selectedProjectId.value && (viewType.value === 'active' || viewType.value === 'completed')) {
        return (
          <div
            key={`project-detail-${selectedProjectId.value}`}
            class="opacity-0"
            style={{
              animation: 'slideInRight 0.3s ease-in-out forwards'
            }}
          >
            <ProjectDetail
              projectId={selectedProjectId.value}
              onBack={() => handleSelectProject(null)}
              className="h-full"
            />
          </div>
        )
      }
      
      if (viewType.value === 'drawings') {
        return (
          <div
            key="drawing-library"
            class="opacity-0"
            style={{
              animation: 'slideInRight 0.3s ease-in-out forwards'
            }}
          >
            <DrawingLibrary
              className="h-full"
              selectedCategory={drawingCategory.value}
              onCategoryChange={(cat) => drawingCategory.value = cat}
              showUploadModal={showDrawingUpload.value}
              onUploadModalChange={(show) => showDrawingUpload.value = show}
            />
          </div>
        )
      }
      
      if (viewType.value === 'completed') {
        return (
          <div
            key="past-projects-card-view"
            class="opacity-0"
            style={{
              animation: 'slideInRight 0.3s ease-in-out forwards'
            }}
          >
            <PastProjectsCardView
              selectedProjectId={selectedProjectId.value}
              onProjectSelect={handleSelectProject}
              className="h-full overflow-y-auto"
            />
          </div>
        )
      }
      
      if (viewType.value === 'active') {
        return (
          <div
            key="active-projects-card-view"
            class="opacity-0"
            style={{
              animation: 'slideInRight 0.3s ease-in-out forwards'
            }}
          >
            <MaterialsCardView
              selectedProjectId={selectedProjectId.value}
              onProjectSelect={handleSelectProject}
              viewType="active"
              workerNameFilter={workerNameFilter.value}
              thicknessFilter={thicknessFilter.value}
              className="h-full overflow-y-auto"
            />
          </div>
        )
      }
      
      // 默认状态
      return (
        <div
          key={`fallback-view-${viewType.value}`}
          class="opacity-0"
          style={{
            animation: 'slideInRight 0.3s ease-in-out forwards'
          }}
        >
          <div class="flex items-center justify-center h-full">
            <div class="text-center text-gray-500">
              <p class="text-lg">页面加载中...</p>
            </div>
          </div>
        </div>
      )
    }

    return () => (
      <VSCodeLayout
        activeView={viewType.value}
        onViewChange={handleViewChange}
        onSearchClick={() => {
          // 暂时添加防护措施，避免无限递归
          try {
            showSearchModal.value = true
          } catch (error) {
            console.error('搜索模态框打开失败:', error)
          }
        }}
        onSystemSettingsClick={handleSystemSettingsClick}
        onProfileClick={handleProfileClick}
        onMobileSidebarAutoClose={() => {
          // 移动端侧边栏自动关闭时的回调，可以在这里添加额外逻辑
        }}
        sidebar={renderSidebar()}
      >
        {/* 主内容区域 */}
        <Transition
          enterActiveClass="transition-all duration-300"
          leaveActiveClass="transition-all duration-300"
          enterFromClass="opacity-0 translate-x-5"
          enterToClass="opacity-100 translate-x-0"
          leaveFromClass="opacity-100 translate-x-0"
          leaveToClass="opacity-0 -translate-x-5"
          mode="out-in"
        >
          {renderMainContent()}
        </Transition>

        {/* 模态框 */}
        <ProjectModal
          isOpen={showProjectModal.value}
          onClose={() => {
            showProjectModal.value = false
            editingProject.value = null
          }}
          onSubmit={editingProject.value ? handleUpdateProject : handleCreateProject}
          project={editingProject.value}
          loading={false}
        />

        <ThicknessSpecModal
          isOpen={showThicknessSpecModal.value}
          onClose={() => showThicknessSpecModal.value = false}
          onUpdate={() => {}}
        />

        <DashboardModal
          isOpen={showDashboardModal.value}
          onClose={() => showDashboardModal.value = false}
        />

        {/* 搜索模态框 */}
        <SearchModal
          isOpen={showSearchModal.value}
          onClose={() => showSearchModal.value = false}
          onNavigate={handleSearchNavigate}
        />

        {/* 设置页面 */}
        <SettingsPage
          isOpen={showSettingsPage.value}
          onClose={() => showSettingsPage.value = false}
        />

        {/* 用户个人信息模态框 */}
        <UserProfileModal
          isOpen={showUserProfileModal.value}
          onClose={() => showUserProfileModal.value = false}
        />

        {/* 通知容器 */}
        <NotificationContainer />

        {/* CSS动画样式 */}
        <style jsx>{`
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </VSCodeLayout>
    )
  }
})

export default HomeWrapper