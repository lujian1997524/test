import { defineComponent, ref, watch, computed, type PropType } from 'vue'
import { Transition } from 'vue'
import { useAuth } from '../../composables/useAuth.ts'
import { XMarkIcon } from '@heroicons/vue/24/outline'

// 仪表盘数据类型定义
interface DashboardStats {
  projects: {
    total: number
    byStatus: {
      pending: number
      in_progress: number
      completed: number
      cancelled?: number
    }
  }
  workers: {
    total: number
    workload: Array<{
      worker: {
        id: number
        name: string
        department?: string
      }
      projectCount: number
    }>
  }
  materials: {
    byStatus: {
      pending: number
      in_progress: number
      completed: number
    }
    thicknessUsage: Array<{
      spec: {
        id: number
        thickness: string
        unit: string
        materialType?: string
      }
      usage: number
    }>
  }
  drawings: {
    total: number
    perProject: Array<{
      project: {
        id: number
        name: string
      }
      count: number
    }>
  }
  completion: Array<{
    id: number
    name: string
    rate: number
  }>
}

interface DashboardModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DashboardModal = defineComponent({
  name: 'DashboardModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true
    }
  },
  setup(props) {
    const { token } = useAuth()
    
    const stats = ref<DashboardStats | null>(null)
    const loading = ref(false)
    const error = ref('')
    const isFullscreen = ref(false)
    const selectedTimeRange = ref<'1d' | '7d' | '30d'>('7d')

    // 获取仪表盘统计数据
    const fetchStats = async () => {
      try {
        loading.value = true
        error.value = ''
        
        const response = await fetch('http://110.40.71.83:35001/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          // API返回结构是 {success: true, stats: {...}}
          stats.value = data.stats
        } else {
          throw new Error('获取统计数据失败')
        }
      } catch (err) {
        console.error('获取仪表盘统计数据失败:', err)
        error.value = err instanceof Error ? err.message : '获取统计数据失败'
      } finally {
        loading.value = false
      }
    }

    // 切换全屏模式
    const toggleFullscreen = () => {
      isFullscreen.value = !isFullscreen.value
    }

    // 获取状态颜色
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return 'text-green-600 bg-green-100'
        case 'in_progress': return 'text-blue-600 bg-blue-100'
        case 'pending': return 'text-orange-600 bg-orange-100'
        case 'cancelled': return 'text-gray-600 bg-gray-100'
        default: return 'text-gray-600 bg-gray-100'
      }
    }

    // 获取状态文本
    const getStatusText = (status: string) => {
      switch (status) {
        case 'completed': return '已完成'
        case 'in_progress': return '进行中'
        case 'pending': return '待处理'
        case 'cancelled': return '已取消'
        default: return status
      }
    }

    // 计算材料完成率
    const calculateMaterialCompletionRate = computed(() => {
      if (!stats.value?.materials.byStatus) return 0
      const { pending, in_progress, completed } = stats.value.materials.byStatus
      const total = (pending || 0) + (in_progress || 0) + (completed || 0)
      return total > 0 ? (completed / total * 100) : 0
    })

    // 监听模态框打开状态
    watch(() => props.isOpen, (newVal) => {
      if (newVal && !stats.value) {
        fetchStats()
      }
    })

    // 常规仪表盘渲染
    const renderNormalDashboard = () => (
      <>
        {/* 标题栏 */}
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 class="text-xl font-bold text-gray-900">生产概览仪表盘</h2>
            <p class="text-sm text-gray-600 mt-1">激光切割生产管理系统数据总览</p>
          </div>
          <div class="flex items-center space-x-2">
            {/* 时间范围选择 */}
            <select
              value={selectedTimeRange.value}
              onChange={(e) => selectedTimeRange.value = e.target.value as '1d' | '7d' | '30d'}
              class="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
              <option value="1d">今日</option>
              <option value="7d">近7天</option>
              <option value="30d">近30天</option>
            </select>

            {/* 全屏按钮 */}
            <button
              onClick={toggleFullscreen}
              class="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span>全屏监控</span>
            </button>

            <button
              onClick={fetchStats}
              disabled={loading.value}
              class="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm disabled:opacity-50"
            >
              {loading.value ? (
                <div class="flex items-center space-x-1">
                  <div class="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>加载中</span>
                </div>
              ) : (
                '🔄 刷新'
              )}
            </button>
            <button
              onClick={props.onClose}
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading.value ? (
            <div class="text-center py-12">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p class="mt-2 text-gray-600">正在加载统计数据...</p>
            </div>
          ) : error.value ? (
            <div class="text-center py-12">
              <div class="text-6xl mb-4">⚠️</div>
              <p class="text-red-600 mb-4">{error.value}</p>
              <button
                onClick={fetchStats}
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                重试
              </button>
            </div>
          ) : stats.value ? (
            <div class="space-y-6">
              {/* 核心数据卡片 */}
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 活跃项目 */}
                <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-600">活跃项目</p>
                      <p class="text-3xl font-bold text-blue-600">{stats.value.projects.byStatus.in_progress || 0}</p>
                      <p class="text-xs text-gray-500 mt-1">进行中的项目</p>
                    </div>
                    <div class="p-3 bg-blue-100 rounded-full">
                      <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 完成率 */}
                <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-600">材料完成率</p>
                      <p class="text-3xl font-bold text-green-600">
                        {Math.round(calculateMaterialCompletionRate.value)}%
                      </p>
                      <p class="text-xs text-gray-500 mt-1">已完成材料占比</p>
                    </div>
                    <div class="p-3 bg-green-100 rounded-full">
                      <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 工人数量 */}
                <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-600">在线工人</p>
                      <p class="text-3xl font-bold text-purple-600">{stats.value.workers.total || 0}</p>
                      <p class="text-xs text-gray-500 mt-1">系统中的工人总数</p>
                    </div>
                    <div class="p-3 bg-purple-100 rounded-full">
                      <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 图纸数量 */}
                <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-600">图纸总数</p>
                      <p class="text-3xl font-bold text-orange-600">{stats.value.drawings.total || 0}</p>
                      <p class="text-xs text-gray-500 mt-1">系统中的图纸文件</p>
                    </div>
                    <div class="p-3 bg-orange-100 rounded-full">
                      <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* 详细数据区域 */}
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 项目状态分布 */}
                <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">项目状态分布</h3>
                  <div class="space-y-4">
                    {Object.entries(stats.value.projects.byStatus).map(([status, count]) => (
                      <div key={status} class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                          <span class={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                            {getStatusText(status)}
                          </span>
                        </div>
                        <div class="text-right">
                          <span class="text-2xl font-bold text-gray-900">{count}</span>
                          <span class="text-sm text-gray-500 ml-1">个</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 工人项目分配 */}
                <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">工人项目分配</h3>
                  <div class="space-y-3">
                    {stats.value.workers.workload.slice(0, 5).map((worker, index) => (
                      <div key={worker.worker.id} class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                            {worker.worker.name.charAt(0)}
                          </div>
                          <div>
                            <span class="font-medium text-gray-900">{worker.worker.name}</span>
                            {worker.worker.department && (
                              <span class="text-xs text-gray-500 ml-2">{worker.worker.department}</span>
                            )}
                          </div>
                        </div>
                        <div class="text-right">
                          <span class="text-lg font-bold text-gray-900">{worker.projectCount}</span>
                          <span class="text-sm text-gray-500 ml-1">个项目</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 材料状态详情 */}
              <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">各厚度板材完成情况</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.value.materials.thicknessUsage.map((thickness, index) => (
                    <div key={thickness.spec.id} class="bg-gray-50 rounded-lg p-4">
                      <div class="text-center mb-3">
                        <span class="text-lg font-bold text-gray-900">
                          {thickness.spec.thickness}{thickness.spec.unit}
                        </span>
                      </div>
                      <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                          <span class="text-gray-600">使用量</span>
                          <span class="font-medium">{thickness.usage}</span>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500">
                          <span>材料类型: {thickness.spec.materialType || '标准'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </>
    )

    // 全屏监控大屏渲染
    const renderFullscreenDashboard = () => (
      <div class="h-full bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white overflow-auto">
        {/* 全屏模式标题栏 */}
        <div class="flex items-center justify-between p-6 border-b border-gray-700">
          <div class="text-center flex-1">
            <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              🏭 激光切割生产监控中心
            </h1>
            <p class="text-gray-400 mt-2">Real-time Production Monitoring Dashboard</p>
          </div>
          <button
            onClick={toggleFullscreen}
            class="text-gray-400 hover:text-white transition-colors p-2"
            title="退出全屏"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        {/* 核心指标区域 */}
        <div class="grid grid-cols-4 gap-6 p-6">
          {/* 今日产量 */}
          <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-center border border-blue-500/30">
            <div class="text-blue-200 text-sm uppercase tracking-wide mb-2">Today Production</div>
            <div class="text-5xl font-bold text-white mb-2">
              {stats.value?.materials.byStatus.completed || 0}
            </div>
            <div class="text-blue-200 text-sm">完成材料数</div>
            <div class="mt-4 w-full bg-blue-700 rounded-full h-2">
              <div 
                class="bg-blue-300 h-2 rounded-full transition-all duration-2000 delay-500"
                style={{ width: '75%' }}
              />
            </div>
          </div>

          {/* 完成率 */}
          <div class="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-6 text-center border border-green-500/30">
            <div class="text-green-200 text-sm uppercase tracking-wide mb-2">Completion Rate</div>
            <div class="text-5xl font-bold text-white mb-2">
              {Math.round(calculateMaterialCompletionRate.value)}%
            </div>
            <div class="text-green-200 text-sm">材料完成率</div>
            <div class="mt-4 flex items-center justify-center">
              <div class="w-16 h-16 rounded-full border-4 border-green-300 border-t-transparent animate-spin"></div>
            </div>
          </div>

          {/* 活跃工人 */}
          <div class="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 text-center border border-purple-500/30">
            <div class="text-purple-200 text-sm uppercase tracking-wide mb-2">Active Workers</div>
            <div class="text-5xl font-bold text-white mb-2">
              {stats.value?.workers.total || 0}
            </div>
            <div class="text-purple-200 text-sm">在线工人</div>
            <div class="mt-4 flex justify-center space-x-1">
              {Array.from({ length: Math.min(stats.value?.workers.total || 0, 8) }).map((_, i) => (
                <div
                  key={i}
                  class="w-2 bg-purple-300 rounded transition-all duration-1000"
                  style={{ 
                    height: `${Math.random() * 16 + 16}px`,
                    transitionDelay: `${i * 100}ms`
                  }}
                />
              ))}
            </div>
          </div>

          {/* 异常警报 */}
          <div class="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6 text-center border border-orange-500/30">
            <div class="text-orange-200 text-sm uppercase tracking-wide mb-2">System Status</div>
            <div class="text-5xl font-bold text-white mb-2">0</div>
            <div class="text-orange-200 text-sm">异常警报</div>
            <div class="mt-4 w-8 h-8 mx-auto bg-green-400 rounded-full animate-pulse" />
          </div>
        </div>

        {/* 详细数据区域 */}
        <div class="grid grid-cols-2 gap-6 p-6">
          {/* 工人效率实时排行 */}
          <div class="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <h3 class="text-2xl font-bold text-white mb-6 text-center">工人项目分配排行</h3>
            <div class="space-y-4">
              {stats.value?.workers.workload.slice(0, 6).map((worker, index) => (
                <div
                  key={worker.worker.id}
                  class="flex items-center justify-between bg-gray-700/50 rounded-lg p-4"
                >
                  <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div class="text-white font-semibold">{worker.worker.name}</div>
                      <div class="text-gray-400 text-sm">{worker.worker.department || '生产部'}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-bold text-white">{worker.projectCount}</div>
                    <div class="text-gray-400 text-sm">项目</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 材料完成情况分布 */}
          <div class="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <h3 class="text-2xl font-bold text-white mb-6 text-center">材料厚度完成分布</h3>
            <div class="grid grid-cols-2 gap-4">
              {stats.value?.materials.thicknessUsage.slice(0, 4).map((thickness, index) => {
                const maxUsage = Math.max(...(stats.value?.materials.thicknessUsage.map(t => t.usage) || [1]))
                const usageRate = maxUsage > 0 ? (thickness.usage / maxUsage * 100) : 0
                return (
                  <div
                    key={thickness.spec.id}
                    class="bg-gray-700/50 rounded-xl p-4 text-center"
                  >
                    <div class="text-xl font-bold text-white mb-2">
                      {thickness.spec.thickness}{thickness.spec.unit}
                    </div>
                    <div class="text-3xl font-bold text-blue-400 mb-2">
                      {thickness.usage}
                    </div>
                    <div class="w-full bg-gray-600 rounded-full h-3 mb-2">
                      <div 
                        class="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1500"
                        style={{ 
                          width: `${usageRate}%`,
                          transitionDelay: `${800 + index * 100}ms`
                        }}
                      />
                    </div>
                    <div class="text-gray-400 text-sm">
                      使用量
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 底部实时信息滚动 */}
        <div class="bg-gray-800/70 backdrop-blur-sm border-t border-gray-700 p-4">
          <div class="flex items-center space-x-8 text-gray-300">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>系统运行正常</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>数据实时更新中</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span>最后更新: {new Date().toLocaleTimeString('zh-CN')}</span>
            </div>
          </div>
        </div>
      </div>
    )

    return () => (
      <Transition
        enterActiveClass="transition-opacity duration-200"
        leaveActiveClass="transition-opacity duration-200"
        enterFromClass="opacity-0"
        enterToClass="opacity-100"
        leaveFromClass="opacity-100"
        leaveToClass="opacity-0"
      >
        {props.isOpen && (
          <div
            class={`fixed inset-0 z-50 flex items-center justify-center ${
              isFullscreen.value 
                ? 'bg-gray-900' 
                : 'bg-black/50 backdrop-blur-sm p-4'
            }`}
            onClick={isFullscreen.value ? undefined : props.onClose}
          >
            <div
              class={`overflow-hidden ${
                isFullscreen.value 
                  ? 'h-full w-full' 
                  : 'bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-6xl max-h-[90vh]'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {isFullscreen.value ? renderFullscreenDashboard() : renderNormalDashboard()}
            </div>
          </div>
        )}
      </Transition>
    )
  }
})

export default DashboardModal