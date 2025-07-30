import { defineComponent, ref, computed, onMounted, watch, type PropType } from 'vue'
import { Transition } from 'vue'
import { useAuth } from '../../composables/useAuth.ts'
import { useMaterialStore, useProjectStore, type ProjectState } from '../../stores/index.ts'
import { Loading, Empty, EmptyData } from '../ui/index.ts'
import type { StatusType } from '../ui/index.ts'
import { ActiveProjectCard } from '../projects/ProjectCard.tsx'
import { 
  updateMaterialStatusShared, 
  getProjectMaterialStatus 
} from '../../utils/materialStatusManager.ts'

interface MaterialsCardViewProps {
  selectedProjectId: number | null
  onProjectSelect: (id: number | null) => void
  viewType?: 'active' | 'completed'
  workerNameFilter?: string
  thicknessFilter?: string
  className?: string
}

export const MaterialsCardView = defineComponent({
  name: 'MaterialsCardView',
  props: {
    selectedProjectId: {
      type: Number as PropType<number | null>,
      default: null
    },
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
  setup(props) {
    const loading = ref(false)
    const thicknessSpecs = ref<any[]>([])
    const movingToPast = ref<number | null>(null)
    
    const { token, user } = useAuth()
    const { updateMaterialStatus } = useMaterialStore()
    const projectStore = useProjectStore()
    
    // 确保响应式访问store数据
    const projects = computed(() => projectStore.projects)
    const projectsLoading = computed(() => projectStore.loading)
    const fetchProjects = projectStore.fetchProjects
    const updateProject = projectStore.updateProject
    const moveToPastProject = projectStore.moveToPastProject

    // 调试用：直接监听store状态
    const debugProjects = computed(() => {
      console.log('🔍 MaterialsCardView: debugProjects计算属性执行')
      console.log('🔍 MaterialsCardView: projectStore.projects:', projectStore.projects)
      console.log('🔍 MaterialsCardView: projects.value:', projects.value)
      return projects.value
    })

    // 根据筛选条件过滤项目
    const getFilteredProjects = (): ProjectState[] => {
      console.log('🔍 MaterialsCardView: getFilteredProjects被调用')
      let projectList = projects.value || []
      console.log('🔍 MaterialsCardView: 原始项目列表长度:', projectList.length)
      
      // 应用工人姓名筛选
      if (props.workerNameFilter) {
        projectList = projectList.filter(project => 
          project.assignedWorker?.name === props.workerNameFilter
        )
        console.log('🔍 MaterialsCardView: 工人筛选后长度:', projectList.length)
      }
      
      // 应用板材厚度筛选
      if (props.thicknessFilter) {
        projectList = projectList.filter(project => {
          return project.materials?.some(material => 
            material.thicknessSpec?.thickness === props.thicknessFilter
          ) || false
        })
        console.log('🔍 MaterialsCardView: 厚度筛选后长度:', projectList.length)
      }
      
      console.log('🔍 MaterialsCardView: 最终筛选结果长度:', projectList.length)
      return projectList
    }

    const filteredProjects = computed(() => getFilteredProjects())

    // 获取厚度规格数据
    const fetchThicknessSpecs = async () => {
      if (!token.value) return
      
      try {
        const response = await fetch('http://110.40.71.83:35001/api/thickness-specs', {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          thicknessSpecs.value = data.thicknessSpecs || []
        }
      } catch (error) {
        console.error('获取厚度规格失败:', error)
      }
    }

    onMounted(() => {
      console.log('🚀 MaterialsCardView: 组件挂载')
      fetchThicknessSpecs()
      // 依赖ProjectTree获取项目数据，这里不重复调用
      console.log('🚀 MaterialsCardView: 依赖ProjectTree获取项目数据，避免重复调用')
    })

    // 移除token变化时的重复数据获取
    watch(token, (newToken) => {
      console.log('📡 MaterialsCardView: Token变化，新Token状态:', !!newToken)
      if (newToken) {
        console.log('📡 MaterialsCardView: Token可用，获取厚度规格...')
        fetchThicknessSpecs()
        // 不再重复获取项目数据
      }
    })

    // 监听项目数据变化，确保界面更新
    watch(() => projects.value, (newProjects, oldProjects) => {
      console.log('📊 MaterialsCardView: projects.value数据变化')
      console.log('📊 MaterialsCardView: 旧数据长度:', (oldProjects || []).length)
      console.log('📊 MaterialsCardView: 新数据长度:', (newProjects || []).length)
      console.log('📊 MaterialsCardView: 新数据内容:', newProjects)
    }, { deep: true })

    // 处理编辑项目
    const handleEditProject = (projectId: number) => {
      props.onProjectSelect(projectId)
    }

    // 处理移至过往
    const handleMoveToPast = async (projectId: number) => {
      const confirmed = window.confirm('确定要将此项目移动到过往项目吗？此操作将把项目从活跃状态移动到过往项目管理中。')
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
      } catch (error) {
        console.error('移动项目到过往失败:', error)
      } finally {
        movingToPast.value = null
      }
    }

    // 处理材料状态变更 - 乐观更新版本
    const handleMaterialStatusChange = async (materialId: number, newStatus: StatusType) => {
      if (!token.value || !user.value) return

      // 找到对应的材料和项目
      let targetProject: ProjectState | null = null
      let targetMaterial: any = null
      let targetThicknessSpecId: number | null = null
      
      for (const project of (filteredProjects.value || [])) {
        const material = project.materials?.find(m => m.id === materialId)
        if (material) {
          targetProject = project
          targetMaterial = material
          targetThicknessSpecId = material.thicknessSpecId
          break
        }
      }
      
      if (!targetProject || !targetMaterial || !targetThicknessSpecId) {
        console.error('无法找到材料对应的项目或材料信息')
        return
      }

      // 保存原始状态，用于错误回滚
      const originalStatus = targetMaterial.status
      const originalStartDate = targetMaterial.startDate
      const originalCompletedDate = targetMaterial.completedDate
      const originalCompletedBy = targetMaterial.completedBy

      try {
        // 1. 乐观更新：立即更新UI状态（通过Pinia store）
        const { optimisticUpdateMaterialStatus, setOptimisticUpdating } = useProjectStore()
        
        // 设置乐观更新标记
        setOptimisticUpdating(true)
        
        optimisticUpdateMaterialStatus(targetProject.id, materialId, newStatus, user.value)

        // 2. 后台同步：调用API更新服务器数据
        const success = await updateMaterialStatusShared(targetProject.id, targetThicknessSpecId, newStatus, {
          projects: (filteredProjects.value || []) as any[],
          thicknessSpecs: thicknessSpecs.value,
          user: user.value,
          updateProjectFn: updateProject,
          fetchProjectsFn: async () => {
            // 静默刷新，不显示loading状态
            console.log('🔄 MaterialsCardView静默同步项目数据...')
            await fetchProjects()
            // 清除乐观更新标记
            setOptimisticUpdating(false)
          },
          // 不设置loading状态，避免UI刷新感
        })
        
        if (!success) {
          throw new Error('服务器更新失败')
        }

        // 3. 成功后不再手动刷新，让事件系统处理
        // 清除乐观更新标记，让其他地方的事件监听器接管
        setTimeout(() => {
          setOptimisticUpdating(false)
          console.log('✅ 乐观更新完成，移交给事件系统')
        }, 1500)
        
      } catch (error) {
        console.error('更新材料状态失败:', error)
        
        // 4. 错误回滚：恢复原始状态（通过Pinia store）
        const { optimisticUpdateMaterialStatus, setOptimisticUpdating } = useProjectStore()
        
        // 清除乐观更新标记
        setOptimisticUpdating(false)
        
        optimisticUpdateMaterialStatus(targetProject.id, materialId, originalStatus, 
          originalCompletedBy ? { id: originalCompletedBy, name: '未知用户' } : undefined)
        
        // 显示错误提示
        alert('更新失败，已恢复到之前的状态。请稍后重试。')
      }
    }

    return () => {
      console.log('🎨 MaterialsCardView: 渲染函数执行')
      console.log('🎨 MaterialsCardView: projects.value访问:', projects.value)
      console.log('🎨 MaterialsCardView: filteredProjects.value:', filteredProjects.value)
      console.log('🎨 MaterialsCardView: loading状态:', projectsLoading.value)
      
      // 修复loading状态判断，处理undefined情况
      const isLoading = projectsLoading.value === true
      
      if (isLoading) {
        console.log('🎨 MaterialsCardView: 显示加载状态')
        return (
          <div class="flex items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        )
      }

      const projectCount = (filteredProjects.value || []).length
      console.log('🎨 MaterialsCardView: 项目数量:', projectCount)

      if (projectCount === 0) {
        console.log('🎨 MaterialsCardView: 显示空数据状态')
        return (
          <div class="p-8">
            <div class="text-center">
              <h3 class="text-lg font-medium text-gray-900 mb-2">暂无项目数据</h3>
              <p class="text-gray-500 mb-4">
                {props.workerNameFilter || props.thicknessFilter 
                  ? "当前筛选条件下没有找到匹配的项目"
                  : "还没有创建任何项目，点击上方按钮开始创建"
                }
              </p>
              <div class="text-sm text-gray-400 space-y-1">
                <div>调试信息：</div>
                <div>projects.value长度: {(projects.value || []).length}</div>
                <div>loading状态: {String(projectsLoading.value)}</div>
                <div>token状态: {String(!!token.value)}</div>
              </div>
            </div>
          </div>
        )
      }

      console.log('🎨 MaterialsCardView: 显示项目数据，项目数量:', projectCount)

      return (
        <div class={`h-full flex flex-col p-4 ${props.className}`}>
          {/* 项目统计信息 */}
          <div class="bg-white rounded-lg shadow-sm border p-4 mb-4 flex-shrink-0">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-gray-900">{(filteredProjects.value || []).length}</div>
                <div class="text-sm text-gray-500">项目总数</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-blue-600">
                  {(filteredProjects.value || []).filter(p => p.status === 'in_progress').length}
                </div>
                <div class="text-sm text-gray-500">进行中</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-green-600">
                  {(filteredProjects.value || []).filter(p => p.status === 'completed').length}
                </div>
                <div class="text-sm text-gray-500">已完成</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-600">
                  {(filteredProjects.value || []).reduce((total, p) => total + (p.materials?.length || 0), 0)}
                </div>
                <div class="text-sm text-gray-500">板材总数</div>
              </div>
            </div>
          </div>

          {/* 项目卡片网格 */}
          <div class="flex-1 overflow-y-auto overflow-x-hidden pr-4">
            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
              {(filteredProjects.value || []).map((project) => (
                <ActiveProjectCard
                  key={project.id}
                  project={{
                    id: project.id,
                    name: project.name,
                    status: project.status,
                    priority: project.priority,
                    assignedWorker: project.assignedWorker,
                    materials: (project.materials || []) as any,
                    drawings: project.drawings || [],
                    createdAt: project.createdAt,
                    description: (project as any).description
                  }}
                  onEdit={handleEditProject}
                  onMaterialStatusChange={handleMaterialStatusChange}
                  onMoveToPast={handleMoveToPast}
                  movingToPast={movingToPast.value === project.id}
                />
              ))}
            </div>
          </div>

          {/* 加载状态覆盖层 */}
          <Transition
            enterActiveClass="transition-opacity duration-200"
            leaveActiveClass="transition-opacity duration-200"
            enterFromClass="opacity-0"
            enterToClass="opacity-100"
            leaveFromClass="opacity-100"
            leaveToClass="opacity-0"
          >
            {loading.value && (
              <div class="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div class="bg-white rounded-lg p-6 shadow-xl">
                  <Loading size="lg" />
                  <div class="mt-2 text-center text-gray-600">更新中...</div>
                </div>
              </div>
            )}
          </Transition>
        </div>
      )
    }
  }
})

export default MaterialsCardView