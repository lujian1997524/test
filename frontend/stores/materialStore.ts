import { create } from 'zustand';

// 获取认证token的辅助函数
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

// 材料状态类型
interface MaterialState {
  id: number;
  project_id: number;
  thickness_spec_id: number;
  status: 'pending' | 'in_progress' | 'completed';
  start_date?: string;
  completed_date?: string;
  completed_by?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  thickness_spec?: {
    id: number;
    thickness: number;
    unit: string;
    material_type: string;
  };
  completed_by_user?: {
    id: number;
    name: string;
  };
}

// 材料Store接口
interface MaterialStore {
  // 状态
  materials: MaterialState[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;

  // 操作方法
  fetchMaterials: (projectId?: number) => Promise<void>;
  updateMaterialStatus: (id: number, status: MaterialState['status'], additionalData?: any) => Promise<MaterialState | null>;
  getMaterialsByProject: (projectId: number) => MaterialState[];
  
  // 内部方法
  setMaterials: (materials: MaterialState[]) => void;
  updateMaterialInStore: (id: number, updates: Partial<MaterialState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// 创建材料Store
export const useMaterialStore = create<MaterialStore>((set, get) => ({
  // 初始状态
  materials: [],
  loading: false,
  error: null,
  lastUpdated: 0,

  // 获取材料列表
  fetchMaterials: async (projectId) => {
    set({ loading: true, error: null });
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('未找到认证令牌');
      }
      
      // 使用正确的API端点
      const url = projectId ? `/api/materials/project/${projectId}` : '/api/materials/stats';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('获取材料列表失败');
      }
      
      const data = await response.json();
      const materials = data.materials || []; // 从响应中提取materials数组
      
      set({ 
        materials, 
        loading: false, 
        lastUpdated: Date.now() 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '未知错误',
        loading: false 
      });
    }
  },

  // 更新材料状态
  updateMaterialStatus: async (id, status, additionalData = {}) => {
    set({ loading: true, error: null });
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('未找到认证令牌');
      }
      
      const updateData = {
        status,
        ...additionalData
      };

      // 根据状态自动设置日期
      if (status === 'in_progress' && !updateData.start_date) {
        updateData.start_date = new Date().toISOString().split('T')[0];
      }
      
      if (status === 'completed' && !updateData.completed_date) {
        updateData.completed_date = new Date().toISOString().split('T')[0];
      }

      const response = await fetch(`/api/materials/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新材料状态失败');
      }
      
      const data = await response.json();
      const updatedMaterial = data.material; // 从响应中提取material对象
      
      // 更新本地状态
      set(state => ({
        materials: state.materials.map(m => 
          m.id === id ? { ...m, ...updatedMaterial } : m
        ),
        loading: false,
        lastUpdated: Date.now()
      }));
      
      // 通知其他组件更新
      window.dispatchEvent(new CustomEvent('material-updated', { 
        detail: { id, updates: updatedMaterial } 
      }));
      
      return updatedMaterial;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '更新材料状态失败',
        loading: false 
      });
      return null;
    }
  },

  // 根据项目ID获取材料
  getMaterialsByProject: (projectId) => {
    return get().materials.filter(m => m.project_id === projectId);
  },

  // 内部状态管理方法
  setMaterials: (materials) => set({ materials, lastUpdated: Date.now() }),
  
  updateMaterialInStore: (id, updates) => set(state => ({ 
    materials: state.materials.map(m => 
      m.id === id ? { ...m, ...updates } : m
    ),
    lastUpdated: Date.now()
  })),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));