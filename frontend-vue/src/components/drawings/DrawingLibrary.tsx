import { defineComponent, ref, watch, onMounted, computed, type PropType } from 'vue'
import { Transition } from 'vue'
import { Alert, Loading, EmptyData, Modal, Input, Dropdown, Button } from '../ui/index.ts'
import { DrawingGrid } from './DrawingGrid'
import { DrawingUpload } from './DrawingUpload'
import { DxfPreviewModal } from '../ui/DxfPreviewModal'
import { useAuth } from '../../composables/useAuth.ts'
import { cadFileHandler } from '../../utils/cadFileHandler.ts'

export interface Drawing {
  id: number
  filename: string
  originalName: string
  filePath: string
  fileSize: number
  fileType: 'DXF' // 只支持DXF文件
  version: string
  status: '可用' | '已废弃' | '已归档'
  description?: string
  uploadedBy: number
  createdAt: string
  updatedAt: string
  archivedAt?: string
  isCommonPart?: boolean
  tags?: string[]
  projectIds?: number[]
  project?: {
    id: number
    name: string
    status: string
  }
  uploader?: {
    id: number
    name: string
  }
}

interface DrawingLibraryProps {
  className?: string
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  showUploadModal?: boolean
  onUploadModalChange?: (show: boolean) => void
}

