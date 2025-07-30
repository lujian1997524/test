import { defineComponent, type PropType } from 'vue'
import { TableRow, TableCell, StatusToggle, Button } from '../ui/index.ts'
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

export const SortableProjectRow = defineComponent({
  name: 'SortableProjectRow',
  props: {
    project: {
      type: Object as PropType<Project>,
      required: true
    },
    index: {
      type: Number,
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
      <TableRow
        key={props.project.id}
        sortableId={props.project.id}
        class="hover:bg-gray-50/50 transition-colors"
        onClick={() => props.onProjectSelect(props.project.id)}
      >
        {/* 序号 */}
        <TableCell class="text-center text-sm font-medium text-gray-600">
          {props.index + 1}
        </TableCell>

        {/* 项目名 */}
        <TableCell class="min-w-[200px]">
          <div class="flex items-center space-x-3">
            <div class={`w-2 h-2 rounded-full ${props.getPriorityColorBadge(props.project.priority)}`}></div>
            <div>
              <div class="font-medium text-gray-900">{props.project.name}</div>
              <div class="text-xs text-gray-500 flex items-center space-x-2">
                <span>{props.project.assignedWorker?.name || '未分配'}</span>
                <span>•</span>
                <span>{props.getStatusText(props.project.status)}</span>
                <span>•</span>
                <span class="text-xs">{props.getPriorityText(props.project.priority)}优先级</span>
              </div>
            </div>
          </div>
        </TableCell>

        {/* 厚度列 */}
        {props.thicknessSpecs.map(spec => {
          const materialStatus = props.getProjectMaterialStatusForTable(props.project.id, spec.id)
          return (
            <TableCell key={spec.id} align="center" class="px-2">
              <StatusToggle
                status={materialStatus}
                onChange={(newStatus) => props.updateMaterialStatusInTable(props.project.id, spec.id, newStatus)}
                size="sm"
                showText={false}
                disabled={props.viewType === 'completed'}
              />
            </TableCell>
          )
        })}

        {/* 创建时间 */}
        <TableCell class="text-sm text-gray-600 min-w-[100px]">
          {formatDate(props.project.createdAt)}
        </TableCell>

        {/* 开始时间 */}
        <TableCell class="text-sm text-gray-600 min-w-[100px]">
          {formatDateTime(props.project.startDate)}
        </TableCell>

        {/* 完成时间 */}
        <TableCell class="text-sm text-gray-600 min-w-[100px]">
          {formatDateTime(props.project.completedDate)}
        </TableCell>

        {/* 图纸 */}
        <TableCell align="center" class="px-2">
          {props.project.drawings && props.project.drawings.length > 0 ? (
            <button
              onMouseenter={(e) => props.handleDrawingHover(e, props.project.drawings!)}
              onMouseleave={props.handleCloseHover}
              class="inline-flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{props.project.drawings.length}</span>
            </button>
          ) : (
            <span class="text-xs text-gray-400">无</span>
          )}
        </TableCell>

        {/* 操作 */}
        <TableCell align="center" class="px-2">
          <div class="flex items-center justify-center space-x-1">
            {props.viewType === 'active' ? (
              <Button
                onClick={(e: Event) => {
                  e.stopPropagation()
                  props.handleMoveToPast(props.project.id)
                }}
                variant="ghost"
                size="sm"
                disabled={props.movingToPast === props.project.id}
                class="p-1 w-8 h-8 hover:bg-orange-100 hover:text-orange-600"
                title="移动到过往项目"
              >
                {props.movingToPast === props.project.id ? (
                  <div class="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ArchiveBoxIcon class="w-3 h-3" />
                )}
              </Button>
            ) : (
              <Button
                onClick={(e: Event) => {
                  e.stopPropagation()
                  props.handleRestoreFromPast(props.project.id)
                }}
                variant="ghost"
                size="sm"
                disabled={props.restoringFromPast === props.project.id}
                class="p-1 w-8 h-8 hover:bg-green-100 hover:text-green-600"
                title="恢复到活跃项目"
              >
                {props.restoringFromPast === props.project.id ? (
                  <div class="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ArrowUturnLeftIcon class="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    )
  }
})

export default SortableProjectRow