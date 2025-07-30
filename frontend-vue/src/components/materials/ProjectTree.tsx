import { defineComponent, ref, computed, onMounted, watch, type PropType } from 'vue'
import { Transition, TransitionGroup } from 'vue'
import { useProjectStore } from '../../stores/index.ts'
import { useAuth } from '../../composables/useAuth.ts'
import { Button, Loading, BatchSortModal } from '../ui/index.ts'
import { ArrowsUpDownIcon } from '@heroicons/vue/24/outline'

interface Project {
  id: number
  name: string
  status: string
  priority: string
  createdAt: string
  created_at?: string // 兼容后端字段名
  creator?: { id: number; name: string }
  assignedWorker?: { id: number; name: string }
}

interface ProjectTreeProps {
  onProjectSelect: (projectId: number | null) => void
  selectedProjectId: number | null
  onCreateProject?: () => void
  onEditProject?: (project: Project) => void
  onDeleteProject?: (projectId: number) => void
  onRefresh?: () => void
  refreshTrigger?: number
  className?: string
  // 筛选参数
  filteredProjects?: Project[]
  onMobileItemClick?: () => void
  // 排序功能
  onBatchSort?: (reorderedItems: any[]) => Promise<void>
  isSorting?: boolean
}

export const ProjectTree = defineComponent({
  name: 'ProjectTree',
  props: {
    onProjectSelect: {
      type: Function as PropType<(projectId: number | null) => void>,
      required: true
    },
    selectedProjectId: {
      type: Number as PropType<number | null>,
      default: null
    },
    onCreateProject: {
      type: Function as PropType<() => void>,
      default: undefined
    },
    onEditProject: {
      type: Function as PropType<(project: Project) => void>,
      default: undefined
    },
    onDeleteProject: {
      type: Function as PropType<(projectId: number) => void>,
      default: undefined
    },
    onRefresh: {
      type: Function as PropType<() => void>,
      default: undefined
    },
    refreshTrigger: {
      type: Number,
      default: 0
    },
    className: {
      type: String,
      default: ''
    },
    filteredProjects: {
      type: Array as PropType<Project[]>,
      default: undefined
    },
    onMobileItemClick: {
      type: Function as PropType<() => void>,
      default: undefined
    },
    onBatchSort: {
      type: Function as PropType<(reorderedItems: any[]) => Promise<void>>,
      default: undefined
    },
    isSorting: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const expandedGroups = ref<Set<string>>(new Set(['all', 'pending']))
    const showSortModal = ref(false)
    
    // 排序功能处理
    const openSortModal = () => {
      showSortModal.value = true
    }

    const closeSortModal = () => {
      showSortModal.value = false
    }

    const handleBatchSort = async (reorderedItems: any[]) => {
      if (props.onBatchSort) {
        await props.onBatchSort(reorderedItems)
      }
    }
    
    // 使用Zustand Store - 修复响应式问题
    const projectStore = useProjectStore()
    
    // 不要直接解构store，而是通过计算属性保持响应式
    const storeProjects = computed(() => projectStore.projects)
    const loading = computed(() => projectStore.loading)
    const lastUpdated = computed(() => projectStore.lastUpdated)
    const fetchProjects = projectStore.fetchProjects
    const deleteProject = projectStore.deleteProject

    // 获取用户权限
    const { user } = useAuth()
    const isAdmin = computed(() => user.value?.role === 'admin')

    // 使用传入的筛选项目或store中的项目 - 修复响应式
    const projects = computed(() => {
      return props.filteredProjects || (storeProjects.value || [])
    })

    // 组件挂载时确保数据获取
    onMounted(() => {
      if ((storeProjects.value || []).length === 0 && !loading.value) {
        fetchProjects()
      }
    })

    // 删除项目处理函数
    const handleDeleteProject = async (projectId: number) => {
      const confirmed = confirm('确定要删除这个项目吗？此操作不可撤销。')
      if (!confirmed) {
        return
      }
      const success = await deleteProject(projectId)
      if (!success) {
        alert('删除项目失败，请重试')
      }
    }

    // 监听refreshTrigger变化
    watch(() => props.refreshTrigger, (newTrigger) => {
      if (newTrigger > 0) { // 只有当refreshTrigger > 0时才刷新
        fetchProjects()
      }
    })

    // 按状态分组项目
    const groupedProjects = computed(() => {
      const projectsArray = projects.value || []
      return {
        all: projectsArray,
        pending: projectsArray.filter((p: any) => p.status === 'pending'),
        in_progress: projectsArray.filter((p: any) => p.status === 'in_progress'),
        completed: projectsArray.filter((p: any) => p.status === 'completed'),
      }
    })

    const toggleGroup = (groupKey: string) => {
      const newExpanded = new Set(expandedGroups.value)
      if (newExpanded.has(groupKey)) {
        newExpanded.delete(groupKey)
      } else {
        newExpanded.add(groupKey)
      }
      expandedGroups.value = newExpanded
    }

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'completed':
          return (
            <div class="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
              <svg class="w-2 h-2" fill="white" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          )
        case 'in_progress':
          return (
            <div class="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
              <svg class="w-2 h-2" fill="white" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
              </svg>
            </div>
          )
        case 'pending':
          return (
            <div class="w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
              <svg class="w-2 h-2" fill="white" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
            </div>
          )
        default:
          return <div class="w-3 h-3 bg-gray-300 rounded-full"></div>
      }
    }

    const getStatusText = (status: string) => {
      switch (status) {
        case 'completed':
          return '已完成'
        case 'in_progress':
          return '进行中'
        case 'pending':
          return '待处理'
        default:
          return '未知'
      }
    }

    const groups = computed(() => [
      { key: 'all', label: '全部项目', icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ), projects: groupedProjects.value.all },
      { key: 'pending', label: '待处理', icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ), projects: groupedProjects.value.pending },
      { key: 'in_progress', label: '进行中', icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 011.5 1.5v1.5m-3-6v6m-1 1v-1a7 7 0 1114 0v1" />
        </svg>
      ), projects: groupedProjects.value.in_progress },
      { key: 'completed', label: '已完成', icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ), projects: groupedProjects.value.completed },
    ])

    if (loading.value) {
      return () => (
        <div class={`bg-white/80 backdrop-blur-xl border-r border-gray-200 ${props.className}`}>
          <div class="p-4 text-center">
            <Loading size="md" text="加载中..." />
          </div>
        </div>
      )
    }

    return () => (
      <div class={`bg-white/80 backdrop-blur-xl border-r border-gray-200 flex flex-col h-full ${props.className}`}>
        {/* 标题区域 */}
        <div class="px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-gray-900 text-sm">项目列表</h2>
            <div class="flex items-center space-x-2">
              {/* 排序按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={openSortModal}
                disabled={props.isSorting || !props.onBatchSort || (props.filteredProjects && props.filteredProjects.length === 0)}
                class="flex items-center space-x-1"
              >
                <ArrowsUpDownIcon class="w-3 h-3" />
                <span>{props.isSorting ? '处理中...' : '排序'}</span>
              </Button>
              
              {/* 新建项目按钮 */}
              <Button
                onClick={() => {
                  props.onCreateProject?.()
                  props.onMobileItemClick?.() // 移动端自动收回侧边栏
                }}
                class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                size="sm"
              >
                + 新建
              </Button>
            </div>
          </div>
        </div>

        {/* 项目树 */}
        <div class="flex-1 overflow-y-auto">
          {groups.value.map((group) => (
            <div key={group.key} class="border-b border-gray-100 last:border-b-0">
              {/* 分组标题 */}
              <Button
                onClick={() => toggleGroup(group.key)}
                variant="ghost"
                class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors h-auto"
              >
                <div class="flex items-center space-x-2">
                  <div class="text-ios18-blue">{group.icon}</div>
                  <span class="font-medium text-gray-900 text-sm">{group.label}</span>
                  <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {group.projects.length}
                  </span>
                </div>
                <Transition
                  enterActiveClass="transition-transform duration-200"
                  leaveActiveClass="transition-transform duration-200"
                  enterFromClass="rotate-0"
                  enterToClass="rotate-90"
                  leaveFromClass="rotate-90"
                  leaveToClass="rotate-0"
                >
                  <span
                    class={`text-gray-500 transition-transform duration-200 ${
                      expandedGroups.value.has(group.key) ? 'rotate-90' : 'rotate-0'
                    }`}
                  >
                    ▶
                  </span>
                </Transition>
              </Button>

              {/* 项目列表 */}
              <Transition
                enterActiveClass="transition-all duration-300"
                leaveActiveClass="transition-all duration-300"
                enterFromClass="opacity-0 max-h-0"
                enterToClass="opacity-100 max-h-screen"
                leaveFromClass="opacity-100 max-h-screen"
                leaveToClass="opacity-0 max-h-0"
              >
                {expandedGroups.value.has(group.key) && (
                  <div class="overflow-hidden">
                    {group.projects.length === 0 ? (
                      <div class="px-4 py-3 text-sm text-gray-500 text-center">
                        暂无项目
                      </div>
                    ) : (
                      <div class="space-y-1 pb-2">
                        {group.projects.map((project: any) => (
                          <Transition
                            key={project.id}
                            enterActiveClass="transition-all duration-200"
                            leaveActiveClass="transition-all duration-200"
                            enterFromClass="opacity-0 translate-x-2"
                            enterToClass="opacity-100 translate-x-0"
                            leaveFromClass="opacity-100 translate-x-0"
                            leaveToClass="opacity-0 translate-x-2"
                          >
                            <div
                              onClick={() => {
                                props.onProjectSelect(project.id)
                                props.onMobileItemClick?.() // 通知移动端关闭侧边栏
                              }}
                              class={`group w-full px-4 py-2 mx-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                props.selectedProjectId === project.id
                                  ? 'bg-blue-500 text-white shadow-md'
                                  : 'hover:bg-gray-100 text-gray-900'
                              }`}
                            >
                              <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-2 flex-1 min-w-0">
                                  {getStatusIcon(project.status)}
                                  <div class="flex-1 min-w-0">
                                    <div class="font-medium truncate text-sm">
                                      {project.name}
                                    </div>
                                    <div class={`text-xs truncate ${
                                      props.selectedProjectId === project.id
                                        ? 'text-blue-100' 
                                        : 'text-gray-600'
                                    }`}>
                                      {project.assignedWorker?.name || '未分配'} • {getStatusText(project.status)}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 项目操作按钮 */}
                                <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    onClick={(e: Event) => {
                                      e.stopPropagation()
                                      props.onEditProject?.(project)
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    class={`p-1 rounded hover:bg-black/10 h-auto ${
                                      props.selectedProjectId === project.id ? 'text-white' : 'text-gray-500'
                                    }`}
                                  >
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </Button>
                                  {isAdmin.value && (
                                    <Button
                                      onClick={(e: Event) => {
                                        e.stopPropagation()
                                        handleDeleteProject(project.id)
                                      }}
                                      variant="ghost"
                                      size="sm"
                                      class={`p-1 rounded hover:bg-black/10 h-auto ${
                                        props.selectedProjectId === project.id ? 'text-white' : 'text-red-500'
                                      }`}
                                    >
                                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Transition>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Transition>
            </div>
          ))}
        </div>

        {/* 批量排序模态框 */}
        <BatchSortModal
          isOpen={showSortModal.value}
          onClose={closeSortModal}
          items={(props.filteredProjects || projects.value).map((project: any, index: number) => ({
            id: project.id,
            name: project.name,
            currentPosition: index + 1
          }))}
          onSave={handleBatchSort}
          title="调整项目排序"
        />
      </div>
    )
  }
})

export default ProjectTree