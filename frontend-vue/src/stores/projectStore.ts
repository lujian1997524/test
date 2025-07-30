import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sseManager } from '../utils/sseManager.ts'
import { apiRequest, authenticatedRequest } from '@/utils/apiRequest'

// 材料状态类型
export interface MaterialState {
  id: number
  projectId: number
  thicknessSpecId: number
  status: 'empty' | 'pending' | 'in_progress' | 'completed'
  startDate?: string
  completedDate?: string
  completedBy?: number
  notes?: string
  thicknessSpec?: {
    id: number
    thickness: string
    unit: string
    materialType: string
  }
}

// 项目状态类型
export interface ProjectState {
  id: number
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  assignedWorkerId?: number
  createdBy: number
  createdAt: string
  updatedAt: string
  description?: string // 项目描述/备注
  // 扩展属性
  assignedWorker?: {
    id: number
    name: string
  }
  materials?: MaterialState[]
  drawings?: any[]
}

// 获取认证token的辅助函数
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

// 防抖函数
let refreshTimer: NodeJS.Timeout | null = null
const debouncedRefresh = (fetchProjects: () => Promise<void>) => {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }
  refreshTimer = setTimeout(() => {
    fetchProjects().catch(() => {
      // 防抖刷新失败，静默处理
    })
  }, 300) // 300ms防抖
}

