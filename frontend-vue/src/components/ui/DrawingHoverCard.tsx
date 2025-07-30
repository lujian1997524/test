import { defineComponent, type PropType } from 'vue'
import { Teleport, Transition } from 'vue'

interface Drawing {
  id: number
  projectId: number
  filename: string
  originalFilename?: string
  filePath: string
  version: string
  createdAt: string
}

interface Position {
  x: number
  y: number
}

export const DrawingHoverCard = defineComponent({
  name: 'DrawingHoverCard',
  props: {
    drawings: {
      type: Array as PropType<Drawing[]>,
      required: true
    },
    isVisible: {
      type: Boolean,
      required: true
    },
    position: {
      type: Object as PropType<Position>,
      required: true
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true
    },
    onOpenDrawing: {
      type: Function as PropType<(drawing: Drawing) => void>,
      required: true
    }
  },
  setup(props) {
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getFileIcon = (filename: string) => {
      const ext = filename.toLowerCase().split('.').pop()
      switch (ext) {
        case 'dxf':
        case 'dwg':
          return (
            <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        case 'pdf':
          return (
            <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
          return (
            <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        default:
          return (
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
      }
    }

    return () => (
      <Teleport to="body">
        <Transition
          enterActiveClass="transition-all duration-200"
          leaveActiveClass="transition-all duration-200"
          enterFromClass="opacity-0 scale-95"
          enterToClass="opacity-100 scale-100"
          leaveFromClass="opacity-100 scale-100"
          leaveToClass="opacity-0 scale-95"
        >
          {props.isVisible && (
            <div
              class="fixed z-50 pointer-events-none"
              style={{
                left: `${props.position.x}px`,
                top: `${props.position.y}px`,
                transform: 'translateY(-50%)'
              }}
            >
              <div class="pointer-events-auto">
                <div class="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-2xl shadow-gray-500/20 p-4 max-w-sm">
                  {/* 标题栏 */}
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold text-gray-900 text-sm">
                      图纸文件 ({props.drawings.length})
                    </h3>
                    <button
                      onClick={props.onClose}
                      class="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* 图纸列表 */}
                  <div class="space-y-2 max-h-64 overflow-y-auto">
                    {props.drawings.map((drawing) => (
                      <div
                        key={drawing.id}
                        onClick={() => props.onOpenDrawing(drawing)}
                        class="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        <div class="flex-shrink-0 mt-0.5">
                          {getFileIcon(drawing.filename)}
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="font-medium text-gray-900 text-xs truncate group-hover:text-blue-600">
                            {drawing.originalFilename || drawing.filename}
                          </div>
                          <div class="text-xs text-gray-500 truncate">
                            版本 {drawing.version}
                          </div>
                          <div class="text-xs text-gray-400">
                            {formatDate(drawing.createdAt)}
                          </div>
                        </div>
                        <div class="flex-shrink-0">
                          <svg class="w-3 h-3 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>

                  {props.drawings.length === 0 && (
                    <div class="text-center py-4">
                      <svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p class="text-xs text-gray-500">暂无图纸文件</p>
                    </div>
                  )}

                  {/* 底部提示 */}
                  {props.drawings.length > 0 && (
                    <div class="mt-3 pt-3 border-t border-gray-100">
                      <p class="text-xs text-gray-400 text-center">
                        点击打开图纸文件
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Transition>
      </Teleport>
    )
  }
})

export default DrawingHoverCard