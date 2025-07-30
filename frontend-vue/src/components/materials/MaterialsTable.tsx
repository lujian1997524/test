import { defineComponent, ref, computed, onMounted, onUnmounted, watch, nextTick, type PropType } from 'vue'
import { arrayMove } from '@dnd-kit/sortable'
import { SortableProjectRow } from './SortableProjectRow.tsx'
import { useAuth } from '../../composables/useAuth.ts'
import { useMaterialStore, useProjectStore, type ProjectState } from '../../stores/index.ts'
import { StatusToggle, DrawingHoverCard, Table, TableHeader, TableBody, TableRow, TableCell, TableContainer, Empty, EmptyData } from '../ui/index.ts'
import { ArchiveBoxIcon } from '@heroicons/vue/24/outline'
// import cadFileHandler from '../../utils/cadFileHandler.ts'
import { 
  updateMaterialStatusShared, 
  getProjectMaterialStatus 
} from '../../utils/materialStatusManager.ts'
import { ResponsiveMaterialsTable } from './ResponsiveMaterialsTable.tsx'
import { useResponsive } from '../../composables/useResponsive.ts'

interface ThicknessSpec {
  id: number
  thickness: string
  unit: string
  materialType: string
  isActive: boolean
  sortOrder: number
}

interface Material {
  id: number
  projectId: number
  thicknessSpecId: number
  status: 'pending' | 'in_progress' | 'completed'
  completedBy?: { id: number; name: string }
  startDate?: string
  completedDate?: string
  notes?: string
  thicknessSpec: ThicknessSpec
}

interface Drawing {
  id: number
  projectId: number
  filename: string
  originalFilename?: string
  filePath: string
  version: string
  createdAt: string
}

interface MaterialsTableProps {
  selectedProjectId: number | null
  onProjectSelect: (id: number | null) => void
  viewType?: 'active' | 'completed'
  workerNameFilter?: string
  thicknessFilter?: string
  className?: string
}