export const useProjectStore = defineStore('project', () => {
  // 状态
  const projects = ref<ProjectState[]>([])
  const completedProjects = ref<ProjectState[]>([])
  const pastProjects = ref<ProjectState[]>([])
  const pastProjectsByMonth = ref<Record<string, ProjectState[]>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref(0)
  const sseListenersSetup = ref(false)
  const _sseHandlers = ref<{[key: string]: (data: any) => void} | undefined>(undefined)
  const isOptimisticUpdating = ref(false)

  // 计算属性
  const getProjectById = computed(() => (id: number) => {
    return projects.value.find(p => p.id === id) || 
           completedProjects.value.find(p => p.id === id) ||
           pastProjects.value.find(p => p.id === id)
  })

  // 获取项目列表
  const fetchProjects = async () => {
    loading.value = true
    error.value = null
    
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }
      const response = await authenticatedRequest('/api/projects', token)
      
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`获取项目列表失败: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      const projectList = data.projects || []
      
      projects.value = projectList
      loading.value = false
      lastUpdated.value = Date.now()
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      loading.value = false
    }
  }

  // 获取已完成任务列表
  const fetchCompletedProjects = async (workerName?: string) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }
      
      const params = new URLSearchParams()
      if (workerName) {
        params.append('workerName', workerName)
      }
      
      const url = `/api/projects/completed${params.toString() ? '?' + params.toString() : ''}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('获取已完成任务失败')
      }
      
      const data = await response.json()
      const completedProjectList = data.projects || []
      
      completedProjects.value = completedProjectList
      loading.value = false
      lastUpdated.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取已完成任务失败'
      loading.value = false
    }
  }

  // 获取过往项目
  const fetchPastProjects = async (year?: number, month?: number) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }
      
      const params = new URLSearchParams()
      if (year) params.append('year', year.toString())
      if (month) params.append('month', month.toString())
      
      const url = `/api/projects/past${params.toString() ? '?' + params.toString() : ''}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('获取过往项目失败')
      }
      
      const data = await response.json()
      
      // 处理不同的返回格式
      let pastProjectList: ProjectState[] = []
      let grouped: Record<string, ProjectState[]> = {}
      
      if (data.projectsByMonth) {
        // 按月分组的数据格式
        grouped = data.projectsByMonth
        // 展平所有项目到单一数组
        pastProjectList = Object.values(grouped).flat() as ProjectState[]
      } else if (data.projects) {
        // 直接项目数组格式
        pastProjectList = data.projects || []
        // 按月份分组
        pastProjectList.forEach((project: any) => {
          const date = new Date(project.movedToPastAt || project.createdAt)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          if (!grouped[monthKey]) {
            grouped[monthKey] = []
          }
          grouped[monthKey].push(project)
        })
      }
      
      pastProjects.value = pastProjectList
      pastProjectsByMonth.value = grouped
      loading.value = false
      lastUpdated.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取过往项目失败'
      loading.value = false
    }
  }

  // 创建项目
  const createProject = async (projectData: Partial<ProjectState>): Promise<ProjectState | null> => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }

      const response = await authenticatedRequest('/api/projects', token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        throw new Error('创建项目失败')
      }

      const data = await response.json()
      const newProject = data.project

      // 立即添加到本地状态以确保即时显示
      // addProject函数有重复检查，所以即使SSE事件也触发添加也不会重复
      addProject(newProject)
      
      lastUpdated.value = Date.now()

      return newProject
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建项目失败'
      return null
    }
  }

  // 更新项目
  const updateProject = async (
    id: number, 
    updates: Partial<ProjectState>, 
    options?: { silent?: boolean }
  ): Promise<ProjectState | null> => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }

      const response = await authenticatedRequest(`/api/projects/${id}`, token, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('更新项目失败')
      }

      const data = await response.json()
      const updatedProject = data.project

      // 更新状态中的项目
      updateProjectInStore(id, updatedProject)
      lastUpdated.value = Date.now()

      if (!options?.silent) {
        // 触发数据更新事件
        window.dispatchEvent(new CustomEvent('project-updated', { 
          detail: { project: updatedProject } 
        }))
      }

      return updatedProject
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新项目失败'
      return null
    }
  }

  // 删除项目
  const deleteProject = async (id: number): Promise<boolean> => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }

      const response = await authenticatedRequest(`/api/projects/${id}`, token, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('删除项目失败')
      }

      // 从状态中移除项目
      removeProject(id)
      lastUpdated.value = Date.now()

      // 触发数据更新事件
      window.dispatchEvent(new CustomEvent('project-deleted', { 
        detail: { projectId: id } 
      }))

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除项目失败'
      return false
    }
  }

  // 移动到过往项目
  const moveToPastProject = async (id: number): Promise<boolean> => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }

      const response = await fetch(`http://110.40.71.83:35001/api/projects/${id}/move-to-past`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('移动到过往项目失败')
      }

      // 从当前项目中移除，添加到过往项目
      const project = projects.value.find(p => p.id === id)
      if (project) {
        removeProject(id)
        pastProjects.value.unshift(project)
      }

      lastUpdated.value = Date.now()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '移动到过往项目失败'
      return false
    }
  }

  // 从过往项目恢复
  const restoreFromPastProject = async (id: number): Promise<boolean> => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }

      const response = await fetch(`http://110.40.71.83:35001/api/projects/${id}/restore-from-past`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('从过往项目恢复失败')
      }

      // 从过往项目中移除，添加到当前项目
      const project = pastProjects.value.find(p => p.id === id)
      if (project) {
        pastProjects.value = pastProjects.value.filter(p => p.id !== id)
        projects.value.unshift(project)
      }

      lastUpdated.value = Date.now()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '从过往项目恢复失败'
      return false
    }
  }

  // SSE相关方法
  const setupSSEListeners = () => {
    if (sseListenersSetup.value) {
      return
    }

    const handlers = {
      'project-created': (data: any) => {
        if (data.project) {
          addProject(data.project)
        }
      },
      
      'project-updated': (data: any) => {
        if (data.project) {
          updateProjectInStore(data.project.id, data.project)
        }
      },
      
      'project-deleted': (data: any) => {
        if (data.projectId) {
          removeProject(data.projectId)
        }
      },
      
      'material-status-changed': (data: any) => {
        if (data.projectId) {
          debouncedRefresh(fetchProjects)
        }
      }
    }

    // 添加事件监听器
    Object.entries(handlers).forEach(([event, handler]) => {
      sseManager.addEventListener(event, handler)
    })

    _sseHandlers.value = handlers
    sseListenersSetup.value = true
  }

  const cleanupSSEListeners = () => {
    if (!sseListenersSetup.value || !_sseHandlers.value) {
      return
    }
    
    Object.entries(_sseHandlers.value).forEach(([event, handler]) => {
      sseManager.removeEventListener(event, handler)
    })

    _sseHandlers.value = undefined
    sseListenersSetup.value = false
  }

  // 内部方法
  const setProjects = (projectList: ProjectState[]) => {
    projects.value = projectList
  }

  const addProject = (project: ProjectState) => {
    // 检查是否已存在相同ID的项目，避免重复添加
    const existingIndex = projects.value.findIndex(p => p.id === project.id)
    if (existingIndex === -1) {
      projects.value.unshift(project)
    }
  }

  const updateProjectInStore = (id: number, updates: Partial<ProjectState>) => {
    // 更新active projects
    const activeIndex = projects.value.findIndex(p => p.id === id)
    if (activeIndex !== -1) {
      projects.value[activeIndex] = { ...projects.value[activeIndex], ...updates }
    }
    
    // 更新completed projects  
    const completedIndex = completedProjects.value.findIndex(p => p.id === id)
    if (completedIndex !== -1) {
      completedProjects.value[completedIndex] = { ...completedProjects.value[completedIndex], ...updates }
    }
    
    // 更新past projects
    const pastIndex = pastProjects.value.findIndex(p => p.id === id)
    if (pastIndex !== -1) {
      pastProjects.value[pastIndex] = { ...pastProjects.value[pastIndex], ...updates }
    }
  }

  const optimisticUpdateMaterialStatus = (
    projectId: number, 
    materialId: number, 
    newStatus: 'empty' | 'pending' | 'in_progress' | 'completed', 
    user?: { id: number; name: string }
  ) => {
    isOptimisticUpdating.value = true
    
    const project = projects.value.find(p => p.id === projectId)
    if (project && project.materials) {
      const material = project.materials.find(m => m.id === materialId)
      if (material) {
        material.status = newStatus
        if (newStatus === 'in_progress') {
          material.startDate = new Date().toISOString()
        } else if (newStatus === 'completed') {
          material.completedDate = new Date().toISOString()
          material.completedBy = user?.id
        }
      }
    }
  }

  const setOptimisticUpdating = (updating: boolean) => {
    isOptimisticUpdating.value = updating
  }

  const removeProject = (id: number) => {
    projects.value = projects.value.filter(p => p.id !== id)
    completedProjects.value = completedProjects.value.filter(p => p.id !== id)
    pastProjects.value = pastProjects.value.filter(p => p.id !== id)
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  return {
    // 状态
    projects,
    completedProjects,
    pastProjects,
    pastProjectsByMonth,
    loading,
    error,
    lastUpdated,
    sseListenersSetup,
    isOptimisticUpdating,
    
    // 计算属性
    getProjectById,
    
    // 方法
    fetchProjects,
    fetchCompletedProjects,
    fetchPastProjects,
    createProject,
    updateProject,
    deleteProject,
    moveToPastProject,
    restoreFromPastProject,
    setupSSEListeners,
    cleanupSSEListeners,
    setProjects,
    addProject,
    updateProjectInStore,
    optimisticUpdateMaterialStatus,
    setOptimisticUpdating,
    removeProject,
    setLoading,
    setError
  }
})