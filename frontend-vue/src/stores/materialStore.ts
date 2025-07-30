import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 获取认证token的辅助函数
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

// 材料状态类型
interface MaterialState {
  id: number
  project_id: number
  thickness_spec_id: number
  status: 'pending' | 'in_progress' | 'completed'
  start_date?: string
  completed_date?: string
  completed_by?: number
  notes?: string
  created_at: string
  updated_at: string
  // 关联数据
  thickness_spec?: {
    id: number
    thickness: number
    unit: string
    material_type: string
  }
  completed_by_user?: {
    id: number
    name: string
  }
}

export const useMaterialStore = defineStore('material', () => {
  // 状态
  const materials = ref<MaterialState[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref(0)

  // 计算属性
  const getMaterialsByProject = computed(() => (projectId: number) => {
    return materials.value.filter(m => m.project_id === projectId)
  })

  // 获取材料列表
  const fetchMaterials = async (projectId?: number) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }
      
      // 使用正确的API端点
      const url = projectId ? `/api/materials/project/${projectId}` : '/api/materials/stats'
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('获取材料列表失败')
      }
      
      const data = await response.json()
      const materialList = data.materials || [] // 从响应中提取materials数组
      
      materials.value = materialList
      loading.value = false
      lastUpdated.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      loading.value = false
    }
  }

  // 更新材料状态
  const updateMaterialStatus = async (
    id: number, 
    status: MaterialState['status'], 
    additionalData: any = {}
  ): Promise<MaterialState | null> => {
    loading.value = true
    error.value = null
    
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('未找到认证令牌')
      }
      
      const updateData = {
        status,
        ...additionalData
      }

      // 根据状态自动设置日期
      if (status === 'in_progress' && !updateData.start_date) {
        updateData.start_date = new Date().toISOString().split('T')[0]
      }
      
      if (status === 'completed' && !updateData.completed_date) {
        updateData.completed_date = new Date().toISOString().split('T')[0]
      }

      const response = await fetch(`http://110.40.71.83:35001/api/materials/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '更新材料状态失败')
      }
      
      const data = await response.json()
      const updatedMaterial = data.material // 从响应中提取material对象
      
      // 更新本地状态
      updateMaterialInStore(id, updatedMaterial)
      loading.value = false
      lastUpdated.value = Date.now()
      
      // 通知其他组件更新
      window.dispatchEvent(new CustomEvent('material-status-changed', { 
        detail: { id, updates: updatedMaterial } 
      }))
      
      return updatedMaterial
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新材料状态失败'
      loading.value = false
      return null
    }
  }

  // 内部方法
  const setMaterials = (materialList: MaterialState[]) => {
    materials.value = materialList
    lastUpdated.value = Date.now()
  }
  
  const updateMaterialInStore = (id: number, updates: Partial<MaterialState>) => {
    materials.value = materials.value.map(m => 
      m.id === id ? { ...m, ...updates } : m
    )
    lastUpdated.value = Date.now()
  }
  
  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }
  
  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  return {
    // 状态
    materials,
    loading,
    error,
    lastUpdated,
    
    // 计算属性
    getMaterialsByProject,
    
    // 方法
    fetchMaterials,
    updateMaterialStatus,
    setMaterials,
    updateMaterialInStore,
    setLoading,
    setError
  }
})