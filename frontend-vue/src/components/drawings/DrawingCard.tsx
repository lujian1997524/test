import { defineComponent, type PropType } from 'vue'
import { Card, Button, Badge, Tooltip } from '../ui/index.ts'
import type { Drawing } from './DrawingLibrary'
import { cadFileHandler } from '../../utils/cadFileHandler.ts'

interface DrawingCardProps {
  drawing: Drawing
  selected?: boolean
  onSelect?: (selected: boolean) => void
  onDelete?: () => void
  onEdit?: () => void
  onPreview?: () => void
  onOpen?: () => void
  className?: string
}

export const DrawingCard = defineComponent({
  name: 'DrawingCard',
  props: {
    drawing: {
      type: Object as PropType<Drawing>,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    },
    onSelect: {
      type: Function as PropType<(selected: boolean) => void>,
      default: undefined
    },
    onDelete: {
      type: Function as PropType<() => void>,
      default: undefined
    },
    onEdit: {
      type: Function as PropType<() => void>,
      default: undefined
    },
    onPreview: {
      type: Function as PropType<() => void>,
      default: undefined
    },
    onOpen: {
      type: Function as PropType<() => void>,
      default: undefined
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    // 获取文件类型图标 - 只支持DXF
    const getFileTypeIcon = (fileType: string) => {
      // 只支持DXF文件，显示CAD图标
      return (
        <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }

    // 格式化文件大小
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    // 获取状态样式变体
    const getStatusVariant = (status: string) => {
      switch (status) {
        case '可用':
          return 'success'
        case '已废弃':
          return 'danger'
        case '已归档':
          return 'secondary'
        default:
          return 'secondary'
      }
    }

    return () => (
      <div
        class={`${props.className} transition-all duration-200 hover:scale-[1.02] active:scale-98 cursor-pointer`}
        onClick={() => props.onSelect?.(!props.selected)}
      >
        <Card
          padding="md"
          class={`relative transition-all duration-200 ${
            props.selected 
              ? 'ring-2 ring-ios18-blue bg-blue-50' 
              : 'hover:shadow-lg hover:shadow-gray-200/50'
          }`}
        >
          {/* 选择框 */}
          {props.selected && (
            <div class="absolute top-2 right-2 w-5 h-5 bg-ios18-blue text-white rounded-full flex items-center justify-center text-xs">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {/* 文件信息区域 - 移除图标，简化设计 */}
          <div class="space-y-3">
            {/* 文件名 */}
            <Tooltip content={props.drawing.originalName}>
              <h3 class="font-medium text-base text-gray-900 truncate">
                {props.drawing.originalName}
              </h3>
            </Tooltip>

            {/* 版本和状态 */}
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">
                版本 {props.drawing.version}
              </span>
              <Badge
                variant={getStatusVariant(props.drawing.status)}
                size="sm"
              >
                {props.drawing.status}
              </Badge>
            </div>

            {/* 文件信息 */}
            <div class="flex items-center justify-between text-sm text-gray-500">
              <span>DXF 文件</span>
              <span>{formatFileSize(props.drawing.fileSize)}</span>
            </div>

            {/* 项目关联信息 */}
            {props.drawing.project ? (
              <div class="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                关联：{props.drawing.project.name}
              </div>
            ) : props.drawing.projectIds && props.drawing.projectIds.length > 0 ? (
              <div class="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                关联 {props.drawing.projectIds.length} 个项目
              </div>
            ) : (
              <div class="text-sm text-gray-500">
                未关联项目
              </div>
            )}

            {/* 描述（如果有） */}
            {props.drawing.description && (
              <Tooltip content={props.drawing.description}>
                <p class="text-sm text-gray-600 truncate bg-gray-50 px-2 py-1 rounded">
                  {props.drawing.description}
                </p>
              </Tooltip>
            )}

            {/* 时间信息 */}
            <div class="text-xs text-gray-400 pt-2 border-t border-gray-100">
              {new Date(props.drawing.updatedAt).toLocaleDateString('zh-CN')}
            </div>
          </div>

          {/* 操作按钮 - 悬停显示 */}
          <div
            class="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
            onClick={(e) => e.stopPropagation()} // 防止触发卡片选择
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => props.onPreview?.()}
              class="bg-white/90 hover:bg-white"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => props.onOpen?.()}
              class="bg-white/90 hover:bg-white"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => props.onEdit?.()}
              class="bg-white/90 hover:bg-white"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => props.onDelete?.()}
              class="bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </Card>
      </div>
    )
  }
})

export default DrawingCard