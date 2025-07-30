import { defineComponent, type PropType } from 'vue'
import { Button } from '../ui/index.ts'
import type { StatusType } from '../ui/index.ts'
import { 
  EyeIcon, 
  PencilIcon, 
  ChevronDownIcon,
  ChevronRightIcon,
  ArchiveBoxIcon
} from '@heroicons/vue/24/outline'

// 类型定义
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

interface ProjectCardData {
  id: number
  name: string
  status: string
  priority: string
  assignedWorker?: { id: number; name: string }
  materials: Material[]
  drawings?: any[]
  createdAt?: string
  movedToPastAt?: string
  isPastProject?: boolean
  description?: string // 项目描述/备注
}

// 状态配置
const statusConfig = {
  pending: { label: '待处理', color: 'bg-gray-200', textColor: 'text-gray-600' },
  in_progress: { label: '进行中', color: 'bg-blue-200', textColor: 'text-blue-600' },
  completed: { label: '已完成', color: 'bg-green-200', textColor: 'text-green-600' },
  cancelled: { label: '已取消', color: 'bg-red-200', textColor: 'text-red-600' }
}

// 优先级配置
const priorityConfig = {
  low: { label: '低', color: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300' },
  medium: { label: '中', color: 'bg-yellow-100', textColor: 'text-yellow-700', borderColor: 'border-yellow-300' },
  high: { label: '高', color: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-300' },
  urgent: { label: '紧急', color: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300' }
}

// 活跃项目卡片
interface ActiveProjectCardProps {
  project: ProjectCardData
  onEdit?: (projectId: number) => void
  onMaterialStatusChange?: (materialId: number, newStatus: StatusType) => void
  onMoveToPast?: (projectId: number) => void
  movingToPast?: boolean
}

export const ActiveProjectCard = defineComponent({
  name: 'ActiveProjectCard',
  props: {
    project: {
      type: Object as PropType<ProjectCardData>,
      required: true
    },
    onEdit: Function as PropType<(projectId: number) => void>,
    onMaterialStatusChange: Function as PropType<(materialId: number, newStatus: StatusType) => void>,
    onMoveToPast: Function as PropType<(projectId: number) => void>,
    movingToPast: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const getCompletionStats = () => {
      const completed = props.project.materials.filter(m => m.status === 'completed').length
      return `${completed}/${props.project.materials.length}`
    }

    // 将材料按厚度排序
    const getSortedMaterials = () => {
      return [...props.project.materials].sort((a, b) => 
        parseFloat(a.thicknessSpec.thickness) - parseFloat(b.thicknessSpec.thickness)
      )
    }

    // 状态切换逻辑：pending → in_progress → completed → pending (移除empty状态)
    const getNextStatus = (currentStatus: string): StatusType => {
      switch (currentStatus) {
        case 'pending': return 'in_progress'
        case 'in_progress': return 'completed'
        case 'completed': return 'pending'
        default: return 'pending'
      }
    }

    // 格式化日期显示
    const formatDate = (dateString?: string) => {
      if (!dateString) return '未设置'
      return new Date(dateString).toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit'
      })
    }

    // 获取项目的时间范围信息
    const getProjectTimeInfo = () => {
      const materialStartDates = props.project.materials
        .map(m => m.startDate)
        .filter(Boolean)
        .sort()
      const materialCompletedDates = props.project.materials
        .map(m => m.completedDate)
        .filter(Boolean)
        .sort()

      const actualStartDate = materialStartDates[0] // 最早的材料开始时间
      const actualCompletedDate = materialCompletedDates[materialCompletedDates.length - 1] // 最晚的材料完成时间

      return {
        actualStartDate,
        actualCompletedDate
      }
    }

    return () => {
      const sortedMaterials = getSortedMaterials()
      const timeInfo = getProjectTimeInfo()

      return (
        <div
          class="relative border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          style={{
            transform: 'scale(1)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseenter={(e) => {
            (e.target as HTMLElement).style.transform = 'scale(1.02)'
          }}
          onMouseleave={(e) => {
            (e.target as HTMLElement).style.transform = 'scale(1)'
          }}
        >
          {/* 项目头部 */}
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h4 
                  class="font-semibold text-base truncate cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => props.onEdit?.(props.project.id)}
                >
                  {props.project.name}
                </h4>
                <div class="flex items-center space-x-1">
                  <span class="text-xs text-gray-400">
                    {formatDate(props.project.createdAt)}
                  </span>
                  {/* 编辑按钮 */}
                  {props.onEdit && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-1"
                      onClick={() => props.onEdit!(props.project.id)}
                    >
                      <PencilIcon class="w-3 h-3" />
                    </Button>
                  )}
                  
                  {/* 移至过往按钮 - 只在项目已完成时显示 */}
                  {props.project.status === 'completed' && props.onMoveToPast && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      onClick={() => props.onMoveToPast!(props.project.id)}
                      disabled={props.movingToPast}
                    >
                      <ArchiveBoxIcon class="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div class="flex items-center justify-between text-sm text-gray-600">
                <div class="flex items-center space-x-2">
                  <span>{props.project.assignedWorker?.name || '未分配'}</span>
                  {/* 项目状态标签 */}
                  <span class={`px-2 py-0.5 rounded text-xs ${statusConfig[props.project.status as keyof typeof statusConfig]?.color || statusConfig.pending.color} ${statusConfig[props.project.status as keyof typeof statusConfig]?.textColor || statusConfig.pending.textColor}`}>
                    {statusConfig[props.project.status as keyof typeof statusConfig]?.label || props.project.status}
                  </span>
                </div>
                {/* 优先级标签 - 靠右对齐 */}
                <span class={`px-2 py-0.5 rounded text-xs border flex-shrink-0 ${priorityConfig[props.project.priority as keyof typeof priorityConfig]?.color || priorityConfig.medium.color} ${priorityConfig[props.project.priority as keyof typeof priorityConfig]?.textColor || priorityConfig.medium.textColor} ${priorityConfig[props.project.priority as keyof typeof priorityConfig]?.borderColor || priorityConfig.medium.borderColor}`}>
                  {priorityConfig[props.project.priority as keyof typeof priorityConfig]?.label || props.project.priority}
                </span>
              </div>
            </div>
          </div>

          {/* 项目描述/备注 - 如果有的话 */}
          {(props.project as any).description && (
            <div class="text-xs text-gray-600 mb-3 bg-gray-50 rounded p-2">
              <span class="font-medium">备注：</span>
              {(props.project as any).description}
            </div>
          )}
          
          {/* 厚度网格 - 可点击切换状态，完全匹配演示页面 */}
          <div class="grid grid-cols-5 gap-1 flex-1">
            {sortedMaterials.map((material) => (
              <div key={material.id} class="text-center">
                <button 
                  class={`w-full py-1.5 rounded text-xs font-medium ${statusConfig[material.status as keyof typeof statusConfig]?.color || statusConfig.pending.color} ${statusConfig[material.status as keyof typeof statusConfig]?.textColor || statusConfig.pending.textColor} hover:opacity-80 transition-all hover:scale-105 border border-transparent hover:border-gray-300`}
                  onClick={() => {
                    const nextStatus = getNextStatus(material.status)
                    props.onMaterialStatusChange?.(material.id, nextStatus)
                  }}
                  title={`${material.thicknessSpec.thickness}${material.thicknessSpec.unit}${material.notes ? `\n备注: ${material.notes}` : ''}${material.startDate ? `\n开始: ${formatDate(material.startDate)}` : ''}${material.completedDate ? `\n完成: ${formatDate(material.completedDate)}` : ''}`}
                >
                  {material.thicknessSpec.thickness}
                </button>
              </div>
            ))}
          </div>
          
          {/* 时间信息和进度统计 - 固定在底部 */}
          <div class="mt-3 pt-2 border-t border-gray-100 space-y-1">
            {/* 时间信息 */}
            <div class="flex justify-between text-xs text-gray-500">
              <span>开始: {formatDate(timeInfo.actualStartDate)}</span>
              <span>完成: {formatDate(timeInfo.actualCompletedDate)}</span>
            </div>
            {/* 进度统计 */}
            <div class="text-xs text-gray-500 text-center font-medium">
              {getCompletionStats()} 已完成
            </div>
          </div>
        </div>
      )
    }
  }
})

