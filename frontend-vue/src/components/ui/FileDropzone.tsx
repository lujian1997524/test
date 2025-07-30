import { defineComponent, ref, computed, type PropType } from 'vue'
import { Transition } from 'vue'

interface FileDropzoneProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number // 字节
  className?: string
}

export const FileDropzone = defineComponent({
  name: 'FileDropzone',
  props: {
    onFileSelect: {
      type: Function as PropType<(file: File) => void>,
      required: true
    },
    accept: {
      type: String,
      default: '.pdf,.jpg,.jpeg,.png,.dwg,.dxf'
    },
    maxSize: {
      type: Number,
      default: 10 * 1024 * 1024 // 10MB
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const isDragOver = ref(false)
    const isDragActive = ref(false)
    const error = ref('')

    // 验证文件
    const validateFile = (file: File): string | null => {
      // 检查文件大小
      if (file.size > props.maxSize) {
        return `文件大小超过限制（最大 ${Math.round(props.maxSize / 1024 / 1024)}MB）`
      }

      // 检查文件类型
      const allowedExtensions = props.accept.split(',').map(ext => ext.trim().toLowerCase())
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!allowedExtensions.includes(fileExtension)) {
        return `不支持的文件类型。支持的格式：${allowedExtensions.join(', ')}`
      }

      return null
    }

    // 处理文件选择
    const handleFile = (file: File) => {
      error.value = ''
      
      const validationError = validateFile(file)
      if (validationError) {
        error.value = validationError
        return
      }

      props.onFileSelect(file)
    }

    // 拖拽事件处理
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      isDragActive.value = true
      isDragOver.value = true
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      // 只有当拖拽离开整个dropzone区域时才设置为false
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const x = e.clientX
      const y = e.clientY
      
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        isDragActive.value = false
        isDragOver.value = false
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      isDragOver.value = true
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      isDragActive.value = false
      isDragOver.value = false

      const files = Array.from(e.dataTransfer!.files)
      if (files.length > 0) {
        handleFile(files[0]) // 只处理第一个文件
      }
    }

    // 文件输入处理
    const handleFileInput = (e: Event) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        handleFile(files[0])
      }
      // 清空input值，允许重复选择同一文件
      ;(e.target as HTMLInputElement).value = ''
    }

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return () => (
      <div class={`relative ${props.className}`}>
        <div
          class={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-300 ease-in-out
            ${isDragOver.value 
              ? 'border-blue-500 bg-blue-50 scale-105' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
            ${isDragActive.value ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
          `}
          style={{
            transform: isDragOver.value ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.2s ease-out'
          }}
          onDragenter={handleDragEnter}
          onDragleave={handleDragLeave}
          onDragover={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept={props.accept}
            onChange={handleFileInput}
            class="hidden"
          />

          <Transition
            mode="out-in"
            enterActiveClass="transition-all duration-200"
            leaveActiveClass="transition-all duration-200"
            enterFromClass="opacity-0 scale-80"
            enterToClass="opacity-100 scale-100"
            leaveFromClass="opacity-100 scale-100"
            leaveToClass="opacity-0 scale-80"
          >
            {isDragOver.value ? (
              <div key="drag-active" class="text-blue-500">
                <div class="text-6xl mb-4">📤</div>
                <h3 class="text-lg font-semibold mb-2">释放文件以上传</h3>
                <p class="text-sm">支持的格式：PDF, JPG, PNG, DWG, DXF</p>
              </div>
            ) : (
              <div key="drag-inactive" class="text-gray-500">
                <div class="text-6xl mb-4">📁</div>
                <h3 class="text-lg font-semibold text-text-primary mb-2">
                  点击选择文件或拖拽到此处
                </h3>
                <p class="text-sm text-text-secondary mb-2">
                  支持格式：PDF, JPG, PNG, DWG, DXF
                </p>
                <p class="text-xs text-text-tertiary">
                  最大文件大小：{formatFileSize(props.maxSize)}
                </p>
              </div>
            )}
          </Transition>

          {/* 拖拽指示器 */}
          {isDragActive.value && (
            <div class="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-xl flex items-center justify-center">
              <div
                class="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full"
                style={{
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}
              />
            </div>
          )}
        </div>

        {/* 错误提示 */}
        <Transition
          enterActiveClass="transition-all duration-200"
          leaveActiveClass="transition-all duration-200"
          enterFromClass="opacity-0 -translate-y-2"
          enterToClass="opacity-100 translate-y-0"
          leaveFromClass="opacity-100 translate-y-0"
          leaveToClass="opacity-0 -translate-y-2"
        >
          {error.value && (
            <div class="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              ❌ {error.value}
            </div>
          )}
        </Transition>

        <style>{`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
          }
        `}</style>
      </div>
    )
  }
})