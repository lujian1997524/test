import { defineComponent, ref, onMounted, onUnmounted, watch, computed, type PropType } from 'vue'
import { Transition } from 'vue'
import { Button, Input, Modal } from '../ui/index.ts'
import { useAuth } from '../../composables/useAuth.ts'
import { useWorkerStore } from '../../stores/index.ts'
import type { DepartmentState } from '../../stores/index.ts'
import {
  PlusIcon,
  BuildingOfficeIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'


interface WorkersSidebarProps {
  selectedDepartment: string
  onDepartmentChange: (department: string) => void
  onRefresh?: () => void
  onMobileItemClick?: () => void
  className?: string
}

export const WorkersSidebar = defineComponent({
  name: 'WorkersSidebar',
  props: {
    selectedDepartment: {
      type: String,
      required: true
    },
    onDepartmentChange: {
      type: Function as PropType<(department: string) => void>,
      required: true
    },
    onRefresh: Function as PropType<() => void>,
    onMobileItemClick: Function as PropType<() => void>,
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { emit }) {
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    const editingDepartment = ref<DepartmentState | null>(null)
    const formData = ref({ name: '' })
    const submitLoading = ref(false)
    
    const { token, user } = useAuth()
    const isAdmin = computed(() => user.value?.role === 'admin')
    
    // 使用WorkerStore
    const workerStore = useWorkerStore()
    const { 
      departments, 
      loading, 
      fetchDepartments,
      createDepartment,
      updateDepartment,
      deleteDepartment
    } = workerStore



    // 删除部门 - 使用WorkerStore
    const handleDeleteDepartment = async (department: DepartmentState) => {
      if (!confirm(`确定要删除部门 "${department.name}" 吗？此操作不可撤销。`)) {
        return
      }

      const success = await deleteDepartment(department.id)
      if (success) {
        // 如果删除的是当前选中的部门，切换到全部
        if (props.selectedDepartment === department.name) {
          props.onDepartmentChange('all')
        }
        props.onRefresh?.()
      } else {
        alert('删除部门失败，请重试')
      }
    }

    // 打开编辑模态框
    const openEditModal = (department: DepartmentState) => {
      editingDepartment.value = department
      formData.value = { name: department.name }
      showEditModal.value = true
    }

    // 打开创建模态框
    const openCreateModal = () => {
      formData.value = { name: '' }
      showCreateModal.value = true
      props.onMobileItemClick?.() // 移动端自动收回侧边栏
    }
    
    // 创建部门
    const handleCreateDepartment = async () => {
      if (!formData.value.name.trim()) return
      
      try {
        submitLoading.value = true
        const result = await createDepartment({ name: formData.value.name.trim() })
        
        if (result) {
          showCreateModal.value = false
          formData.value.name = ''
          props.onRefresh?.()
        } else {
          alert('创建部门失败，请重试')
        }
      } catch (error) {
        console.error('创建部门失败:', error)
        alert('创建部门失败，请重试')
      } finally {
        submitLoading.value = false
      }
    }

    // 更新部门
    const handleUpdateDepartment = async () => {
      if (!editingDepartment.value || !formData.value.name.trim()) return
      
      try {
        submitLoading.value = true
        const result = await updateDepartment(editingDepartment.value.id, { name: formData.value.name.trim() })
        
        if (result) {
          showEditModal.value = false
          editingDepartment.value = null
          formData.value.name = ''
          props.onRefresh?.()
        } else {
          alert('更新部门失败，请重试')
        }
      } catch (error) {
        console.error('更新部门失败:', error)
        alert('更新部门失败，请重试')
      } finally {
        submitLoading.value = false
      }
    }

    // 处理键盘事件
    const handleKeyDown = (e: KeyboardEvent, action: () => void) => {
      if (e.key === 'Enter' && formData.value.name.trim()) {
        action()
      }
    }

    // 计算总工人数
    const totalWorkerCount = computed(() => 
      departments.value?.reduce((total, dept) => total + (dept.workerCount || 0), 0) || 0
    )

    // 监听刷新事件
    const handleRefresh = () => {
      fetchDepartments()
    }

    onMounted(() => {
      console.log('🏢 WorkersSidebar: 组件挂载，开始获取部门数据')
      fetchDepartments()
      window.addEventListener('refresh-workers', handleRefresh)
    })

    onUnmounted(() => {
      window.removeEventListener('refresh-workers', handleRefresh)
    })

    watch(token, (newToken) => {
      if (newToken) {
        fetchDepartments()
      }
    })

    return () => {
      if (loading.value) {
        return (
          <div class={`h-full bg-white/80 backdrop-blur-xl p-4 ${props.className}`}>
            <div class="animate-pulse space-y-4">
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              <div class="space-y-2">
                <div class="h-8 bg-gray-200 rounded"></div>
                <div class="h-8 bg-gray-200 rounded"></div>
                <div class="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        )
      }

      return (
        <div class={`h-full bg-white/80 backdrop-blur-xl p-4 flex flex-col ${props.className}`}>
          {/* 标题和创建按钮 */}
          <div class="flex items-center justify-between mb-4 flex-shrink-0">
            <h3 class="font-semibold text-gray-900 flex items-center">
              <BuildingOfficeIcon class="w-5 h-5 mr-2" />
              部门管理
            </h3>
            {isAdmin.value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={openCreateModal}
                class="p-1.5 hover:bg-ios18-blue/10"
              >
                <PlusIcon class="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* 部门列表 */}
          <div class="space-y-1 flex-1 overflow-y-auto">
            {/* 全部工人 */}
            <button
              onClick={() => {
                props.onDepartmentChange('all')
                props.onMobileItemClick?.() // 通知移动端关闭侧边栏
              }}
              class={`
                w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors
                ${props.selectedDepartment === 'all' 
                  ? 'bg-ios18-blue/10 text-ios18-blue border border-ios18-blue/20' 
                  : 'hover:bg-gray-100 text-gray-700'
                }
              `}
            >
              <div class="flex items-center">
                <UsersIcon class="w-4 h-4 mr-2" />
                <span class="text-sm truncate">全部工人</span>
              </div>
              <span class="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
                {totalWorkerCount.value}
              </span>
            </button>

            {/* 部门列表 */}
            <div class="space-y-1">
              {(departments.value || []).map((department) => (
                <Transition
                  key={department.id}
                  enterActiveClass="transition-all duration-200"
                  enterFromClass="opacity-0 -translate-x-5"
                  enterToClass="opacity-100 translate-x-0"
                >
                  <div class="group relative">
                    <button
                      onClick={() => {
                        props.onDepartmentChange(department.name)
                        props.onMobileItemClick?.() // 通知移动端关闭侧边栏
                      }}
                      class={`
                        w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors pr-16
                        ${props.selectedDepartment === department.name 
                          ? 'bg-ios18-blue/10 text-ios18-blue border border-ios18-blue/20' 
                          : 'hover:bg-gray-100 text-gray-700'
                        }
                      `}
                    >
                      <div class="flex items-center min-w-0 flex-1">
                        <BuildingOfficeIcon class="w-4 h-4 mr-2 flex-shrink-0" />
                        <span class="truncate text-sm">{department.name}</span>
                      </div>
                      {department.workerCount !== undefined && (
                        <span class="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 ml-2">
                          {department.workerCount}
                        </span>
                      )}
                    </button>

                    {/* 操作按钮 */}
                    {isAdmin.value && (
                      <div class="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div class="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(department)
                            }}
                            class="p-1 rounded hover:bg-blue-100 text-blue-600"
                          >
                            <PencilIcon class="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteDepartment(department)
                            }}
                            class="p-1 rounded hover:bg-red-100 text-red-600"
                          >
                            <TrashIcon class="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </Transition>
              ))}
            </div>
          </div>

          {/* 创建部门模态框 */}
          <Modal
            isOpen={showCreateModal.value}
            onClose={() => {
              showCreateModal.value = false
              formData.value = { name: '' }
            }}
            title="创建部门"
          >
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  部门名称
                </label>
                <Input
                  type="text"
                  value={formData.value.name}
                  onUpdate:modelValue={(value: string) => formData.value = { name: value }}
                  placeholder="请输入部门名称"
                  required
                  onKeydown={(e) => handleKeyDown(e, handleCreateDepartment)}
                />
              </div>
              
              <div class="flex space-x-2 pt-4">
                <Button
                  variant="primary"
                  onClick={handleCreateDepartment}
                  loading={submitLoading.value}
                  disabled={!formData.value.name.trim()}
                  class="flex-1"
                >
                  创建
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    showCreateModal.value = false
                    formData.value = { name: '' }
                  }}
                  class="flex-1"
                >
                  取消
                </Button>
              </div>
            </div>
          </Modal>

          {/* 编辑部门模态框 */}
          <Modal
            isOpen={showEditModal.value}
            onClose={() => {
              showEditModal.value = false
              editingDepartment.value = null
              formData.value = { name: '' }
            }}
            title="编辑部门"
          >
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  部门名称
                </label>
                <Input
                  type="text"
                  value={formData.value.name}
                  onUpdate:modelValue={(value: string) => formData.value = { name: value }}
                  placeholder="请输入部门名称"
                  required
                  onKeydown={(e) => handleKeyDown(e, handleUpdateDepartment)}
                />
              </div>
              
              <div class="flex space-x-2 pt-4">
                <Button
                  variant="primary"
                  onClick={handleUpdateDepartment}
                  loading={submitLoading.value}
                  disabled={!formData.value.name.trim()}
                  class="flex-1"
                >
                  保存
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    showEditModal.value = false
                    editingDepartment.value = null
                    formData.value = { name: '' }
                  }}
                  class="flex-1"
                >
                  取消
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      )
    }
  }
})