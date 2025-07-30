import { defineComponent, ref, type PropType } from 'vue'
import { Transition, TransitionGroup } from 'vue'
import { Modal, Button, Input, Dropdown, FileDropzone, Alert, ProgressBar } from '../ui/index.ts'
import { useAuth } from '../../composables/useAuth.ts'

interface DrawingUploadProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export const DrawingUpload = defineComponent({
  name: 'DrawingUpload',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true
    },
    onSuccess: {
      type: Function as PropType<() => void>,
      required: true
    }
  },
  setup(props) {
    const { token } = useAuth()
    
    const files = ref<UploadFile[]>([])
    const description = ref('')
    const fileType = ref<'DXF'>('DXF') // 只支持DXF
    const tags = ref('')
    const uploading = ref(false)
    const error = ref<string | null>(null)

    // 处理文件选择
    const handleFileSelected = (selectedFile: File) => {
      const newFile: UploadFile = {
        file: selectedFile,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: 'pending'
      }
      
      files.value = [...files.value, newFile]
      error.value = null
    }

    // 移除文件
    const removeFile = (fileId: string) => {
      files.value = files.value.filter(f => f.id !== fileId)
    }

    // 检测文件类型 - 只支持DXF
    const detectFileType = (filename: string): 'DXF' => {
      return 'DXF' // 只支持DXF文件，直接返回
    }

    // 上传单个文件
    const uploadFile = async (uploadFile: UploadFile): Promise<boolean> => {
      const formData = new FormData()
      formData.append('file', uploadFile.file)
      formData.append('description', description.value)
      formData.append('fileType', detectFileType(uploadFile.file.name))
      formData.append('tags', tags.value)

      try {
        // 更新文件状态为上传中
        files.value = files.value.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'uploading' as const } 
            : f
        )

        const response = await fetch('http://110.40.71.83:35001/api/drawings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`
          },
          body: formData
        })

        if (response.ok) {
          // 模拟进度更新
          for (let progress = 0; progress <= 100; progress += 10) {
            files.value = files.value.map(f => 
              f.id === uploadFile.id 
                ? { ...f, progress } 
                : f
            )
            await new Promise(resolve => setTimeout(resolve, 50))
          }

          files.value = files.value.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'success' as const, progress: 100 } 
              : f
          )
          
          return true
        } else {
          const errorData = await response.json()
          throw new Error(errorData.message || '上传失败')
        }
      } catch (err) {
        console.error('文件上传失败:', err)
        files.value = files.value.map(f => 
          f.id === uploadFile.id 
            ? { 
                ...f, 
                status: 'error' as const, 
                error: err instanceof Error ? err.message : '上传失败' 
              } 
            : f
        )
        return false
      }
    }

    // 开始上传
    const handleUpload = async () => {
      if (files.value.length === 0) {
        error.value = '请选择要上传的文件'
        return
      }

      uploading.value = true
      error.value = null

      try {
        // 并发上传所有文件
        const uploadPromises = files.value
          .filter(f => f.status === 'pending')
          .map(file => uploadFile(file))
        
        const results = await Promise.all(uploadPromises)
        const successCount = results.filter(Boolean).length
        
        if (successCount > 0) {
          props.onSuccess()
          
          // 如果全部成功，关闭对话框
          if (successCount === files.value.filter(f => f.status === 'pending').length) {
            setTimeout(() => {
              props.onClose()
              resetForm()
            }, 1000)
          }
        }
      } finally {
        uploading.value = false
      }
    }

    // 重置表单
    const resetForm = () => {
      files.value = []
      description.value = ''
      tags.value = ''
      error.value = null
    }

    // 格式化文件大小
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    // 获取状态图标
    const getStatusIcon = (status: UploadFile['status']) => {
      switch (status) {
        case 'pending':
          return (
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        case 'uploading':
          return (
            <div class="w-5 h-5 text-blue-500 animate-spin">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          )
        case 'success':
          return (
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        case 'error':
          return (
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
      }
    }

    return () => (
      <Modal
        isOpen={props.isOpen}
        onClose={props.onClose}
        title="上传图纸"
        size="lg"
      >
        <div class="space-y-6">
          {/* 文件拖放区域 */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              选择文件
            </label>
            <FileDropzone
              onFileSelect={handleFileSelected}
              accept=".dxf" // 只支持DXF文件
              maxSize={50 * 1024 * 1024} // 50MB
            />
            <p class="text-xs text-gray-500 mt-1">
              仅支持 DXF文件(.dxf)，单个文件最大50MB
            </p>
          </div>

          {/* 文件列表 */}
          {files.value.length > 0 && (
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                待上传文件 ({files.value.length})
              </label>
              <div class="space-y-2 max-h-48 overflow-y-auto">
                <TransitionGroup
                  enterActiveClass="transition-all duration-300"
                  leaveActiveClass="transition-all duration-200"
                  enterFromClass="opacity-0 h-0"
                  enterToClass="opacity-100 h-auto"
                  leaveFromClass="opacity-100 h-auto"
                  leaveToClass="opacity-0 h-0"
                >
                  {files.value.map((uploadFile) => (
                    <div
                      key={uploadFile.id}
                      class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div class="flex items-center gap-3 flex-1 min-w-0">
                        {getStatusIcon(uploadFile.status)}
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium text-gray-900 truncate">
                            {uploadFile.file.name}
                          </div>
                          <div class="text-xs text-gray-500">
                            {formatFileSize(uploadFile.file.size)} • {detectFileType(uploadFile.file.name)}
                          </div>
                          {uploadFile.status === 'uploading' && (
                            <div class="mt-1">
                              <ProgressBar 
                                value={uploadFile.progress} 
                                size="sm"
                                class="w-full"
                              />
                            </div>
                          )}
                          {uploadFile.status === 'error' && uploadFile.error && (
                            <div class="text-xs text-red-600 mt-1">
                              {uploadFile.error}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {uploadFile.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.id)}
                          class="text-red-600 hover:text-red-700"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  ))}
                </TransitionGroup>
              </div>
            </div>
          )}

          {/* 描述信息 */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              描述信息
            </label>
            <Input
              placeholder="输入图纸描述信息..."
              value={description.value}
              onChange={(e) => description.value = e.target.value}
              multiline
              rows={3}
            />
          </div>

          {/* 标签 */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              标签
            </label>
            <Input
              placeholder="输入标签，用逗号分隔..."
              value={tags.value}
              onChange={(e) => tags.value = e.target.value}
            />
            <p class="text-xs text-gray-500 mt-1">
              例如：机械图纸,v2.0,重要
            </p>
          </div>

          {/* 错误提示 */}
          {error.value && (
            <Alert variant="error">
              {error.value}
            </Alert>
          )}

          {/* 按钮组 */}
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={props.onClose}
              disabled={uploading.value}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              loading={uploading.value}
              disabled={files.value.length === 0 || uploading.value}
            >
              {uploading.value ? '上传中...' : `上传 ${files.value.length} 个文件`}
            </Button>
          </div>
        </div>
      </Modal>
    )
  }
})

export default DrawingUpload