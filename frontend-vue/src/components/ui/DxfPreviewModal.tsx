import { defineComponent, ref, watch, onMounted, onUnmounted, nextTick, type PropType } from 'vue'
import { Transition, Teleport } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useAuth } from '../../composables/useAuth.ts'

interface Drawing {
  id: number
  projectId: number
  filename: string
  originalFilename?: string
  filePath: string
  version: string
  createdAt: string
  uploader?: { id: number; name: string }
}

interface DxfPreviewModalProps {
  drawing: Drawing | null
  isOpen: boolean
  onClose: () => void
}

export const DxfPreviewModal = defineComponent({
  name: 'DxfPreviewModal',
  props: {
    drawing: {
      type: Object as PropType<Drawing | null>,
      default: null
    },
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
    
    const loading = ref(true)
    const error = ref<string | null>(null)
    const viewerInstance = ref<any>(null)
    const mounted = ref(false)
    const containerRef = ref<HTMLDivElement | null>(null)
    const initRef = ref(false)

    // 键盘事件监听
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && props.isOpen) {
        props.onClose()
      }
    }

    // DXF加载逻辑
    const loadDxfViewer = async () => {
      try {
        loading.value = true
        error.value = null

        console.log('🎯 开始加载DXF预览', { 
          drawingId: props.drawing?.id,
          hasToken: !!token.value,
          containerExists: !!containerRef.value
        })

        // 检查容器是否存在
        if (!containerRef.value) {
          console.log('⚠️ 容器不存在，等待DOM准备')
          // 再次尝试等待
          await new Promise(resolve => setTimeout(resolve, 200))
          if (!containerRef.value) {
            throw new Error('预览容器初始化失败')
          }
        }

        // 动态导入dxf-viewer
        const { DxfViewer } = await import('dxf-viewer')
        
        // 清理容器
        containerRef.value.innerHTML = ''

        // 创建查看器
        console.log('🔧 创建DXF查看器...')
        const viewer = new DxfViewer(containerRef.value, {
          autoResize: true,
          colorCorrection: true
          // 移除不支持的canvasOptions
        })

        viewerInstance.value = viewer
        console.log('✅ DXF查看器创建成功')

        // 获取DXF内容
        console.log('📡 获取DXF内容，图纸ID:', props.drawing?.id)
        const response = await fetch(`http://110.40.71.83:35001/api/drawings/${props.drawing?.id}/content`, {
          headers: {
            'Authorization': `Bearer ${token.value}`,
          },
        })

        console.log('📡 API响应状态:', response.status)

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('认证失败，请重新登录')
          }
          throw new Error(`获取图纸内容失败: ${response.status}`)
        }

        const dxfContent = await response.text()
        console.log('📄 DXF内容获取成功，长度:', dxfContent.length)

        // 加载到查看器
        console.log('🎨 加载DXF到查看器...')
        await viewer.Load({
          url: `data:application/dxf;charset=utf-8,${encodeURIComponent(dxfContent)}`,
          // 使用简化的字体配置 - 只使用URL数组格式
          fonts: [
            '/fonts/NotoSansSC-Thin.ttf'
          ],
          progressCbk: (phase: string, receivedBytes: number, totalBytes: number) => {
            console.log(`📊 加载进度: ${phase} - ${receivedBytes}/${totalBytes}`)
          },
          workerFactory: undefined
        } as any)

        console.log('✅ DXF加载完成')
        loading.value = false

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '加载DXF失败'
        console.error('❌ DXF加载失败:', errorMessage, err)
        error.value = errorMessage
        loading.value = false
      }
    }

    const cleanupViewer = () => {
      if (viewerInstance.value && viewerInstance.value.Dispose) {
        try {
          viewerInstance.value.Dispose()
          viewerInstance.value = null
          console.log('🧹 DXF查看器已清理')
        } catch (error) {
          console.error('清理查看器失败:', error)
        }
      }
    }

    const handleClose = () => {
      cleanupViewer()
      props.onClose()
    }

    // 生命周期
    onMounted(() => {
      mounted.value = true
    })

    onUnmounted(() => {
      mounted.value = false
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
      cleanupViewer()
    })

    // 监听属性变化
    watch(() => props.isOpen, (newVal) => {
      if (newVal && mounted.value) {
        document.addEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'hidden'
      } else {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'unset'
      }
    })

    // DXF加载逻辑监听
    watch([() => props.isOpen, () => props.drawing, mounted, token], ([isOpen, drawing, isMounted, tokenValue]) => {
      // 重置初始化标记
      initRef.value = false
      
      if (!isOpen || !drawing || !isMounted || !tokenValue) {
        loading.value = true
        error.value = null
        return
      }

      // 延迟加载，确保DOM完全准备就绪
      const timer = setTimeout(() => {
        if (!initRef.value) {
          initRef.value = true
          loadDxfViewer()
        }
      }, 100)

      return () => {
        clearTimeout(timer)
        cleanupViewer()
      }
    })

    return () => {
      if (!mounted.value || !props.drawing) return null

      const fileName = props.drawing.originalFilename || props.drawing.filename

      return (
        <Teleport to="body">
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
                class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleClose}
              >
                <div
                  class="bg-white rounded-xl shadow-2xl w-full h-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col transition-all duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 标题栏 */}
                  <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                    <div class="flex items-center space-x-3">
                      <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 class="text-lg font-semibold text-gray-900">{fileName}</h2>
                        <p class="text-xs text-gray-500">
                          版本 {props.drawing.version} • {props.drawing.uploader?.name || '未知'} • {new Date(props.drawing.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      class="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                      title="关闭预览 (ESC)"
                    >
                      <XMarkIcon class="w-6 h-6 text-gray-500 group-hover:text-gray-700" />
                    </button>
                  </div>

                  {/* 预览内容 */}
                  <div class="flex-1 relative overflow-hidden bg-gray-50">
                    {loading.value && (
                      <div class="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div class="flex flex-col items-center space-y-4">
                          <div class="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-500"></div>
                          <span class="text-lg text-gray-600">加载图纸预览中...</span>
                          <span class="text-sm text-gray-400">专业图纸查看</span>
                        </div>
                      </div>
                    )}

                    {error.value && (
                      <div class="absolute inset-0 flex items-center justify-center bg-red-50">
                        <div class="text-center">
                          <div class="text-red-500 mb-4">
                            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <p class="text-lg text-red-600 mb-4">{error.value}</p>
                          <button
                            onClick={() => {
                              error.value = null
                              if (!initRef.value) {
                                initRef.value = true
                                loadDxfViewer()
                              }
                            }}
                            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            重试
                          </button>
                        </div>
                      </div>
                    )}

                    <div 
                      ref={containerRef} 
                      class="w-full h-full dxf-viewer-container"
                      style={{ background: '#ffffff' }}
                    />
                  </div>

                  {/* 底部操作栏 */}
                  <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-4">
                        <div class="text-sm font-medium text-gray-700">
                          专业图纸预览
                        </div>
                      </div>
                      <div class="flex space-x-3">
                        <button
                          onClick={() => window.open(`/api/drawings/${props.drawing!.id}/download`, '_blank')}
                          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>下载文件</span>
                        </button>
                        <button
                          onClick={handleClose}
                          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          关闭预览
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Transition>
        </Teleport>
      )
    }
  }
})

export default DxfPreviewModal