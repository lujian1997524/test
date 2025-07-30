import { defineComponent, type PropType } from 'vue'
import { Card, StatusToggle } from '../ui/index.ts'
import { ArchiveBoxIcon, ArrowUturnLeftIcon } from '@heroicons/vue/24/outline'

interface ThicknessSpec {
  id: number
  thickness: string
  unit: string
  materialType: string
  isActive: boolean
  sortOrder: number
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

interface Project {
  id: number
  name: string
  status: string
  priority: string
  createdAt: string
  startDate?: string
  completedDate?: string
  assignedWorker?: { id: number; name: string }
  materials?: any[]
  drawings?: Drawing[]
}

export const ResponsiveMaterialsTable = defineComponent({
  name: 'ResponsiveMaterialsTable',
  props: {
    projects: {
      type: Array as PropType<Project[]>,
      required: true
    },
    thicknessSpecs: {
      type: Array as PropType<ThicknessSpec[]>,
      required: true
    },
    viewType: {
      type: String as PropType<'active' | 'completed'>,
      default: 'active'
    },
    movingToPast: {
      type: Number as PropType<number | null>,
      default: null
    },
    restoringFromPast: {
      type: Number as PropType<number | null>,
      default: null
    },
    getProjectMaterialStatusForTable: {
      type: Function as PropType<(projectId: number, thicknessSpecId: number) => any>,
      required: true
    },
    updateMaterialStatusInTable: {
      type: Function as PropType<(projectId: number, thicknessSpecId: number, newStatus: any) => Promise<void>>,
      required: true
    },
    handleDrawingHover: {
      type: Function as PropType<(event: MouseEvent, drawings: Drawing[]) => void>,
      required: true
    },
    handleCloseHover: {
      type: Function as PropType<() => void>,
      required: true
    },
    onProjectSelect: {
      type: Function as PropType<(id: number | null) => void>,
      required: true
    },
    handleMoveToPast: {
      type: Function as PropType<(projectId: number) => void>,
      required: true
    },
    handleRestoreFromPast: {
      type: Function as PropType<(projectId: number) => void>,
      required: true
    },
    getStatusText: {
      type: Function as PropType<(status: string) => string>,
      required: true
    },
    getPriorityColorBadge: {
      type: Function as PropType<(priority: string) => string>,
      required: true
    },
    getPriorityText: {
      type: Function as PropType<(priority: string) => string>,
      required: true
    }
  },
  setup(props) {
    const formatDateTime = (dateString: string | undefined) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    return () => (
      <div class="space-y-4 p-4">
        {props.projects.length === 0 ? (
          <div class="text-center py-12">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              {props.viewType === 'completed' ? '暂无过往项目' : '暂无活跃项目'}
            </h3>
            <p class="text-gray-500">
              {props.viewType === 'active' 
                ? '点击右上角"新建"按钮创建项目' 
                : '已完成的项目移动到过往后会显示在这里'
              }
            </p>
          </div>
        ) : (
          props.projects.map((project, index) => (
            <Card
              key={project.id}
              padding="lg"
              class="cursor-pointer hover:shadow-lg transition-all duration-200"
              onClick={() => props.onProjectSelect(project.id)}
            >
              {/* 项目标题 */}
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center space-x-3 flex-1">
                  <div class={`w-3 h-3 rounded-full ${props.getPriorityColorBadge(project.priority)}`}></div>
                  <div class="flex-1">
                    <h3 class="font-semibold text-gray-900 text-lg">{project.name}</h3>
                    <div class="text-sm text-gray-500 flex items-center space-x-2 mt-1">
                      <span>#{index + 1}</span>
                      <span>•</span>
                      <span>{project.assignedWorker?.name || '未分配'}</span>
                      <span>•</span>
                      <span>{props.getStatusText(project.status)}</span>
                      <span>•</span>
                      <span>{props.getPriorityText(project.priority)}优先级</span>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div class="flex items-center space-x-2">
                  {props.viewType === 'active' ? (
                    <button
                      onClick={(e: Event) => {
                        e.stopPropagation()
                        props.handleMoveToPast(project.id)
                      }}
                      disabled={props.movingToPast === project.id}
                      class="p-2 rounded-lg hover:bg-orange-100 hover:text-orange-600 transition-colors disabled:opacity-50"
                      title="移动到过往项目"
                    >
                      {props.movingToPast === project.id ? (
                        <div class="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <ArchiveBoxIcon class="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={(e: Event) => {
                        e.stopPropagation()
                        props.handleRestoreFromPast(project.id)
                      }}
                      disabled={props.restoringFromPast === project.id}
                      class="p-2 rounded-lg hover:bg-green-100 hover:text-green-600 transition-colors disabled:opacity-50"
                      title="恢复到活跃项目"
                    >
                      {props.restoringFromPast === project.id ? (
                        <div class="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <ArrowUturnLeftIcon class="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* 板材厚度状态 */}
              <div class="mb-4">
                <h4 class="text-sm font-medium text-gray-700 mb-3">板材状态</h4>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {props.thicknessSpecs.map(spec => {
                    const materialStatus = props.getProjectMaterialStatusForTable(project.id, spec.id)
                    return (
                      <div key={spec.id} class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span class="text-sm font-medium text-gray-700">
                          {spec.thickness}{spec.unit}
                        </span>
                        <StatusToggle
                          status={materialStatus}
                          onChange={(newStatus) => props.updateMaterialStatusInTable(project.id, spec.id, newStatus)}
                          size="sm"
                          showText={false}
                          disabled={props.viewType === 'completed'}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 时间信息 */}
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <span class="text-gray-500">创建时间:</span>
                  <div class="font-medium text-gray-900">{formatDate(project.createdAt)}</div>
                </div>
                <div>
                  <span class="text-gray-500">开始时间:</span>
                  <div class="font-medium text-gray-900">{formatDateTime(project.startDate)}</div>
                </div>
                <div>
                  <span class="text-gray-500">完成时间:</span>
                  <div class="font-medium text-gray-900">{formatDateTime(project.completedDate)}</div>
                </div>
              </div>

              {/* 图纸信息 */}
              {project.drawings && project.drawings.length > 0 && (
                <div class="border-t border-gray-200 pt-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-500">图纸文件</span>
                    <button
                      onMouseenter={(e) => props.handleDrawingHover(e, project.drawings!)}
                      onMouseleave={props.handleCloseHover}
                      class="inline-flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{project.drawings.length} 个文件</span>
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    )
  }
})

export default ResponsiveMaterialsTable