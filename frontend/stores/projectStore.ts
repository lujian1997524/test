import { create } from 'zustand';

// 材料状态类型
interface MaterialState {
  id: number;
  projectId: number;
  thicknessSpecId: number;
  status: 'pending' | 'in_progress' | 'completed';
  startDate?: string;
  completedDate?: string;
  completedBy?: number;
  notes?: string;
  thicknessSpec?: {
    id: number;
    thickness: string;
    unit: string;
    materialType: string;
  };
}

// 项目状态类型
interface ProjectState {
  id: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assigned_worker_id?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  // 扩展属性
  assignedWorker?: {
    id: number;
    name: string;
  };
  materials?: MaterialState[];
  drawings?: any[];
}

// 获取认证token的辅助函数
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

// 项目Store接口
interface ProjectStore {
  // 状态
  projects: ProjectState[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;

  // 操作方法
  fetchProjects: () => Promise<void>;
  createProject: (projectData: Partial<ProjectState>) => Promise<ProjectState | null>;
  updateProject: (id: number, updates: Partial<ProjectState>) => Promise<ProjectState | null>;
  deleteProject: (id: number) => Promise<boolean>;
  getProjectById: (id: number) => ProjectState | undefined;
  
  // 内部方法
  setProjects: (projects: ProjectState[]) => void;
  addProject: (project: ProjectState) => void;
  updateProjectInStore: (id: number, updates: Partial<ProjectState>) => void;
  removeProject: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// 创建项目Store
export const useProjectStore = create<ProjectStore>((set, get) => ({
  // 初始状态
  projects: [],
  loading: false,
  error: null,
  lastUpdated: 0,

  // 获取所有项目
  fetchProjects: async () => {
    set({ loading: true, error: null });
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('未找到认证令牌');
      }
      
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('获取项目列表失败');
      }
      
      const data = await response.json();
      const projects = data.projects || []; // 从响应中提取projects数组
      
      set({ 
        projects, 
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

  // 创建新项目
  createProject: async (projectData) => {
    set({ loading: true, error: null });
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('未找到认证令牌');
      }
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });
      
      if (!response.ok) {
        throw new Error('创建项目失败');
      }
      
      const data = await response.json();
      const newProject = data.project; // 从响应中提取project对象
      
      // 更新本地状态
      set(state => ({
        projects: [...state.projects, newProject],
        loading: false,
        lastUpdated: Date.now()
      }));
      
      // 通知其他组件更新
      window.dispatchEvent(new CustomEvent('project-created', { 
        detail: newProject 
      }));
      
      return newProject;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '创建项目失败',
        loading: false 
      });
      return null;
    }
  },

  // 更新项目
  updateProject: async (id, updates) => {
    set({ loading: true, error: null });
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('未找到认证令牌');
      }
      
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('更新项目失败');
      }
      
      const data = await response.json();
      const updatedProject = data.project; // 从响应中提取project对象
      
      // 更新本地状态
      set(state => ({
        projects: state.projects.map(p => 
          p.id === id ? { ...p, ...updatedProject } : p
        ),
        loading: false,
        lastUpdated: Date.now()
      }));
      
      // 通知其他组件更新
      window.dispatchEvent(new CustomEvent('project-updated', { 
        detail: { id, updates: updatedProject } 
      }));
      
      return updatedProject;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '更新项目失败',
        loading: false 
      });
      return null;
    }
  },

  // 删除项目
  deleteProject: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('未找到认证令牌');
      }
      
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('删除项目失败');
      }
      
      // 更新本地状态
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        loading: false,
        lastUpdated: Date.now()
      }));
      
      // 通知其他组件更新
      window.dispatchEvent(new CustomEvent('project-deleted', { 
        detail: { id } 
      }));
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '删除项目失败',
        loading: false 
      });
      return false;
    }
  },

  // 根据ID获取项目
  getProjectById: (id) => {
    return get().projects.find(p => p.id === id);
  },

  // 内部状态管理方法
  setProjects: (projects) => set({ projects, lastUpdated: Date.now() }),
  
  addProject: (project) => set(state => ({ 
    projects: [...state.projects, project],
    lastUpdated: Date.now()
  })),
  
  updateProjectInStore: (id, updates) => set(state => ({ 
    projects: state.projects.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ),
    lastUpdated: Date.now()
  })),
  
  removeProject: (id) => set(state => ({ 
    projects: state.projects.filter(p => p.id !== id),
    lastUpdated: Date.now()
  })),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

// 添加事件监听器，当材料更新时刷新项目数据
if (typeof window !== 'undefined') {
  window.addEventListener('materials-updated', () => {
    const store = useProjectStore.getState();
    store.fetchProjects();
  });
}