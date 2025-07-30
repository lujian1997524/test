import { defineComponent, ref, computed, onMounted, onUnmounted, watch, type PropType } from 'vue'
import { Transition } from 'vue'
import { Button, Card, Input, Table, TableHeader, TableBody, TableRow, TableCell, Form, FormField, FormActions } from '../ui/index.ts'
import { useAuth } from '../../composables/useAuth.ts'
import { useWorkerStore } from '../../stores/index.ts'
import type { WorkerState, DepartmentState } from '../../stores/index.ts'


interface WorkerManagementProps {
  className?: string
  onClose?: () => void
  selectedDepartment?: string
  onDepartmentChange?: (department: string) => void
}

export const WorkerManagement = defineComponent({
  name: 'WorkerManagement',
  props: {
    className: {
      type: String,
      default: ''
    },
    onClose: {
      type: Function as PropType<() => void>,
      default: undefined
    },
    selectedDepartment: {
      type: String,
      default: 'all'  
    },
    onDepartmentChange: {
      type: Function as PropType<(department: string) => void>,
      default: undefined
    }
  },
  setup(props) {
    const editingWorker = ref<WorkerState | null>(null)
    const showModal = ref(false)
    const submitLoading = ref(false)
    const formData = ref({
      name: '',
      phone: '',
      departmentId: ''
    })
    const formErrors = ref<Record<string, string>>({})
    
    const { token, user } = useAuth()
    const isAdmin = computed(() => user.value?.role === 'admin')
    
    // 使用WorkerStore
    const workerStore = useWorkerStore()
    const { 
      workers, 
      departments, 
      loading, 
      fetchWorkers, 
      fetchDepartments,
      createWorker,
      updateWorker,
      deleteWorker
    } = workerStore

    onMounted(() => {
      console.log('👷 WorkerManagement: 组件挂载')
      if (token.value) {
        fetchWorkers()
        fetchDepartments()
        console.log('👷 WorkerManagement: 开始获取工人和部门数据')
      } else {
        console.log('👷 WorkerManagement: 没有token，等待认证')
      }
      // 监听刷新事件
      window.addEventListener('refresh-workers', handleRefresh)
    })

    // 监听token变化
    watch(token, (newToken) => {
      if (newToken) {
        fetchWorkers()
        fetchDepartments()
      }
    })

    // 监听刷新事件
    const handleRefresh = () => {
      fetchWorkers()
      fetchDepartments()
    }

    onUnmounted(() => {
      window.removeEventListener('refresh-workers', handleRefresh)
    })

    // 过滤工人
    const filteredWorkers = computed(() => 
      props.selectedDepartment === 'all' 
        ? workers.value 
        : workers.value.filter(worker => worker.department === props.selectedDepartment)
    )

    // 按部门分组工人
    const groupedWorkers = computed(() => {
      return filteredWorkers.value.reduce((groups, worker) => {
        const dept = worker.department || '未分配部门'
        if (!groups[dept]) {
          groups[dept] = []
        }
        groups[dept].push(worker)
        return groups
      }, {} as Record<string, WorkerState[]>)
    })

    // 重置表单
    const resetForm = () => {
      formData.value = {
        name: '',
        phone: '',
        departmentId: ''
      }
      editingWorker.value = null
      formErrors.value = {}
    }

    // 跳转到主页面并筛选活跃项目
    const handleJumpToProjects = (workerName: string) => {
      // 关闭工人管理模式，回到主页面的活跃项目视图
      window.dispatchEvent(new CustomEvent('close-worker-management', { 
        detail: { workerName, viewType: 'active' } // 明确指定跳转到活跃项目
      }))
    }

    // 打开新建工人对话框
    const openCreateModal = () => {
      resetForm()
      showModal.value = true
    }

    // 打开编辑工人对话框
    const openEditModal = (worker: WorkerState) => {
      editingWorker.value = worker
      formData.value = {
        name: worker.name,
        phone: worker.phone,
        departmentId: worker.departmentId ? worker.departmentId.toString() : ''
      }
      formErrors.value = {}
      showModal.value = true
    }

    // 处理工人表单提交
    const handleWorkerFormSubmit = async () => {
      try {
        submitLoading.value = true
        
        // 准备提交数据，转换 departmentId 为数字或 null
        const submitData = {
          ...formData.value,
          departmentId: formData.value.departmentId ? parseInt(formData.value.departmentId) : null
        }
        
        let result
        if (editingWorker.value) {
          result = await updateWorker(editingWorker.value.id, submitData)
        } else {
          result = await createWorker(submitData)
        }

        if (result) {
          showModal.value = false
          resetForm()
        } else {
          alert('操作失败，请重试')
        }
      } catch (error) {
        console.error('保存工人数据失败:', error)
        alert('保存失败，请重试')
      } finally {
        submitLoading.value = false
      }
    }

    // 删除工人
    const handleDelete = async (workerId: number, workerName: string) => {
      if (!confirm(`确定要删除工人 "${workerName}" 吗？此操作不可撤销。`)) {
        return
      }

      const success = await deleteWorker(workerId)
      if (!success) {
        alert('删除失败，请重试')
      }
    }


    // 处理表单提交
    const handleFormSubmit = async (formDataFromForm: FormData) => {
      // 从FormData中提取数据并更新状态
      const data = {
        name: formDataFromForm.get('name') as string || '',
        phone: formDataFromForm.get('phone') as string || '',
        departmentId: formDataFromForm.get('departmentId') as string || ''
      }
      
      formData.value = data
      
      // 执行表单验证
      const errors: Record<string, string> = {}
      
      if (!data.name.trim()) {
        errors.name = '工人姓名不能为空'
      }
      
      if (!data.phone.trim()) {
        errors.phone = '手机号不能为空'
      } else if (!/^1[3-9]\d{9}$/.test(data.phone)) {
        errors.phone = '请输入有效的手机号'
      }
      
      formErrors.value = errors
      
      if (Object.keys(errors).length > 0) {
        return
      }
      
      // 提交数据
      await handleWorkerFormSubmit()
    }

    return () => {
      if (loading.value) {
        return (
          <Card class={`flex items-center justify-center h-64 ${props.className}`}>
            <div class="flex items-center space-x-3 text-text-secondary opacity-0" 
                 style={{ animation: 'fadeIn 0.3s ease-out forwards' }}>
              <div class="w-5 h-5 border-2 border-ios18-blue border-t-transparent rounded-full"
                   style={{ animation: 'spin 1s linear infinite' }} />
              <span>加载中...</span>
            </div>
          </Card>
        )
      }

      return (
        <div class={`flex flex-col h-full ${props.className}`}>
          {/* 标题栏 */}
          <Card class="flex-shrink-0" padding="md">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-text-primary">工人管理</h2>
                <p class="text-text-secondary text-sm mt-1">管理工人信息和部门分配</p>
              </div>
              {isAdmin.value && (
                <div class="flex items-center space-x-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateModal}
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    添加工人
                  </Button>
                </div>
              )}
            </div>

            {/* 当前筛选状态 */}
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <span class="text-sm font-medium text-text-secondary">当前筛选:</span>
              <div class="px-3 py-1 bg-ios18-blue/10 text-ios18-blue rounded-full text-sm font-medium">
                {props.selectedDepartment === 'all' ? '全部工人' : props.selectedDepartment}
              </div>
              <span class="text-xs text-gray-500">
                ({filteredWorkers.value.length} 人)
              </span>
            </div>
          </Card>

          {/* 工人列表 - 全高度自适应 */}
          <Card class="flex-1 mt-4 overflow-hidden" padding="none">
            {Object.keys(groupedWorkers.value).length === 0 ? (
              <div class="flex items-center justify-center h-full text-text-secondary opacity-0"
                   style={{ animation: 'fadeInUp 0.4s ease-out forwards' }}>
                <div class="text-center">
                  <div style={{ animation: 'scaleIn 0.3s ease-out 0.1s forwards', transform: 'scale(0.8)', opacity: '0' }}>
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <p class="text-lg font-medium mb-2">
                    {props.selectedDepartment === 'all' ? '暂无工人数据' : `${props.selectedDepartment}部门暂无工人`}
                  </p>
                  <p class="text-sm mb-4">开始添加第一个工人吧</p>
                  {isAdmin.value && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={openCreateModal}
                    >
                      立即添加
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div class="h-full overflow-auto">
                {Object.entries(groupedWorkers.value).map(([departmentName, deptWorkers]) => (
                  <div
                    key={departmentName}
                    class="border-b border-macos15-separator last:border-b-0 opacity-0"
                    style={{ animation: 'fadeInUp 0.3s ease-out forwards' }}
                  >
                    {/* 部门标题 */}
                    <div class="px-6 py-3 bg-macos15-control/20 border-b border-macos15-separator">
                      <h3 class="font-semibold text-text-primary flex items-center">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {departmentName}
                        <span class="ml-2 px-2 py-1 bg-ios18-blue/10 text-ios18-blue rounded-full text-xs">
                          {deptWorkers.length}人
                        </span>
                      </h3>
                    </div>

                    {/* 该部门的工人列表 */}
                    <div class="hidden md:block overflow-x-auto">
                      <Table class="w-full">
                        <TableHeader class="bg-macos15-control/10">
                          <TableRow>
                            <TableCell type="header" class="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">姓名</TableCell>
                            <TableCell type="header" class="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">电话</TableCell>
                            <TableCell type="header" class="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">项目数量</TableCell>
                            {isAdmin.value && (
                              <TableCell type="header" class="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">操作</TableCell>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody class="divide-y divide-macos15-separator">
                          {deptWorkers.map((worker, index) => (
                            <TableRow
                              key={worker.id}
                              animate={true}
                              index={index}
                              class="hover:bg-macos15-control/20 transition-colors"
                            >
                              <TableCell class="px-6 py-4 whitespace-nowrap">
                                <div class="font-medium text-text-primary">{worker.name}</div>
                              </TableCell>
                              <TableCell class="px-6 py-4 whitespace-nowrap text-text-secondary text-sm">
                                {worker.phone}
                              </TableCell>
                              <TableCell class="px-6 py-4 whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleJumpToProjects(worker.name)}
                                  class="inline-flex items-center px-3 py-1 bg-ios18-blue/10 text-ios18-blue rounded-full text-sm font-medium hover:bg-ios18-blue/20 transition-colors"
                                >
                                  {worker.projectCount || 0} 个项目
                                  <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </Button>
                              </TableCell>
                              {isAdmin.value && (
                                <TableCell class="px-6 py-4 whitespace-nowrap text-right text-sm">
                                  <div class="flex justify-end space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditModal(worker)}
                                    >
                                      编辑
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleDelete(worker.id, worker.name)}
                                    >
                                      删除
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* 移动端工人卡片布局 */}
                    <div class="md:hidden space-y-3 p-4">
                      {deptWorkers.map((worker, index) => (
                        <div
                          key={worker.id}
                          class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm opacity-0"
                          style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.1}s forwards` }}
                        >
                          {/* 工人基本信息 */}
                          <div class="flex items-start justify-between mb-3">
                            <div class="flex-1">
                              <h4 class="font-medium text-text-primary text-lg">{worker.name}</h4>
                              <div class="flex items-center mt-1 text-text-secondary text-sm">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L6.964 11.1a13.651 13.651 0 004.236 4.236l1.713-3.26a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {worker.phone}
                              </div>
                            </div>
                          </div>

                          {/* 项目信息和操作 */}
                          <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleJumpToProjects(worker.name)}
                              class="inline-flex items-center px-3 py-2 bg-ios18-blue/10 text-ios18-blue rounded-lg text-sm font-medium hover:bg-ios18-blue/20 transition-colors"
                            >
                              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              {worker.projectCount || 0} 个项目
                            </Button>
                            
                            {isAdmin.value && (
                              <div class="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(worker)}
                                  class="px-3 py-2"
                                >
                                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDelete(worker.id, worker.name)}
                                  class="px-3 py-2"
                                >
                                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 工人表单模态框 */}
          <Transition
            enterActiveClass="transition-opacity duration-200"
            leaveActiveClass="transition-opacity duration-200"
            enterFromClass="opacity-0"
            enterToClass="opacity-100"
            leaveFromClass="opacity-100"
            leaveToClass="opacity-0"
          >
            {showModal.value && (
              <div
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={() => showModal.value = false}
              >
                <div
                  class="w-full max-w-md opacity-0 scale-90 translate-y-5"
                  style={{ animation: 'modalEnter 0.3s ease-out forwards' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Card padding="none" glass>
                    <div class="px-6 py-4 border-b border-macos15-separator">
                      <h3 class="text-lg font-bold text-text-primary">
                        {editingWorker.value ? '编辑工人' : '添加工人'}
                      </h3>
                    </div>

                    <Form onSubmit={handleFormSubmit} class="p-6 space-y-4">
                      <FormField label="姓名" required error={formErrors.value.name}>
                        <Input
                          name="name"
                          value={formData.value.name}
                          onChange={(e) => formData.value.name = e.target.value}
                          placeholder="请输入工人姓名"
                          required
                        />
                      </FormField>

                      <FormField label="手机号" required error={formErrors.value.phone}>
                        <Input
                          name="phone"
                          type="tel"
                          value={formData.value.phone}
                          onChange={(e) => formData.value.phone = e.target.value}
                          placeholder="请输入手机号"
                          required
                        />
                      </FormField>

                      <FormField label="部门">
                        <select
                          name="departmentId"
                          value={formData.value.departmentId}
                          onChange={(e) => formData.value.departmentId = e.target.value}
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ios18-blue focus:border-transparent"
                        >
                          <option value="">请选择部门（可选）</option>
                          {departments.value.map((dept: DepartmentState) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name} ({dept.workerCount}人)
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormActions align="right">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => showModal.value = false}
                        >
                          取消
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          loading={submitLoading.value}
                        >
                          {editingWorker.value ? '更新' : '创建'}
                        </Button>
                      </FormActions>
                    </Form>
                  </Card>
                </div>
              </div>
            )}
          </Transition>

          {/* CSS动画样式 */}
          <style jsx>{`
            @keyframes fadeIn {
              to { opacity: 1; }
            }
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes scaleIn {
              to { opacity: 1; transform: scale(1); }
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            @keyframes modalEnter {
              to { 
                opacity: 1; 
                transform: scale(1) translateY(0); 
              }
            }
          `}</style>
        </div>
      )
    }
  }
})

export default WorkerManagement