// 过往项目卡片
interface PastProjectCardProps {
  project: ProjectCardData
  onView?: (projectId: number) => void
}

export const PastProjectCard = defineComponent({
  name: 'PastProjectCard',
  props: {
    project: {
      type: Object as PropType<ProjectCardData>,
      required: true
    },
    onView: Function as PropType<(projectId: number) => void>
  },
  setup(props) {
    // 将材料按厚度排序
    const getSortedMaterials = () => {
      return [...props.project.materials].sort((a, b) => 
        parseFloat(a.thicknessSpec.thickness) - parseFloat(b.thicknessSpec.thickness)
      )
    }

    const getProjectStats = () => {
      const completed = props.project.materials.filter(m => m.status === 'completed').length
      return {
        totalMaterials: props.project.materials.length,
        completedMaterials: completed,
        completionRate: Math.round((completed / props.project.materials.length) * 100)
      }
    }

    return () => {
      const sortedMaterials = getSortedMaterials()
      const stats = getProjectStats()

      return (
        <div
          class="border rounded-lg p-5 bg-gradient-to-br from-green-50 to-white shadow-sm"
          style={{
            transform: 'scale(1)',
            transition: 'transform 0.2s'
          }}
          onMouseenter={(e) => {
            (e.target as HTMLElement).style.transform = 'scale(1.01)'
          }}
          onMouseleave={(e) => {
            (e.target as HTMLElement).style.transform = 'scale(1)'
          }}
        >
          {/* 项目头部 */}
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h4 
                class="font-semibold text-lg text-green-800 cursor-pointer hover:text-green-600 transition-colors"
                onClick={() => props.onView?.(props.project.id)}
              >
                {props.project.name}
              </h4>
              <div class="text-sm text-gray-600 space-y-1">
                <div>负责工人：{props.project.assignedWorker?.name || '未分配'}</div>
                <div>完成时间：{props.project.movedToPastAt ? new Date(props.project.movedToPastAt).toLocaleDateString('zh-CN') : '未知'}</div>
                <div class="flex items-center space-x-2">
                  <span class="px-2 py-1 rounded text-xs bg-green-100 text-green-700">已归档</span>
                  {/* 优先级标签 */}
                  <span class={`px-2 py-0.5 rounded text-xs border ${priorityConfig[props.project.priority as keyof typeof priorityConfig]?.color || priorityConfig.medium.color} ${priorityConfig[props.project.priority as keyof typeof priorityConfig]?.textColor || priorityConfig.medium.textColor} ${priorityConfig[props.project.priority as keyof typeof priorityConfig]?.borderColor || priorityConfig.medium.borderColor}`}>
                    {priorityConfig[props.project.priority as keyof typeof priorityConfig]?.label || props.project.priority}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex space-x-1">
              {props.onView && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => props.onView!(props.project.id)}
                >
                  <EyeIcon class="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* 厚度网格 - 只读展示 */}
          <div class="mb-4">
            <div class="text-sm font-medium text-gray-700 mb-2">使用板材规格：</div>
            <div class="grid grid-cols-6 gap-2">
              {sortedMaterials.map((material) => (
                <div key={material.id} class="text-center">
                  <div class={`py-2 rounded text-xs border ${
                    material.status === 'completed' 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {material.thicknessSpec.thickness}mm
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 项目统计 */}
          <div class="bg-white/60 rounded p-3">
            <div class="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div class="font-semibold text-gray-800">{stats.totalMaterials}</div>
                <div class="text-gray-500">板材种类</div>
              </div>
              <div>
                <div class="font-semibold text-green-600">{stats.completedMaterials}</div>
                <div class="text-gray-500">已完成</div>
              </div>
              <div>
                <div class="font-semibold text-blue-600">{stats.completionRate}%</div>
                <div class="text-gray-500">完成率</div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }
})

// 项目详情卡片（用于单个项目展示）
interface ProjectDetailCardProps {
  project: ProjectCardData
  onEdit?: () => void
  onManageDrawings?: () => void
  onMaterialStatusChange?: (materialId: number, newStatus: StatusType) => void
}

export const ProjectDetailCard = defineComponent({
  name: 'ProjectDetailCard',
  props: {
    project: {
      type: Object as PropType<ProjectCardData>,
      required: true
    },
    onEdit: Function as PropType<() => void>,
    onManageDrawings: Function as PropType<() => void>,
    onMaterialStatusChange: Function as PropType<(materialId: number, newStatus: StatusType) => void>
  },
  setup(props) {
    // 将材料按厚度排序
    const getSortedMaterials = () => {
      return [...props.project.materials].sort((a, b) => 
        parseFloat(a.thicknessSpec.thickness) - parseFloat(b.thicknessSpec.thickness)
      )
    }

    const getCompletionRate = () => {
      const completed = props.project.materials.filter(m => m.status === 'completed').length
      return (completed / props.project.materials.length) * 100
    }

    // 状态切换逻辑：pending → in_progress → completed → pending
    const getNextStatus = (currentStatus: string): StatusType => {
      switch (currentStatus) {
        case 'pending': return 'in_progress'
        case 'in_progress': return 'completed'
        case 'completed': return 'pending'
        default: return 'pending'
      }
    }

    // 格式化日期显示
    const formatDate = (dateString?: string) => {
      if (!dateString) return '未设置'
      return new Date(dateString).toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit'
      })
    }

    return () => {
      const sortedMaterials = getSortedMaterials()

      return (
        <div class="w-full space-y-6">
          {/* 项目基本信息卡片 */}
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="mb-4">
              <div>
                <h2 class="text-2xl font-bold text-gray-900">{props.project.name}</h2>
                <div class="flex items-center space-x-4 mt-2 text-gray-600">
                  <span>负责工人：{props.project.assignedWorker?.name || '未分配'}</span>
                  <span class={`px-3 py-1 rounded ${statusConfig[props.project.status as keyof typeof statusConfig]?.color || statusConfig.pending.color} ${statusConfig[props.project.status as keyof typeof statusConfig]?.textColor || statusConfig.pending.textColor}`}>
                    {statusConfig[props.project.status as keyof typeof statusConfig]?.label || props.project.status}
                  </span>
                  {/* 优先级标签 */}
                  <span class={`px-2 py-0.5 rounded text-xs border ${priorityConfig[props.project.priority as keyof typeof priorityConfig]?.color || priorityConfig.medium.color} ${priorityConfig[props.project.priority as keyof typeof priorityConfig]?.textColor || priorityConfig.medium.textColor} ${priorityConfig[props.project.priority as keyof typeof priorityConfig]?.borderColor || priorityConfig.medium.borderColor}`}>
                    {priorityConfig[props.project.priority as keyof typeof priorityConfig]?.label || props.project.priority}
                  </span>
                  <span>创建时间：{props.project.createdAt ? new Date(props.project.createdAt).toLocaleDateString('zh-CN') : '未知'}</span>
                </div>
              </div>
            </div>
            
            {/* 进度概览 */}
            <div class="bg-gray-50 rounded p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium">整体进度</span>
                <span class="text-sm text-gray-600">
                  {props.project.materials.filter(m => m.status === 'completed').length}/{props.project.materials.length} 已完成
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${getCompletionRate()}%` }}
                />
              </div>
            </div>
          </div>

          {/* 板材详情网格 */}
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <h3 class="text-lg font-semibold mb-4">板材加工详情</h3>
            <div class="grid gap-3 w-full" style={{ gridTemplateColumns: `repeat(${sortedMaterials.length}, 1fr)` }}>
              {sortedMaterials.map((material) => {
                return (
                  <div key={material.id} class="text-center">
                    <button 
                      class={`w-full py-1.5 rounded text-xs font-medium ${statusConfig[material.status as keyof typeof statusConfig]?.color || statusConfig.pending.color} ${statusConfig[material.status as keyof typeof statusConfig]?.textColor || statusConfig.pending.textColor} hover:opacity-80 transition-all hover:scale-105 border border-transparent hover:border-gray-300`}
                      onClick={() => {
                        const nextStatus = getNextStatus(material.status)
                        props.onMaterialStatusChange?.(material.id, nextStatus)
                      }}
                      title={`${material.thicknessSpec.thickness}${material.thicknessSpec.unit}${material.notes ? `\n备注: ${material.notes}` : ''}${material.startDate ? `\n开始: ${formatDate(material.startDate)}` : ''}${material.completedDate ? `\n完成: ${formatDate(material.completedDate)}` : ''}`}
                    >
                      {material.thicknessSpec.thickness}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }
  }
})