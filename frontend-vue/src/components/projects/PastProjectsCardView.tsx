import { defineComponent, ref, computed, onMounted, type PropType } from 'vue'
import { Transition } from 'vue'
import { useAuth } from '../../composables/useAuth.ts'
import { useProjectStore } from '../../stores/index.ts'
import { Loading, Empty, EmptyData } from '../ui/index.ts'
import { PastProjectCard } from './ProjectCard.tsx'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

interface PastProject {
  id: number
  name: string
  status: string
  priority: string
  createdAt?: string
  created_at?: string
  creator?: { id: number; name: string }
  assignedWorker?: { id: number; name: string }
  materials?: any[]
  drawings?: any[]
  isPastProject?: boolean
  movedToPastAt?: string
  pastProjectMover?: { id: number; name: string }
}

interface PastProjectsCardViewProps {
  onProjectSelect: (projectId: number | null) => void
  selectedProjectId: number | null
  onRefresh?: () => void
  className?: string
}

export const PastProjectsCardView = defineComponent({
  name: 'PastProjectsCardView',
  props: {
    onProjectSelect: {
      type: Function as PropType<(projectId: number | null) => void>,
      required: true
    },
    selectedProjectId: {
      type: Number as PropType<number | null>,
      default: null
    },
    onRefresh: {
      type: Function as PropType<() => void>,
      default: undefined
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const expandedMonths = ref<Set<string>>(new Set())
    const { user } = useAuth()
    
    const projectStore = useProjectStore()
    console.log('🎯 PastProjectsCardView: projectStore对象:', projectStore)
    
    // 修复响应式问题 - 使用计算属性代替直接解构
    const storePastProjects = computed(() => projectStore.pastProjects)
    const storePastProjectsByMonth = computed(() => projectStore.pastProjectsByMonth)
    const storeLoading = computed(() => projectStore.loading)
    
    console.log('🎯 PastProjectsCardView: 修复后的响应式引用:')
    console.log('🎯 PastProjectsCardView: pastProjects引用:', storePastProjects)
    console.log('🎯 PastProjectsCardView: loading引用:', storeLoading)

    // 不再在这里单独获取数据 - 依赖PastProjectsTree已获取的数据

    // 切换月份展开状态
    const toggleMonth = (monthKey: string) => {
      const newExpanded = new Set(expandedMonths.value)
      if (newExpanded.has(monthKey)) {
        newExpanded.delete(monthKey)
      } else {
        newExpanded.add(monthKey)
      }
      expandedMonths.value = newExpanded
    }

    // 处理查看项目详情
    const handleViewProject = (projectId: number) => {
      props.onProjectSelect(projectId)
    }

    // 获取月份显示名称
    const getMonthDisplayName = (monthKey: string) => {
      const [year, month] = monthKey.split('-')
      return `${year}年${month}月`
    }

    // 计算统计信息
    const getOverallStats = computed(() => {
      const totalProjects = (storePastProjects.value || []).length
      const totalMaterials = (storePastProjects.value || []).reduce((sum, project) => sum + (project.materials?.length || 0), 0)
      const completedMaterials = (storePastProjects.value || []).reduce((sum, project) => 
        sum + (project.materials?.filter(m => m.status === 'completed').length || 0), 0
      )
      
      return {
        totalProjects,
        totalMaterials,
        completedMaterials,
        completionRate: totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0
      }
    })

    return () => {
      console.log('🎯 PastProjectsCardView: 渲染函数执行')
      console.log('🎯 PastProjectsCardView: loading状态:', storeLoading.value)
      console.log('🎯 PastProjectsCardView: pastProjects数量:', (storePastProjects.value || []).length)
      console.log('🎯 PastProjectsCardView: pastProjectsByMonth:', storePastProjectsByMonth.value)
      console.log('🎯 PastProjectsCardView: pastProjects实际数据:', storePastProjects.value)
      
      if (storeLoading.value) {
        console.log('🎯 PastProjectsCardView: 显示加载状态')
        return (
          <div class="flex items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        )
      }

      if ((storePastProjects.value || []).length === 0) {
        console.log('🎯 PastProjectsCardView: 显示空数据状态')
        return (
          <EmptyData 
            title="暂无过往项目"
            description="还没有已归档的项目"
            class="py-12"
          />
        )
      }

      const stats = getOverallStats.value
      console.log('🎯 PastProjectsCardView: 显示项目数据，统计信息:', stats)
      console.log('🎯 PastProjectsCardView: 月份分组keys:', Object.keys(storePastProjectsByMonth.value || {}))

      return (
        <div class={`h-full flex flex-col p-4 ${props.className}`}>
          {/* 总体统计 */}
          <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-sm border p-6 mb-4 flex-shrink-0">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">过往项目统计</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-gray-900">{stats.totalProjects}</div>
                <div class="text-sm text-gray-500">归档项目</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-blue-600">{stats.totalMaterials}</div>
                <div class="text-sm text-gray-500">板材总数</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-green-600">{stats.completedMaterials}</div>
                <div class="text-sm text-gray-500">已完成</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-purple-600">{stats.completionRate}%</div>
                <div class="text-sm text-gray-500">完成率</div>
              </div>
            </div>
          </div>

          {/* 按月份分组显示 */}
          <div class="flex-1 overflow-y-auto">
            <div class="space-y-4 pb-4">
            {Object.entries(storePastProjectsByMonth.value || {}).map(([monthKey, monthProjects]) => (
              <div key={monthKey} class="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* 月份标题 */}
                <button
                  onClick={() => toggleMonth(monthKey)}
                  class="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div class="flex items-center space-x-3">
                    {expandedMonths.value.has(monthKey) ? (
                      <ChevronDownIcon class="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronRightIcon class="w-5 h-5 text-gray-600" />
                    )}
                    <h3 class="text-lg font-semibold text-gray-900">
                      {getMonthDisplayName(monthKey)}
                    </h3>
                    <span class="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
                      {(monthProjects as any[]).length} 个项目
                    </span>
                  </div>
                </button>

                {/* 月份下的项目卡片 */}
                <Transition
                  enterActiveClass="transition-all duration-300"
                  leaveActiveClass="transition-all duration-300"
                  enterFromClass="opacity-0 max-h-0"
                  enterToClass="opacity-100 max-h-screen"
                  leaveFromClass="opacity-100 max-h-screen"
                  leaveToClass="opacity-0 max-h-0"
                >
                  {expandedMonths.value.has(monthKey) && (
                    <div class="overflow-hidden">
                      <div class="p-6">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {(monthProjects as PastProject[]).map((project) => (
                            <PastProjectCard
                              key={project.id}
                              project={{
                                id: project.id,
                                name: project.name,
                                status: project.status,
                                priority: project.priority,
                                assignedWorker: project.assignedWorker,
                                materials: (project.materials || []) as any,
                                drawings: project.drawings || [],
                                movedToPastAt: project.movedToPastAt,
                                isPastProject: project.isPastProject
                              }}
                              onView={handleViewProject}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Transition>
              </div>
            ))}
            </div>
          </div>

          {/* 如果没有按月分组的数据，显示所有项目 */}
          {(!storePastProjectsByMonth.value || Object.keys(storePastProjectsByMonth.value).length === 0) && (
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(storePastProjects.value || []).map((project) => (
                <PastProjectCard
                  key={project.id}
                  project={{
                    id: project.id,
                    name: project.name,
                    status: project.status,
                    priority: project.priority,
                    assignedWorker: project.assignedWorker,
                    materials: (project.materials || []) as any,
                    drawings: project.drawings || [],
                    movedToPastAt: (project as any).movedToPastAt,
                    isPastProject: (project as any).isPastProject
                  }}
                  onView={handleViewProject}
                />
              ))}
            </div>
          )}
        </div>
      )
    }
  }
})

export default PastProjectsCardView