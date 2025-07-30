import { defineComponent, ref, watch, type PropType } from 'vue'
import { Transition } from 'vue'
import { Button, Input, Loading } from '../ui/index.ts'
import { useAuth } from '../../composables/useAuth.ts'
import { ChevronUpIcon, ChevronDownIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline'

interface ThicknessSpec {
  id: number
  thickness: string
  unit: string
  materialType: string
  isActive: boolean
  sortOrder: number
}

interface ThicknessSpecModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export const ThicknessSpecModal = defineComponent({
  name: 'ThicknessSpecModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true
    },
    onUpdate: {
      type: Function as PropType<() => void>,
      required: true
    }
  },
  setup(props) {
    const { token } = useAuth()
    
    const thicknessSpecs = ref<ThicknessSpec[]>([])
    const loading = ref(false)
    const error = ref('')
    const editingSpec = ref<ThicknessSpec | null>(null)
    const isCreating = ref(false)

    // 新增/编辑表单状态
    const formData = ref({
      thickness: '',
      unit: 'mm',
      materialType: '钢板',
      isActive: true,
      sortOrder: 0
    })

    // 获取厚度规格列表
    const fetchThicknessSpecs = async () => {
      try {
        loading.value = true
        error.value = ''
        
        const response = await fetch('http://110.40.71.83:35001/api/thickness-specs', {
          headers: { 'Authorization': `Bearer ${token.value}` },
        })

        if (!response.ok) {
          throw new Error('获取厚度规格失败')
        }

        const data = await response.json()
        const specs = (data.thicknessSpecs || []).sort((a: ThicknessSpec, b: ThicknessSpec) => a.sortOrder - b.sortOrder)
        thicknessSpecs.value = specs

      } catch (err) {
        error.value = err instanceof Error ? err.message : '获取数据失败'
      } finally {
        loading.value = false
      }
    }

    // 监听模态框打开状态，获取数据
    watch(() => props.isOpen, (newVal) => {
      if (newVal) {
        fetchThicknessSpecs()
      }
    })

    // 创建厚度规格
    const handleCreate = async () => {
      try {
        loading.value = true
        
        const response = await fetch('http://110.40.71.83:35001/api/thickness-specs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.value}`,
          },
          body: JSON.stringify({
            ...formData.value,
            sortOrder: thicknessSpecs.value.length
          }),
        })

        if (response.ok) {
          isCreating.value = false
          formData.value = { thickness: '', unit: 'mm', materialType: '钢板', isActive: true, sortOrder: 0 }
          await fetchThicknessSpecs()
          props.onUpdate() // 通知父组件更新
        } else {
          const errorData = await response.json()
          error.value = '创建失败: ' + (errorData.message || '未知错误')
        }
      } catch (err) {
        error.value = '创建失败'
      } finally {
        loading.value = false
      }
    }

    // 更新厚度规格
    const handleUpdate = async () => {
      if (!editingSpec.value) return
      
      try {
        loading.value = true
        
        const response = await fetch(`http://110.40.71.83:35001/api/thickness-specs/${editingSpec.value.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.value}`,
          },
          body: JSON.stringify(formData.value),
        })

        if (response.ok) {
          editingSpec.value = null
          formData.value = { thickness: '', unit: 'mm', materialType: '钢板', isActive: true, sortOrder: 0 }
          await fetchThicknessSpecs()
          props.onUpdate() // 通知父组件更新
        } else {
          const errorData = await response.json()
          error.value = '更新失败: ' + (errorData.message || '未知错误')
        }
      } catch (err) {
        error.value = '更新失败'
      } finally {
        loading.value = false
      }
    }

    // 删除厚度规格
    const handleDelete = async (id: number) => {
      const confirmed = window.confirm('确定要删除这个厚度规格吗？\n注意：如果有项目正在使用此规格，删除将失败。')
      if (!confirmed) return
      
      try {
        loading.value = true
        error.value = '' // 清除之前的错误
        
        const response = await fetch(`http://110.40.71.83:35001/api/thickness-specs/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token.value}` },
        })

        const result = await response.json()

        if (response.ok) {
          await fetchThicknessSpecs()
          props.onUpdate() // 通知父组件更新
        } else {
          // 显示服务器返回的具体错误信息
          error.value = result.error || '删除失败'
        }
      } catch (err) {
        error.value = '删除失败：网络连接错误'
      } finally {
        loading.value = false
      }
    }

    // 开始编辑
    const startEdit = (spec: ThicknessSpec) => {
      editingSpec.value = spec
      formData.value = {
        thickness: spec.thickness,
        unit: spec.unit,
        materialType: spec.materialType,
        isActive: spec.isActive,
        sortOrder: spec.sortOrder
      }
      isCreating.value = false
    }

    // 开始创建
    const startCreate = () => {
      isCreating.value = true
      editingSpec.value = null
      formData.value = { thickness: '', unit: 'mm', materialType: '钢板', isActive: true, sortOrder: thicknessSpecs.value.length }
    }

    // 取消操作
    const handleCancel = () => {
      isCreating.value = false
      editingSpec.value = null
      formData.value = { thickness: '', unit: 'mm', materialType: '钢板', isActive: true, sortOrder: 0 }
      error.value = ''
    }

    // 调整排序
    const moveSpec = async (id: number, direction: 'up' | 'down') => {
      const currentIndex = thicknessSpecs.value.findIndex(spec => spec.id === id)
      if (currentIndex === -1) return
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (newIndex < 0 || newIndex >= thicknessSpecs.value.length) return

      try {
        loading.value = true
        
        // 交换排序值
        const updates = [
          { id: thicknessSpecs.value[currentIndex].id, sortOrder: newIndex },
          { id: thicknessSpecs.value[newIndex].id, sortOrder: currentIndex }
        ]

        await Promise.all(updates.map(update => 
          fetch(`http://110.40.71.83:35001/api/thickness-specs/${update.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token.value}`,
            },
            body: JSON.stringify({ sortOrder: update.sortOrder }),
          })
        ))

        await fetchThicknessSpecs()
        props.onUpdate() // 通知父组件更新
      } catch (err) {
        error.value = '调整顺序失败'
      } finally {
        loading.value = false
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
          <div class="fixed inset-0 z-50 flex items-center justify-center">
            {/* 背景遮罩 */}
            <div 
              class="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={props.onClose}
            />
            
            {/* 模态框内容 */}
            <div class="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* 头部 */}
              <div class="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/60 to-white/40">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-gray-900">
                    板材厚度规格管理
                  </h2>
                  <div class="flex items-center space-x-3">
                    <Button
                      onClick={startCreate}
                      class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md"
                      size="sm"
                    >
                      新增规格
                    </Button>
                    <Button
                      onClick={props.onClose}
                      variant="ghost"
                      size="sm"
                      class="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <XMarkIcon class="w-5 h-5 text-gray-500" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 内容区域 */}
              <div class="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                {error.value && (
                  <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error.value}
                  </div>
                )}

                {/* 新增/编辑表单 */}
                {(isCreating.value || editingSpec.value) && (
                  <div class="mb-6 p-4 bg-blue-50/50 border border-blue-200/50 rounded-xl">
                    <h3 class="text-base font-semibold text-gray-900 mb-4">
                      {isCreating.value ? '新增厚度规格' : '编辑厚度规格'}
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">厚度</label>
                        <Input
                          type="text"
                          value={formData.value.thickness}
                          onChange={(e) => formData.value.thickness = e.target.value}
                          placeholder="如: 1.0"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">单位</label>
                        <select
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.value.unit}
                          onChange={(e) => formData.value.unit = e.target.value}
                        >
                          <option value="mm">mm</option>
                          <option value="cm">cm</option>
                          <option value="inch">inch</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">材料类型</label>
                        <select
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formData.value.materialType}
                          onChange={(e) => formData.value.materialType = e.target.value}
                        >
                          <option value="钢板">钢板</option>
                          <option value="不锈钢">不锈钢</option>
                          <option value="铝板">铝板</option>
                          <option value="铜板">铜板</option>
                          <option value="其他">其他</option>
                        </select>
                      </div>
                      <div class="flex items-end">
                        <div class="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.value.isActive}
                            onChange={(e) => formData.value.isActive = e.target.checked}
                            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span class="text-sm font-medium text-gray-700">启用</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center space-x-3 mt-4">
                      <Button
                        onClick={isCreating.value ? handleCreate : handleUpdate}
                        disabled={loading.value || !formData.value.thickness}
                        variant="primary"
                      >
                        {loading.value ? '保存中...' : (isCreating.value ? '创建' : '更新')}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="ghost"
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                )}

                {/* 厚度规格列表 */}
                <div class="space-y-3">
                  <h3 class="text-base font-semibold text-gray-900">
                    现有规格列表 ({thicknessSpecs.value.length}个)
                  </h3>
                  
                  {loading.value && thicknessSpecs.value.length === 0 ? (
                    <div class="text-center py-8">
                      <Loading size="md" />
                      <div class="mt-2 text-sm text-gray-500">加载中...</div>
                    </div>
                  ) : thicknessSpecs.value.length === 0 ? (
                    <div class="text-center py-8">
                      <div class="text-sm text-gray-500">暂无厚度规格，请先添加</div>
                    </div>
                  ) : (
                    <div class="space-y-2">
                      {thicknessSpecs.value.map((spec, index) => (
                        <div
                          key={spec.id}
                          class="flex items-center justify-between p-4 bg-white/60 border border-gray-200/50 rounded-xl hover:bg-white/80 transition-all duration-200"
                        >
                          <div class="flex items-center space-x-4">
                            <div class="flex flex-col space-y-1">
                              <button
                                onClick={() => moveSpec(spec.id, 'up')}
                                disabled={index === 0 || loading.value}
                                class="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronUpIcon class="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => moveSpec(spec.id, 'down')}
                                disabled={index === thicknessSpecs.value.length - 1 || loading.value}
                                class="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronDownIcon class="w-3 h-3" />
                              </button>
                            </div>
                            <div class="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-700">
                              {index + 1}
                            </div>
                            <div>
                              <div class="font-semibold text-sm text-gray-900">
                                {spec.thickness}{spec.unit} - {spec.materialType}
                              </div>
                              <div class="text-xs text-gray-500">
                                排序: {spec.sortOrder} | 状态: {spec.isActive ? '启用' : '禁用'}
                              </div>
                            </div>
                          </div>
                          <div class="flex items-center space-x-2">
                            <button
                              onClick={() => startEdit(spec)}
                              class="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                            >
                              <PencilIcon class="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(spec.id)}
                              class="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                            >
                              <TrashIcon class="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Transition>
    )
  }
})

export default ThicknessSpecModal