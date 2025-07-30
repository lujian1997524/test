import { defineComponent, ref, onMounted, onUnmounted, watch, type PropType } from 'vue'
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

interface CADPreviewProps {
  filePath?: string
  drawingId?: number
  drawing?: Drawing // 直接传递完整的图纸信息
  width?: number
  height?: number
  className?: string
  onError?: (error: string) => void
  onLoad?: () => void
  enableInteraction?: boolean // 是否启用交互功能（缩放、平移）
  showToolbar?: boolean // 是否显示工具栏
}

export const CADPreview = defineComponent({
  name: 'CADPreview',
  props: {
    filePath: String,
    drawingId: Number,
    drawing: Object as PropType<Drawing>,
    width: {
      type: Number,
      default: 300
    },
    height: {
      type: Number,
      default: 200
    },
    className: {
      type: String,
      default: ''
    },
    onError: Function as PropType<(error: string) => void>,
    onLoad: Function as PropType<() => void>,
    enableInteraction: {
      type: Boolean,
      default: false
    },
    showToolbar: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const loading = ref(true)
    const error = ref<string | null>(null)
    const viewerInstance = ref<any>(null)
    const containerRef = ref<HTMLDivElement>()
    const { token } = useAuth()

    const loadDxfViewer = async () => {
      let mounted = true

      try {
        loading.value = true
        error.value = null

        console.log('🎯 开始加载DXF预览', { 
          drawing: props.drawing?.id, 
          drawingId: props.drawingId, 
          filePath: props.filePath, 
          hasToken: !!token.value 
        })

        // 动态导入 dxf-viewer
        const { DxfViewer } = await import('dxf-viewer')
        
        if (!mounted || !containerRef.value) {
          console.log('⚠️ 组件已卸载或容器不存在')
          return
        }

        // 清理容器
        containerRef.value.innerHTML = ''

        // 创建查看器实例 - 使用简化的配置
        const viewer = new DxfViewer(containerRef.value, {
          autoResize: true,
          colorCorrection: true
          // 移除不支持的canvasOptions
        })

        viewerInstance.value = viewer
        console.log('✅ DXF查看器创建成功')

        // 获取DXF文件内容
        let dxfContent: string
        
        if (props.drawing?.id || props.drawingId) {
          const id = props.drawing?.id || props.drawingId
          
          if (!token.value) {
            throw new Error('认证令牌未获取到，请重新登录')
          }
          
          console.log('📡 开始获取DXF内容，图纸ID:', id)
          
          // 通过API获取图纸内容
          const response = await fetch(`http://110.40.71.83:35001/api/drawings/${id}/content`, {
            headers: {
              'Authorization': `Bearer ${token.value}`,
            },
          })
          
          console.log('📡 API响应状态:', response.status, response.statusText)
          
          if (!response.ok) {
            if (response.status === 401) {
              throw new Error('认证失败，请重新登录')
            }
            throw new Error(`获取图纸内容失败: ${response.status}`)
          }
          
          dxfContent = await response.text()
          console.log('📄 DXF内容获取成功，长度:', dxfContent.length)
        } else if (props.filePath) {
          // 直接读取文件路径（开发模式）
          const response = await fetch(props.filePath)
          if (!response.ok) {
            throw new Error('读取DXF文件失败')
          }
          dxfContent = await response.text()
        } else {
          throw new Error('无效的参数')
        }

        // 加载DXF到查看器
        console.log('🎨 开始加载DXF到查看器...')
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
        console.log('✅ DXF加载到查看器完成')

        if (mounted) {
          loading.value = false
          props.onLoad?.()
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '加载DXF文件失败'
        console.error('DXF加载失败:', errorMessage, err)
        if (mounted) {
          error.value = errorMessage
          loading.value = false
          props.onError?.(errorMessage)
        }
      }

      return () => {
        mounted = false
        if (viewerInstance.value && viewerInstance.value.Dispose) {
          viewerInstance.value.Dispose()
        }
      }
    }

    onMounted(() => {
      if (!props.drawingId && !props.filePath && !props.drawing) {
        error.value = '未提供图纸ID、文件路径或图纸信息'
        loading.value = false
        return
      }

      // 如果需要API调用但没有token，等待token加载
      if ((props.drawing?.id || props.drawingId) && !token.value) {
        // 等待token加载
        return
      }

      loadDxfViewer()
    })

    onUnmounted(() => {
      if (viewerInstance.value && viewerInstance.value.Dispose) {
        viewerInstance.value.Dispose()
      }
    })

    watch([() => props.drawingId, () => props.filePath, () => props.drawing, token], () => {
      loadDxfViewer()
    })

    return () => {
      if (loading.value) {
        return (
          <div class={`border border-gray-200 rounded-lg overflow-hidden ${props.className}`} style={{ width: `${props.width}px`, height: `${props.height}px` }}>
            <div class="w-full h-full flex items-center justify-center bg-gray-50">
              <div class="flex flex-col items-center space-y-2">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span class="text-sm text-gray-500">加载DXF预览中...</span>
              </div>
            </div>
          </div>
        )
      }

      if (error.value) {
        return (
          <div class={`border border-gray-200 rounded-lg overflow-hidden ${props.className}`} style={{ width: `${props.width}px`, height: `${props.height}px` }}>
            <div class="w-full h-full flex items-center justify-center bg-red-50">
              <div class="text-center">
                <div class="text-red-500 mb-2">
                  <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p class="text-sm text-red-600">{error.value}</p>
              </div>
            </div>
          </div>
        )
      }

      return (
        <div class={`relative border border-gray-200 rounded-lg overflow-hidden ${props.className}`} style={{ width: `${props.width}px`, height: `${props.height}px` }}>
          <div 
            ref={containerRef} 
            class="w-full h-full dxf-viewer-container"
            style={{ background: '#ffffff' }}
          />
        </div>
      )
    }
  }
})