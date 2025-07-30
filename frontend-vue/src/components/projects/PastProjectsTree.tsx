import { defineComponent, ref, onMounted, computed, type PropType } from 'vue'
import { Transition } from 'vue'
import { useAuth } from '../../composables/useAuth.ts'
import { useProjectStore } from '../../stores/index.ts'
import { Loading } from '../ui/index.ts'

// 使用ProjectState类型，因为这与实际数据结构匹配
interface PastProject {
  id: number
  name: string
  status: string
  priority: string
  createdAt?: string
  created_at?: string
  creator?: { id: number; name: string }
  assignedWorker?: { id: number; name: string }
  // 过往项目特有字段（从API返回）
  isPastProject?: boolean
  movedToPastAt?: string
  pastProjectMover?: { id: number; name: string }
}

interface PastProjectsTreeProps {
  onProjectSelect: (projectId: number | null) => void
  selectedProjectId: number | null
  onRefresh?: () => void
  className?: string
  onMobileItemClick?: () => void
}

export const PastProjectsTree = defineComponent({
  name: 'PastProjectsTree',
  props: {
    onProjectSelect: {
      type: Function as PropType<(projectId: number | null) => void>,
      required: true
    },
    selectedProjectId: {
      type: [Number, Object] as PropType<number | null>,
      default: null
    },
    onRefresh: Function as PropType<() => void>,
    className: {
      type: String,
      default: ''
    },
    onMobileItemClick: Function as PropType<() => void>
  },
  setup(props, { emit }) {
    const expandedMonths = ref<Set<string>>(new Set())
    const { user } = useAuth()
    
    // 使用Pinia Store - 修复响应式
    const projectStore = useProjectStore()
    const pastProjects = computed(() => projectStore.pastProjects)
    const pastProjectsByMonth = computed(() => projectStore.pastProjectsByMonth)
    const loading = computed(() => projectStore.loading)
    const fetchPastProjects = projectStore.fetchPastProjects
    const lastUpdated = computed(() => projectStore.lastUpdated)

    // 初始加载过往项目数据
    onMounted(() => {
      fetchPastProjects()
    })

    // 切换月份展开/折叠
    const toggleMonth = (monthKey: string) => {
      const newExpanded = new Set(expandedMonths.value)
      if (newExpanded.has(monthKey)) {
        newExpanded.delete(monthKey)
      } else {
        newExpanded.add(monthKey)
      }
      expandedMonths.value = newExpanded
    }

    // 获取月份显示文本
    const getMonthDisplayText = (monthKey: string) => {
      const [year, month] = monthKey.split('-')
      return `${year}年${parseInt(month)}月`
    }

    // 获取项目状态颜色
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return 'text-green-600'
        case 'cancelled': return 'text-gray-500'
        default: return 'text-blue-600'
      }
    }

    // 获取项目状态文本
    const getStatusText = (status: string) => {
      switch (status) {
        case 'completed': return '已完成'
        case 'cancelled': return '已取消'
        case 'in_progress': return '进行中'
        case 'pending': return '待处理'
        default: return status
      }
    }

    // 格式化时间显示
    const formatDateTime = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 获取按时间倒序排列的月份列表
    const sortedMonthKeys = computed(() => 
      Object.keys(pastProjectsByMonth.value || {}).sort((a, b) => b.localeCompare(a))
    )

    // 处理刷新
    const handleRefresh = () => {
      fetchPastProjects()
      props.onRefresh?.()
    }

    return () => (
      <div class={`h-full bg-white/80 backdrop-blur-xl border-r border-gray-200 flex flex-col ${props.className}`}>
        {/* 标题栏 */}
        <div class="p-3 border-b border-gray-200 flex-shrink-0">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold text-text-primary">
                过往项目
              </h3>
              <p class="text-sm text-text-secondary mt-1">
                按月份组织管理
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading.value}
              class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="刷新过往项目"
              style={{
                transform: 'scale(1)',
                transition: 'transform 0.1s'
              }}
              onMouseenter={(e) => {
                (e.target as HTMLElement).style.transform = 'scale(1.05)'
              }}
              onMouseleave={(e) => {
                (e.target as HTMLElement).style.transform = 'scale(1)'
              }}
              onMousedown={(e) => {
                (e.target as HTMLElement).style.transform = 'scale(0.95)'
              }}
              onMouseup={(e) => {
                (e.target as HTMLElement).style.transform = 'scale(1.05)'
              }}
            >
              <svg 
                class={`w-4 h-4 text-gray-600 ${loading.value ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* 项目树内容 */}
        <div class="flex-1 overflow-y-auto p-4">
          {loading.value && (pastProjects.value || []).length === 0 ? (
            <div class="flex items-center justify-center h-32">
              <Loading size="md" text="加载中..." />
            </div>
          ) : sortedMonthKeys.value.length === 0 ? (
            <div class="flex items-center justify-center h-32">
              <div class="text-center">
                <svg class="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <p class="text-sm text-gray-500">暂无过往项目</p>
                <p class="text-xs text-gray-400 mt-1">已完成的项目移动到过往后会显示在这里</p>
              </div>
            </div>
          ) : (
            <div class="space-y-2">
              {sortedMonthKeys.value.map((monthKey) => {
                const monthProjects = (pastProjectsByMonth.value || {} as Record<string, any>)[monthKey] || []
                const isExpanded = expandedMonths.value.has(monthKey)

                return (
                  <div key={monthKey} class="border border-gray-200 rounded-lg overflow-hidden">
                    {/* 月份标题 */}
                    <button
                      onClick={() => toggleMonth(monthKey)}
                      class="w-full flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseenter={(e) => {
                        (e.target as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.02)'
                      }}
                      onMouseleave={(e) => {
                        (e.target as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0)'
                      }}
                    >
                      <div class="flex items-center space-x-2">
                        <svg
                          class="w-4 h-4 text-gray-500 transition-transform duration-200"
                          style={{
                            transform: `rotate(${isExpanded ? 90 : 0}deg)`
                          }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span class="font-medium text-gray-800">
                          {getMonthDisplayText(monthKey)}
                        </span>
                      </div>
                      <span class="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                        {monthProjects.length}个项目
                      </span>
                    </button>

                    {/* 项目列表 */}
                    <Transition
                      enterActiveClass="transition-all duration-200"
                      leaveActiveClass="transition-all duration-200"
                      enterFromClass="max-h-0 opacity-0"
                      enterToClass="max-h-96 opacity-100"
                      leaveFromClass="max-h-96 opacity-100"
                      leaveToClass="max-h-0 opacity-0"
                    >
                      {isExpanded && (
                        <div class="overflow-hidden">
                          <div class="border-t border-gray-200">
                            {monthProjects.map((project: any, index) => (
                              <button
                                key={project.id}
                                onClick={() => {
                                  props.onProjectSelect(project.id)
                                  props.onMobileItemClick?.() // 通知移动端关闭侧边栏
                                }}
                                class={`w-full flex items-center justify-between p-3 text-left transition-colors border-b border-gray-100 last:border-b-0 ${
                                  props.selectedProjectId === project.id
                                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                    : 'hover:bg-gray-50'
                                }`}
                                style={{
                                  backgroundColor: 'transparent',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseenter={(e) => {
                                  if (props.selectedProjectId !== project.id) {
                                    (e.target as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.05)'
                                  }
                                }}
                                onMouseleave={(e) => {
                                  if (props.selectedProjectId !== project.id) {
                                    (e.target as HTMLElement).style.backgroundColor = 'transparent'
                                  }
                                }}
                              >
                                <div class="flex-1 min-w-0">
                                  <div class="flex items-center space-x-2">
                                    <svg class="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span class="font-medium text-gray-800 truncate">
                                      {project.name}
                                    </span>
                                  </div>
                                  <div class="flex items-center space-x-2 mt-1">
                                    <span class={`text-xs ${getStatusColor(project.status)}`}>
                                      {getStatusText(project.status)}
                                    </span>
                                    {project.assignedWorker && (
                                      <>
                                        <span class="text-xs text-gray-400">•</span>
                                        <span class="text-xs text-gray-500">
                                          {project.assignedWorker.name}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {project.movedToPastAt && (
                                    <div class="text-xs text-gray-400 mt-1">
                                      {formatDateTime(project.movedToPastAt)} 移动到过往
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </Transition>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 底部状态信息 */}
        <div class="p-4 border-t border-gray-200 flex-shrink-0">
          <div class="text-xs text-gray-500 text-center">
            {(pastProjects.value || []).length > 0 ? (
              <span>共 {(pastProjects.value || []).length} 个过往项目</span>
            ) : (
              <span>暂无过往项目</span>
            )}
          </div>
        </div>
      </div>
    )
  }
})