export const DrawingLibrary = defineComponent({
  name: 'DrawingLibrary',
  props: {
    className: {
      type: String,
      default: ''
    },
    selectedCategory: {
      type: String,
      default: 'all'
    },
    onCategoryChange: {
      type: Function as PropType<(category: string) => void>,
      default: undefined
    },
    showUploadModal: {
      type: Boolean,
      default: false
    },
    onUploadModalChange: {
      type: Function as PropType<(show: boolean) => void>,
      default: undefined
    }
  },
  setup(props) {
    const { token } = useAuth()
    
    const drawings = ref<Drawing[]>([])
    const loading = ref(true)
    const error = ref<string | null>(null)
    const showPreview = ref(false)
    const previewDrawing = ref<Drawing | null>(null)
    const showEditModal = ref(false)
    const editingDrawing = ref<Drawing | null>(null)
    const editDescription = ref('')
    const editStatus = ref<'可用' | '已废弃' | '已归档'>('可用')
    const editFilename = ref('')

    // 获取图纸列表
    const fetchDrawings = async () => {
      if (!token.value) return
      
      try {
        loading.value = true
        const params = new URLSearchParams({
          category: props.selectedCategory || 'all'
        })
        
        const response = await fetch(`http://110.40.71.83:35001/api/drawings?${params}`, {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          drawings.value = data.drawings || data
          error.value = null
        } else {
          throw new Error('获取图纸列表失败')
        }
      } catch (err) {
        console.error('获取图纸列表失败:', err)
        error.value = '获取图纸列表失败，请重试'
      } finally {
        loading.value = false
      }
    }

    // 处理预览
    const handlePreview = (drawing: Drawing) => {
      // 转换Drawing为DxfPreviewModal所需格式
      const dxfDrawing = {
        id: drawing.id,
        projectId: 0, // 图纸库中的图纸没有关联项目
        filename: drawing.filename,
        originalFilename: drawing.originalName,
        filePath: drawing.filePath,
        version: drawing.version,
        createdAt: drawing.createdAt,
        uploader: drawing.uploadedBy ? { id: drawing.uploadedBy, name: '未知用户' } : undefined
      }
      previewDrawing.value = dxfDrawing as any
      showPreview.value = true
    }

    // 处理编辑
    const handleEdit = (drawing: Drawing) => {
      editingDrawing.value = drawing
      editDescription.value = drawing.description || ''
      editStatus.value = drawing.status
      editFilename.value = drawing.originalName || drawing.filename
      showEditModal.value = true
    }

    // 处理图纸打开
    const handleOpen = async (drawing: Drawing) => {
      try {
        const fileName = drawing.originalName || drawing.filename
        const cadCheck = await cadFileHandler.isCADFile(fileName)
        
        if (cadCheck.isCADFile) {
          // 使用CAD软件打开
          const result = await cadFileHandler.openCADFile(drawing.filePath)
          if (result.success) {
            console.log(`图纸 ${fileName} 已使用 ${result.software} 打开`)
          } else {
            console.error('打开图纸失败:', result.error)
            error.value = `打开图纸失败: ${result.error}`
          }
        } else {
          // 如果不是CAD文件或检测失败，提供下载
          window.open(`/api/drawings/${drawing.id}/download`, '_blank')
        }
      } catch (err) {
        console.error('处理图纸打开失败:', err)
        error.value = '打开图纸失败，请重试'
      }
    }

    const handleDelete = async (drawing: Drawing) => {
      if (!confirm(`确定要删除图纸 "${drawing.originalName}" 吗？此操作不可撤销。`)) {
        return
      }

      try {
        const response = await fetch(`http://110.40.71.83:35001/api/drawings/${drawing.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })

        if (response.ok) {
          await fetchDrawings() // 重新获取列表
          error.value = null
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || '删除失败')
        }
      } catch (err) {
        console.error('删除图纸失败:', err)
        error.value = err instanceof Error ? err.message : '删除图纸失败，请重试'
      }
    }

    // 提交编辑
    const handleEditSubmit = async () => {
      if (!editingDrawing.value) return

      // 验证文件名
      if (!editFilename.value.trim()) {
        error.value = '文件名不能为空'
        return
      }

      // 检查文件名格式
      if (!editFilename.value.toLowerCase().endsWith('.dxf')) {
        error.value = '文件名必须以 .dxf 结尾'
        return
      }

      // 检查非法字符
      const invalidChars = /[<>:"/\\|?*]/
      if (invalidChars.test(editFilename.value)) {
        error.value = '文件名不能包含以下字符: < > : " / \\ | ? *'
        return
      }

      try {
        const response = await fetch(`http://110.40.71.83:35001/api/drawings/${editingDrawing.value.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.value}`
          },
          body: JSON.stringify({
            description: editDescription.value,
            status: editStatus.value,
            originalFilename: editFilename.value
          })
        })

        if (response.ok) {
          await fetchDrawings() // 重新获取列表
          showEditModal.value = false
          editingDrawing.value = null
          error.value = null
          // 触发图纸更新事件
          window.dispatchEvent(new CustomEvent('drawing-updated'))
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || '更新失败')
        }
      } catch (err) {
        console.error('更新图纸失败:', err)
        error.value = err instanceof Error ? err.message : '更新图纸失败，请重试'
      }
    }

    // 按月份分组归档图纸
    const groupArchivedDrawingsByMonth = (drawings: Drawing[]) => {
      const archivedDrawings = drawings.filter(d => d.status === '已归档' && d.archivedAt)
      
      const grouped = archivedDrawings.reduce((groups, drawing) => {
        const archivedDate = new Date(drawing.archivedAt!)
        const monthKey = `${archivedDate.getFullYear()}-${String(archivedDate.getMonth() + 1).padStart(2, '0')}`
        const monthLabel = `${archivedDate.getFullYear()}年${archivedDate.getMonth() + 1}月`
        
        if (!groups[monthKey]) {
          groups[monthKey] = {
            label: monthLabel,
            drawings: []
          }
        }
        
        groups[monthKey].drawings.push(drawing)
        return groups
      }, {} as Record<string, { label: string; drawings: Drawing[] }>)
      
      // 按月份倒序排列
      return Object.entries(grouped)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([key, value]) => ({ key, ...value }))
    }

    const archivedGroups = computed(() => groupArchivedDrawingsByMonth(drawings.value))

    // 处理图纸上传成功
    const handleUploadSuccess = () => {
      fetchDrawings()
      props.onUploadModalChange?.(false)
      // 触发图纸更新事件
      window.dispatchEvent(new CustomEvent('drawing-updated'))
    }

    // 处理图纸删除
    const handleDeleteDrawing = async (drawingId: number) => {
      if (!confirm('确定要删除这个图纸吗？此操作不可撤销。')) {
        return
      }

      try {
        const response = await fetch(`http://110.40.71.83:35001/api/drawings/${drawingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })

        if (response.ok) {
          fetchDrawings()
          // 触发图纸更新事件
          window.dispatchEvent(new CustomEvent('drawing-updated'))
        } else {
          throw new Error('删除图纸失败')
        }
      } catch (err) {
        console.error('删除图纸失败:', err)
        alert('删除图纸失败，请重试')
      }
    }

    // 监听分类变化
    watch(() => props.selectedCategory, () => {
      fetchDrawings()
    })

    // 初始化
    onMounted(() => {
      fetchDrawings()
    })

    // 监听外部分类变化
    watch(() => props.selectedCategory, (newVal) => {
      if (props.onCategoryChange && newVal !== 'all') {
        // 只在非默认分类时调用回调
      }
    })

    // 监听外部上传状态变化
    watch(() => props.showUploadModal, (newVal) => {
      if (newVal !== undefined) {
        // 外部控制上传模态框显示状态
      }
    })

    // 状态选项
    const statusOptions = [
      { label: '可用', value: '可用' },
      { label: '已废弃', value: '已废弃' },
      { label: '已归档', value: '已归档' }
    ]

    return () => {
      if (loading.value) {
        return (
          <div class={`flex items-center justify-center h-64 ${props.className}`}>
            <Loading text="加载图纸库..." />
          </div>
        )
      }

      if (error.value) {
        return (
          <div class={props.className}>
            <Alert variant="error">
              {error.value}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchDrawings}
                class="ml-2"
              >
                重试
              </Button>
            </Alert>
          </div>
        )
      }

      return (
        <div class={`flex flex-col h-full ${props.className}`}>
          {/* 内容区域 - 移除所有工具栏 */}
          <div class="flex-1 overflow-hidden p-4">
            {props.selectedCategory === 'archived' && archivedGroups.value.length > 0 ? (
              // 归档图纸按月份分组显示
              <div class="h-full overflow-auto">
                {archivedGroups.value.map((group) => (
                  <div key={group.key} class="mb-6">
                    {/* 月份标题 */}
                    <div class="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 py-3 mb-4">
                      <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                        <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {group.label}
                        <span class="ml-2 text-sm font-normal text-gray-500">
                          ({group.drawings.length} 个图纸)
                        </span>
                      </h3>
                    </div>
                    
                    {/* 该月份的图纸 */}
                    <DrawingGrid
                      drawings={group.drawings}
                      onPreview={handlePreview}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onOpen={handleOpen}
                      class="px-4"
                    />
                  </div>
                ))}
              </div>
            ) : drawings.value.length === 0 ? (
              <EmptyData
                title="暂无图纸"
                description="还没有上传任何图纸"
                action={
                  <Button variant="primary" onClick={() => props.onUploadModalChange?.(true)}>
                    上传第一个图纸
                  </Button>
                }
              />
            ) : (
              <DrawingGrid
                drawings={drawings.value}
                onPreview={handlePreview}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onOpen={handleOpen}
                class="h-full"
              />
            )}
          </div>

          {/* 上传对话框 */}
          {props.showUploadModal && (
            <DrawingUpload
              isOpen={props.showUploadModal}
              onClose={() => props.onUploadModalChange?.(false)}
              onSuccess={handleUploadSuccess}
            />
          )}

          {/* DXF预览模态框 */}
          <DxfPreviewModal
            drawing={previewDrawing.value as any}
            isOpen={showPreview.value}
            onClose={() => {
              showPreview.value = false
              previewDrawing.value = null
            }}
          />

          {/* 编辑图纸模态框 */}
          <Modal
            isOpen={showEditModal.value}
            onClose={() => {
              showEditModal.value = false
              editingDrawing.value = null
              editFilename.value = ''
              editDescription.value = ''
              editStatus.value = '可用'
            }}
            title="编辑图纸信息"
            size="md"
          >
            <div class="space-y-4">
              {/* 文件名（可编辑） */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  文件名
                </label>
                <Input
                  value={editFilename.value}
                  onChange={(e) => editFilename.value = e.target.value}
                  placeholder="输入文件名（必须以.dxf结尾）"
                  class="w-full"
                />
                <p class="text-xs text-gray-500 mt-1">
                  文件名不能包含: &lt; &gt; : " / \ | ? *
                </p>
              </div>

              {/* 描述 */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  描述信息
                </label>
                <Input
                  placeholder="输入图纸描述..."
                  value={editDescription.value}
                  onChange={(e) => editDescription.value = e.target.value}
                  multiline
                  rows={3}
                />
              </div>

              {/* 状态 */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  状态
                </label>
                <Dropdown
                  options={statusOptions}
                  value={editStatus.value}
                  onChange={(value) => editStatus.value = value as '可用' | '已废弃' | '已归档'}
                  class="w-full"
                />
              </div>

              {/* 操作按钮 */}
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={() => {
                    showEditModal.value = false
                    editingDrawing.value = null
                    editFilename.value = ''
                    editDescription.value = ''
                    editStatus.value = '可用'
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  onClick={handleEditSubmit}
                >
                  保存修改
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      )
    }
  }
})

export default DrawingLibrary