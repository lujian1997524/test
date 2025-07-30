import { defineComponent, ref, computed, onMounted, watch, type PropType } from 'vue'
import { Transition } from 'vue'
import { Button, Input, FormField, FormActions, Loading } from '../ui/index.ts'
import { useAuth } from '../../composables/useAuth.ts'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

interface Worker {
  id: number
  name: string
  department: string
  position: string
}

interface ThicknessSpec {
  id: number
  thickness: string
  unit: string
  materialType: string
  isActive: boolean
  sortOrder: number
}

interface ProjectFormData {
  name: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedWorkerId: number | null
  selectedThicknessSpecs: number[]
}

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProjectFormData) => void
  project?: {
    id: number
    name: string
    description?: string
    status: string
    priority: string
    assignedWorker?: { id: number; name: string }
    materials?: { id: number; thicknessSpecId: number; thicknessSpec: ThicknessSpec }[]
  } | null
  loading?: boolean
}

export const ProjectModal = defineComponent({
  name: 'ProjectModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true
    },
    onSubmit: {
      type: Function as PropType<(data: ProjectFormData) => void>,
      required: true
    },
    project: {
      type: Object as PropType<ProjectModalProps['project']>,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const { token } = useAuth()
    
    const formData = ref<ProjectFormData>({
      name: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      assignedWorkerId: null,
      selectedThicknessSpecs: []
    })
    
    const workers = ref<Worker[]>([])
    const thicknessSpecs = ref<ThicknessSpec[]>([])
    const formErrors = ref<Record<string, string>>({})
    const managingMaterials = ref(false)
    const addingMaterial = ref(false)
    const deletingMaterialId = ref<number | null>(null)

    // 获取工人列表
    const fetchWorkers = async () => {
      try {
        const response = await fetch('http://110.40.71.83:35001/api/workers', {
          headers: { 'Authorization': `Bearer ${token.value}` }
        })

        if (response.ok) {
          const data = await response.json()
          workers.value = data.workers || []
        }
      } catch (error) {
        console.error('获取工人列表失败:', error)
      }
    }

    // 获取厚度规格列表
    const fetchThicknessSpecs = async () => {
      try {
        const response = await fetch('http://110.40.71.83:35001/api/thickness-specs', {
          headers: { 'Authorization': `Bearer ${token.value}` }
        })

        if (response.ok) {
          const data = await response.json()
          // 只显示激活的厚度规格，按排序顺序排列
          const activeSpecs = (data.thicknessSpecs || []).filter((spec: ThicknessSpec) => spec.isActive)
          thicknessSpecs.value = activeSpecs
        }
      } catch (error) {
        console.error('获取厚度规格失败:', error)
      }
    }

    // 监听 isOpen 变化，获取数据和重置状态
    watch(() => props.isOpen, (newVal) => {
      console.log(`🚪 Modal isOpen changed: ${newVal}`)
      
      if (newVal) {
        fetchWorkers()
        fetchThicknessSpecs()
        
        console.log(`📝 Initializing form data, project exists: ${!!props.project}`)
        
        // 只在模态框打开时初始化表单数据
        if (props.project) {
          // 编辑模式：使用项目数据
          console.log('✏️ Edit mode - setting project data')
          formData.value = {
            name: props.project.name,
            description: props.project.description || '',
            status: props.project.status as any,
            priority: props.project.priority as any,
            assignedWorkerId: props.project.assignedWorker?.id || null,
            selectedThicknessSpecs: props.project.materials?.map(m => m.thicknessSpecId) || []
          }
        } else {
          // 新建模式：使用默认值
          console.log('🆕 Create mode - setting default data')
          formData.value = {
            name: '',
            description: '',
            status: 'pending',
            priority: 'medium',
            assignedWorkerId: null,
            selectedThicknessSpecs: []
          }
        }
        
        console.log('📋 Final form data after initialization:', JSON.stringify(formData.value, null, 2))
        formErrors.value = {}
      } else {
        // 模态框关闭时重置提交状态
        isSubmitting.value = false
      }
    })

    // 移除原来的 project watch，避免在输入过程中重置表单

    // 表单验证
    const validateForm = (): boolean => {
      const errors: Record<string, string> = {}

      if (!formData.value.name.trim()) {
        errors.name = '项目名称不能为空'
      }

      if (formData.value.selectedThicknessSpecs.length === 0) {
        errors.selectedThicknessSpecs = '请至少选择一种板材厚度'
      }

      formErrors.value = errors
      return Object.keys(errors).length === 0
    }

    // 处理表单提交
    const isSubmitting = ref(false) // 添加提交状态锁
    
    const handleSubmit = async (e?: Event) => {
      e?.preventDefault()
      
      // 防止重复提交
      if (isSubmitting.value) {
        return
      }
      
      if (!validateForm()) {
        return
      }

      isSubmitting.value = true
      try {
        await props.onSubmit(formData.value)
      } finally {
        isSubmitting.value = false
      }
    }

    // 处理输入变化
    const handleInputChange = (field: keyof ProjectFormData, value: any) => {
      console.log(`🔄 handleInputChange called: ${field} = ${value}`)
      console.log('📋 Current formData before change:', JSON.stringify(formData.value, null, 2))
      
      formData.value = { ...formData.value, [field]: value }
      
      console.log('📋 New formData after change:', JSON.stringify(formData.value, null, 2))
      
      // 清除对应字段的错误
      if ((formErrors.value || {})[field]) {
        const newErrors = { ...(formErrors.value || {}) }
        delete newErrors[field]
        formErrors.value = newErrors
      }
    }

    // 处理厚度规格选择
    const handleThicknessSpecToggle = async (specId: number) => {
      // 如果是编辑模式且项目已存在，直接调用API
      if (props.project?.id) {
        const isSelected = formData.value.selectedThicknessSpecs.includes(specId)
        
        if (isSelected) {
          // 删除板材
          await handleRemoveMaterial(specId)
        } else {
          // 添加板材
          await handleAddMaterial(specId)
        }
      } else {
        // 创建模式，只更新本地状态
        const isSelected = formData.value.selectedThicknessSpecs.includes(specId)
        const newSelection = isSelected 
          ? formData.value.selectedThicknessSpecs.filter(id => id !== specId)
          : [...formData.value.selectedThicknessSpecs, specId]
        
        handleInputChange('selectedThicknessSpecs', newSelection)
      }
    }

    // 添加板材（编辑模式）
    const handleAddMaterial = async (thicknessSpecId: number) => {
      if (!props.project?.id) return
      
      try {
        addingMaterial.value = true
        const response = await fetch(`http://110.40.71.83:35001/api/projects/${props.project.id}/materials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.value}`
          },
          body: JSON.stringify({ thicknessSpecId })
        })

        if (response.ok) {
          // 更新本地状态
          const newSelection = [...formData.value.selectedThicknessSpecs, thicknessSpecId]
          handleInputChange('selectedThicknessSpecs', newSelection)
          
          // 触发材料更新事件
          window.dispatchEvent(new CustomEvent('materials-updated'))
        } else {
          const error = await response.json()
          alert(error.error || '添加板材失败')
        }
      } catch (error) {
        console.error('添加板材错误:', error)
        alert('添加板材失败')
      } finally {
        addingMaterial.value = false
      }
    }

    // 删除板材（编辑模式）
    const handleRemoveMaterial = async (thicknessSpecId: number) => {
      if (!props.project?.id) return
      
      // 找到对应的材料ID
      const material = props.project.materials?.find(m => m.thicknessSpecId === thicknessSpecId)
      if (!material) return

      const confirmed = window.confirm('确定要删除这个板材吗？删除后该板材的所有状态信息将丢失。')
      if (!confirmed) return
      
      try {
        deletingMaterialId.value = material.id
        const response = await fetch(`http://110.40.71.83:35001/api/materials/${material.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })

        if (response.ok) {
          // 更新本地状态
          const newSelection = formData.value.selectedThicknessSpecs.filter(id => id !== thicknessSpecId)
          handleInputChange('selectedThicknessSpecs', newSelection)
          
          // 触发材料更新事件
          window.dispatchEvent(new CustomEvent('materials-updated'))
        } else {
          const error = await response.json()
          alert(error.error || '删除板材失败')
        }
      } catch (error) {
        console.error('删除板材错误:', error)
        alert('删除板材失败')
      } finally {
        deletingMaterialId.value = null
      }
    }

    return () => (
      <Transition
        enterActiveClass="transition-opacity duration-200"
        leaveActiveClass="transition-opacity duration-200"
        enterFromClass="opacity-0"
        enterToClass="opacity-100"
        leaveFromClass="opacity-100"
        leaveToClass="opacity-0"
      >
        {props.isOpen && (
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <div
              class="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={props.onClose}
            />

            {/* 对话框 */}
            <div class="relative w-full max-w-6xl bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl">
              {/* 标题栏 */}
              <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-gray-900">
                    {props.project ? '编辑项目' : '新建项目'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={props.onClose}
                    class="p-2"
                  >
                    <XMarkIcon class="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* 表单内容 */}
              <div class="px-6 py-4">
                <form onSubmit={handleSubmit}>
                  {/* 项目名称 */}
                  <FormField label="项目名称" required error={formErrors.value.name}>
                    <Input
                      type="text"
                      value={formData.value.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="请输入项目名称"
                      error={formErrors.value.name}
                    />
                  </FormField>

                  {/* 项目描述 */}
                  <FormField label="项目描述">
                    <textarea
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      value={formData.value.description}
                      onInput={(e) => handleInputChange('description', (e.target as HTMLTextAreaElement).value)}
                      placeholder="请输入项目描述（可选）"
                    />
                  </FormField>

                  {/* 状态和优先级 */}
                  <div class="grid grid-cols-2 gap-4">
                    <FormField label="项目状态">
                      <select
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.value.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <option value="pending">待处理</option>
                        <option value="in_progress">进行中</option>
                        <option value="completed">已完成</option>
                      </select>
                    </FormField>

                    <FormField label="优先级">
                      <select
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.value.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                      >
                        <option value="low">低</option>
                        <option value="medium">中</option>
                        <option value="high">高</option>
                        <option value="urgent">紧急</option>
                      </select>
                    </FormField>
                  </div>

                  {/* 分配工人 */}
                  <FormField label="分配工人">
                    <select
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.value.assignedWorkerId || ''}
                      onChange={(e) => handleInputChange('assignedWorkerId', e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <option value="">未分配</option>
                      {workers.value.map((worker) => (
                        <option key={worker.id} value={worker.id.toString()}>
                          {worker.name} - {worker.department}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {/* 板材厚度选择 */}
                  <FormField label="板材厚度" required error={formErrors.value.selectedThicknessSpecs}>
                    {props.project?.id && (
                      <div class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div class="text-sm text-blue-800 font-medium mb-1">实时板材管理</div>
                        <div class="text-xs text-blue-600">
                          编辑项目时，点击厚度规格会立即添加或删除对应的板材
                        </div>
                      </div>
                    )}
                    <div class="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                      {thicknessSpecs.value.map((spec) => {
                        const isSelected = formData.value.selectedThicknessSpecs.includes(spec.id)
                        const isProcessing = addingMaterial.value || deletingMaterialId.value !== null
                        const isThisSpecProcessing = deletingMaterialId.value === props.project?.materials?.find(m => m.thicknessSpecId === spec.id)?.id
                        
                        return (
                          <button
                            key={spec.id}
                            type="button"
                            onClick={() => handleThicknessSpecToggle(spec.id)}
                            disabled={isProcessing}
                            class={`px-3 py-2 text-sm rounded-lg border-2 transition-colors relative ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50'
                            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isThisSpecProcessing && (
                              <div class="absolute inset-0 flex items-center justify-center">
                                <Loading size="sm" />
                              </div>
                            )}
                            <div class={isThisSpecProcessing ? 'opacity-0' : ''}>
                              {spec.thickness}{spec.unit}
                              {spec.materialType && (
                                <div class="text-xs opacity-75">{spec.materialType}</div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    {formData.value.selectedThicknessSpecs.length > 0 && (
                      <div class="mt-2 text-sm text-gray-600">
                        已选择 {formData.value.selectedThicknessSpecs.length} 种厚度规格
                        {props.project?.id && (
                          <span class="text-blue-600 ml-2">（已实时同步到项目）</span>
                        )}
                      </div>
                    )}
                  </FormField>
                </form>
              </div>

              {/* 底部按钮 */}
              <div class="px-6 py-4 border-t border-gray-200">
                <FormActions>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={props.onClose}
                  >
                    取消
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleSubmit()}
                    loading={props.loading || isSubmitting.value}
                    disabled={props.loading || isSubmitting.value}
                  >
                    {props.project ? '保存修改' : '创建项目'}
                  </Button>
                </FormActions>
              </div>
            </div>
          </div>
        )}
      </Transition>
    )
  }
})

export default ProjectModal