export const MaterialsTable = defineComponent({
  name: 'MaterialsTable',
  props: {
    selectedProjectId: [Number, null] as PropType<number | null>,
    onProjectSelect: {
      type: Function as PropType<(id: number | null) => void>,
      required: true
    },
    viewType: {
      type: String as PropType<'active' | 'completed'>,
      default: 'active'
    },
    workerNameFilter: {
      type: String,
      default: ''
    },
    thicknessFilter: {
      type: String,
      default: ''
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { emit }) {
    const { isMobile, isTablet, isDesktop } = useResponsive()
    const thicknessSpecs = ref<ThicknessSpec[]>([])
    const loading = ref(false)
    const editingNotes = ref<{projectId: number, thicknessSpecId: number} | null>(null)
    const tempNotes = ref('')
    const movingToPast = ref<number | null>(null)
    const restoringFromPast = ref<number | null>(null)
    
    // 拖拽排序相关状态
    const projectOrder = ref<ProjectState[]>([])
    const isReordering = ref(false)
    
    // 添加hover预览相关状态
    const hoverCard = ref<{
      isVisible: boolean
      position: { x: number; y: number }
      drawings: Drawing[]
    }>({
      isVisible: false,
      position: { x: 0, y: 0 },
      drawings: []
    })
    
    const { token, user } = useAuth()
    const { updateMaterialStatus } = useMaterialStore()
    const { projects, completedProjects, pastProjects, updateProject, fetchProjects, moveToPastProject, restoreFromPastProject } = useProjectStore()

    // 根据视图类型获取对应的项目列表，并应用筛选
    const getProjectsList = (): ProjectState[] => {
      let projectList: ProjectState[]
      
      switch (props.viewType) {
        case 'completed':
          projectList = pastProjects.value // 使用过往项目数据
          break
        default:
          projectList = projects.value
          break
      }
      
      // 应用工人姓名筛选
      if (props.workerNameFilter) {
        projectList = projectList.filter(project => 
          project.assignedWorker?.name === props.workerNameFilter
        )
      }
      
      // 应用板材厚度筛选 - 只要项目包含指定厚度的板材就显示
      if (props.thicknessFilter) {
        projectList = projectList.filter(project => {
          // 检查项目是否有指定厚度的材料
          return project.materials?.some(material => 
            material.thicknessSpec?.thickness === props.thicknessFilter
          ) || false
        })
      }
      
      return projectList
    }

    // 同步项目排序状态
    watch([projects, pastProjects, () => props.workerNameFilter, () => props.thicknessFilter, () => props.viewType], () => {
      const projectsList = getProjectsList()
      if (JSON.stringify(projectOrder.value) !== JSON.stringify(projectsList)) {
        projectOrder.value = projectsList
      }
    }, { deep: true })

    // 处理拖拽结束 - 移除直接API调用，避免重复请求
    const handleDragEnd = async (event: any) => {
      const { active, over } = event

      if (active.id !== over?.id) {
        const oldIndex = projectOrder.value.findIndex(project => project.id === active.id)
        const newIndex = projectOrder.value.findIndex(project => project.id === over.id)
        
        const newOrder = arrayMove(projectOrder.value, oldIndex, newIndex)
        projectOrder.value = newOrder

        // 注意：不在这里发送API请求，避免与Home.tsx中的BatchSortModal重复
        // 拖拽排序会立即更新UI显示，但不会保存到后端
        // 需要用户通过批量排序功能确认保存
      }
    }

    // 如果还没有加载厚度规格，先加载
    watch(token, (newToken) => {
      if (newToken && thicknessSpecs.value.length === 0) {
        fetchThicknessSpecs()
      }
    }, { immediate: true })

    // 监听材料更新事件，刷新项目数据
    let debounceTimeout: number | null = null
    let lastProcessedTimestamp = 0
    
    const handleMaterialsUpdate = (event: CustomEvent) => {
      const eventDetail = event.detail
      const eventTimestamp = eventDetail?.timestamp || Date.now()
      
      // 如果事件来自SSE，则跳过处理（因为Store层已经处理了）
      if (eventDetail?.fromSSE) {
        console.log('⏭️ MaterialsTable跳过SSE事件（已由SSE处理器处理）')
        return
      }
      
      // 防止重复处理相同的事件
      if (eventTimestamp <= lastProcessedTimestamp) {
        console.log('⏭️ MaterialsTable跳过重复事件')
        return
      }
      
      lastProcessedTimestamp = eventTimestamp
      
      // 清除之前的防抖定时器
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }
      
      // 防抖延迟刷新，避免与Store层冲突
      debounceTimeout = window.setTimeout(() => {
        console.log('🔄 MaterialsTable层刷新项目数据...')
        fetchProjects()
      }, 1000) // 更长的防抖时间，让Store层先处理
    }

    onMounted(() => {
      window.addEventListener('materials-updated', handleMaterialsUpdate as EventListener)
    })
    
    onUnmounted(() => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }
      window.removeEventListener('materials-updated', handleMaterialsUpdate as EventListener)
    })

    const fetchThicknessSpecs = async () => {
      if (!token.value) {
        console.log('Token not available, skipping thickness specs fetch')
        return
      }
      
      try {
        const response = await fetch('http://110.40.71.83:35001/api/thickness-specs', {
          headers: {
            'Authorization': `Bearer ${token.value}`,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          thicknessSpecs.value = data.thicknessSpecs || []
        }
      } catch (error) {
        console.error('获取厚度规格失败:', error)
      }
    }

    // 更新材料状态 - 使用共享逻辑
    const updateMaterialStatusInTable = async (projectId: number, thicknessSpecId: number, newStatus: StatusType) => {
      const success = await updateMaterialStatusShared(projectId, thicknessSpecId, newStatus, {
        projects: getProjectsList() as any[],
        thicknessSpecs: thicknessSpecs.value,
        user: user.value,
        updateProjectFn: updateProject,
        fetchProjectsFn: fetchProjects,
        setLoadingFn: (loadingState: boolean) => { loading.value = loadingState },
      })
      
      if (!success) {
        console.error('材料状态更新失败')
      }
    }

    // 恢复项目从过往
    const handleRestoreFromPast = async (projectId: number) => {
      const confirmed = confirm('确定要将此项目恢复到活跃状态吗？项目将重新回到活跃项目列表中。')
      if (!confirmed) {
        return
      }
      
      restoringFromPast.value = projectId
      try {
        const success = await restoreFromPastProject(projectId)
        if (success) {
          // 恢复成功，刷新项目列表
          await fetchProjects()
        }
      } finally {
        restoringFromPast.value = null
      }
    }

    // 移动项目到过往
    const handleMoveToPast = async (projectId: number) => {
      const confirmed = confirm('确定要将此项目移动到过往项目吗？此操作将把项目从活跃状态移动到过往项目管理中。')
      if (!confirmed) {
        return
      }
      
      movingToPast.value = projectId
      try {
        const success = await moveToPastProject(projectId)
        if (success) {
          // 移动成功，刷新项目列表
          await fetchProjects()
        }
      } finally {
        movingToPast.value = null
      }
    }

    // 获取项目的材料状态（根据厚度规格ID）- 使用共享逻辑
    const getProjectMaterialStatusForTable = (projectId: number, thicknessSpecId: number) => {
      return getProjectMaterialStatus(getProjectsList() as any[], projectId, thicknessSpecId)
    }

    // 获取项目的材料信息
    const getProjectMaterial = (projectId: number, thicknessSpecId: number) => {
      const proj = getProjectsList().find(p => p.id === projectId)
      if (!proj || !proj.materials) return null
      return proj.materials.find(m => m.thicknessSpecId === thicknessSpecId) || null
    }

    // 处理图纸hover预览
    const handleDrawingHover = (event: MouseEvent, drawings: Drawing[]) => {
      if (drawings.length === 0) return
      
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      hoverCard.value = {
        isVisible: true,
        position: {
          x: rect.right + 10,
          y: rect.top
        },
        drawings
      }
    }

    // 关闭hover预览
    const handleCloseHover = () => {
      hoverCard.value = {
        isVisible: false,
        position: { x: 0, y: 0 },
        drawings: []
      }
    }

    // 处理打开图纸
    const handleOpenDrawing = async (drawing: Drawing) => {
      try {
        const fileName = drawing.originalFilename || drawing.filename
        // const cadCheck = await cadFileHandler.isCADFile(fileName)
        
        // 暂时简化处理，直接下载文件
        window.open(`/api/drawings/${drawing.id}/download`, '_blank')
        
        // 关闭预览卡片
        handleCloseHover()
      } catch (error) {
        console.error('打开图纸失败:', error)
        alert('打开图纸失败')
      }
    }

    const getStatusText = (status: string) => {
      switch (status) {
        case 'pending': return '待处理'
        case 'in_progress': return '进行中'
        case 'completed': return '已完成'
        default: return status
      }
    }

    const getPriorityText = (priority: string) => {
      switch (priority) {
        case 'high': return '高'
        case 'medium': return '中'
        case 'low': return '低'
        default: return priority
      }
    }

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high': return 'text-red-700 bg-red-100'
        case 'medium': return 'text-yellow-700 bg-yellow-100'
        case 'low': return 'text-green-700 bg-green-100'
        default: return 'text-gray-700 bg-gray-100'
      }
    }

    const getPriorityColorBadge = (priority: string) => {
      switch (priority) {
        case 'high': return 'bg-red-500'
        case 'medium': return 'bg-yellow-500'
        case 'low': return 'bg-green-500'
        default: return 'bg-gray-500'
      }
    }

    // 要显示的项目列表
    const projectsToShow = computed(() => 
      props.selectedProjectId ? projectOrder.value.filter(p => p.id === props.selectedProjectId) : projectOrder.value
    )

    // 显示项目列表（格式：序号-项目名-工人-2mm-3mm-4mm...-创建时间-开始时间-完成时间-图纸）
    const renderProjectsTable = () => {
      return (
        <div class={`bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col ${props.className}`}>
          {/* 项目表格 */}
          <div class="flex-1 overflow-auto">
            <TableContainer 
              title={props.viewType === 'completed' ? '过往项目' : '活跃项目'}
              description={`显示${props.viewType === 'completed' ? '已完成的' : '进行中的'}项目信息`}
              showEmptyState={projectsToShow.value.length === 0}
              emptyState={{
                title: props.viewType === 'completed' ? '暂无过往项目' : '暂无活跃项目',
                description: props.viewType === 'active' ? '点击右上角"新建"按钮创建项目' : 
                           props.viewType === 'completed' ? '已完成的项目移动到过往后会显示在这里' : ''
              }}
            >
              <Table
                sortable
                sortableItems={projectsToShow.value.map(p => p.id)}
                onDragEnd={handleDragEnd}
              >
                <TableHeader>
                  <TableRow>
                    <TableCell type="header">序号</TableCell>
                    <TableCell type="header">项目名</TableCell>
                    {/* 厚度列 */}
                    {thicknessSpecs.value.map(spec => (
                      <TableCell key={spec.id} type="header" align="center">
                        {spec.thickness}{spec.unit}
                      </TableCell>
                    ))}
                    <TableCell type="header">创建时间</TableCell>
                    <TableCell type="header">开始时间</TableCell>
                    <TableCell type="header">完成时间</TableCell>
                    <TableCell type="header">图纸</TableCell>
                    <TableCell type="header">操作</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody sortable sortableItems={projectsToShow.value.map(p => p.id)}>
                  {projectsToShow.value.map((proj, index) => (
                    <SortableProjectRow
                      key={proj.id}
                      project={proj}
                      index={index}
                      thicknessSpecs={thicknessSpecs.value}
                      viewType={props.viewType}
                      movingToPast={movingToPast.value}
                      restoringFromPast={restoringFromPast.value}
                      getProjectMaterialStatusForTable={getProjectMaterialStatusForTable}
                      updateMaterialStatusInTable={updateMaterialStatusInTable}
                      handleDrawingHover={handleDrawingHover}
                      handleCloseHover={handleCloseHover}
                      onProjectSelect={props.onProjectSelect}
                      handleMoveToPast={handleMoveToPast}
                      handleRestoreFromPast={handleRestoreFromPast}
                      getStatusText={getStatusText}
                      getPriorityColorBadge={getPriorityColorBadge}
                      getPriorityText={getPriorityText}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
          
          {/* 图纸预览卡片 */}
          <DrawingHoverCard
            drawings={hoverCard.value.drawings}
            isVisible={hoverCard.value.isVisible}
            position={hoverCard.value.position}
            onClose={handleCloseHover}
            onOpenDrawing={handleOpenDrawing}
          />
        </div>
      )
    }

    return () => (
      <>
        {/* 根据设备类型渲染不同的表格 */}
        {(isMobile.value || isTablet.value) ? (
          <ResponsiveMaterialsTable
            projects={projectsToShow.value}
            thicknessSpecs={thicknessSpecs.value}
            viewType={props.viewType}
            movingToPast={movingToPast.value}
            restoringFromPast={restoringFromPast.value}
            getProjectMaterialStatusForTable={getProjectMaterialStatusForTable}
            updateMaterialStatusInTable={updateMaterialStatusInTable}
            handleDrawingHover={handleDrawingHover}
            handleCloseHover={handleCloseHover}
            onProjectSelect={props.onProjectSelect}
            handleMoveToPast={handleMoveToPast}
            handleRestoreFromPast={handleRestoreFromPast}
            getStatusText={getStatusText}
            getPriorityColorBadge={getPriorityColorBadge}
            getPriorityText={getPriorityText}
          />
        ) : (
          renderProjectsTable()
        )}
      </>
    )
  }
})