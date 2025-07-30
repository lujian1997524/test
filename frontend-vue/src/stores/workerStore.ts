import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authenticatedRequest } from '@/utils/apiRequest'

// 工人类型
export interface WorkerState {
  id: number
  name: string
  phone: string
  department: string
  departmentId?: number
  status: string
  projectCount?: number
  createdAt: string
  updatedAt: string
}

// 部门类型
export interface DepartmentState {
  id: number
  name: string
  description?: string
  isActive: boolean
  sortOrder: number
  workerCount: number
  createdAt: string
  updatedAt: string
}

// 获取认证token的辅助函数
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export const useWorkerStore = defineStore('worker', () => {
  // 状态
  const workers = ref<WorkerState[]>([])
  const departments = ref<DepartmentState[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref(0)

  // 计算属性
  const workersByDepartment = computed(() => {
    const grouped: Record<string, WorkerState[]> = {}
    workers.value.forEach(worker => {
      const dept = worker.department || '未分配'
      if (!grouped[dept]) {
        grouped[dept] = []
      }
      grouped[dept].push(worker)
    })
    return grouped
  })

  const getDepartmentById = computed(() => (id: number) => {
    return departments.value.find(d => d.id === id)
  })

  // 获取工人列表
  const fetchWorkers = async (departmentFilter?: string) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }
      
      const params = new URLSearchParams()
      if (departmentFilter && departmentFilter !== 'all') {
        params.append('department', departmentFilter)
      }
      
      const url = `/api/workers${params.toString() ? '?' + params.toString() : ''}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`获取工人列表失败: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      const workerList = data.workers || []
      
      workers.value = workerList
      loading.value = false
      lastUpdated.value = Date.now()
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      loading.value = false
    }
  }

  // 获取部门列表
  const fetchDepartments = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }
      
      const response = await authenticatedRequest('/api/departments', token, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`获取部门列表失败: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      const departmentList = data.departments || []
      
      departments.value = departmentList
      lastUpdated.value = Date.now()
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取部门失败'
    }
  }

  // 创建工人
  const createWorker = async (workerData: Partial<WorkerState>): Promise<WorkerState | null> => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }

      const response = await authenticatedRequest('/api/workers', token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(workerData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '创建工人失败')
      }

      const data = await response.json()
      const newWorker = data.worker

      // 添加到状态中
      workers.value.unshift(newWorker)
      lastUpdated.value = Date.now()

      return newWorker
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建工人失败'
      return null
    }
  }

  // 更新工人
  const updateWorker = async (id: number, updates: Partial<WorkerState>): Promise<WorkerState | null> => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }

      const response = await fetch(`http://110.40.71.83:35001/api/workers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '更新工人失败')
      }

      const data = await response.json()
      const updatedWorker = data.worker

      // 更新状态中的工人
      const index = workers.value.findIndex(w => w.id === id)
      if (index !== -1) {
        workers.value[index] = updatedWorker
      }
      lastUpdated.value = Date.now()

      return updatedWorker
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新工人失败'
      return null
    }
  }

  // 删除工人
  const deleteWorker = async (id: number): Promise<boolean> => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }

      const response = await fetch(`http://110.40.71.83:35001/api/workers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '删除工人失败')
      }

      // 从状态中移除工人
      workers.value = workers.value.filter(w => w.id !== id)
      lastUpdated.value = Date.now()

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除工人失败'
      return false
    }
  }

  // 创建部门
  const createDepartment = async (departmentData: Partial<DepartmentState>): Promise<DepartmentState | null> => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }

      const response = await authenticatedRequest('/api/departments', token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(departmentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '创建部门失败')
      }

      const data = await response.json()
      const newDepartment = data.department

      // 添加到状态中
      departments.value.push(newDepartment)
      lastUpdated.value = Date.now()

      return newDepartment
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建部门失败'
      return null
    }
  }

  // 更新部门
  const updateDepartment = async (id: number, updates: Partial<DepartmentState>): Promise<DepartmentState | null> => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }

      const response = await fetch(`http://110.40.71.83:35001/api/departments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '更新部门失败')
      }

      const data = await response.json()
      const updatedDepartment = data.department

      // 更新状态中的部门
      const index = departments.value.findIndex(d => d.id === id)
      if (index !== -1) {
        departments.value[index] = updatedDepartment
      }
      lastUpdated.value = Date.now()

      return updatedDepartment
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新部门失败'
      return null
    }
  }

  // 删除部门
  const deleteDepartment = async (id: number): Promise<boolean> => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }

      const response = await fetch(`http://110.40.71.83:35001/api/departments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '删除部门失败')
      }

      // 从状态中移除部门
      departments.value = departments.value.filter(d => d.id !== id)
      lastUpdated.value = Date.now()

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除部门失败'
      return false
    }
  }

  return {
    // 状态
    workers,
    departments,
    loading,
    error,
    lastUpdated,
    
    // 计算属性
    workersByDepartment,
    getDepartmentById,
    
    // 方法
    fetchWorkers,
    fetchDepartments,
    createWorker,
    updateWorker,
    deleteWorker,
    createDepartment,
    updateDepartment,
    deleteDepartment
  }
})