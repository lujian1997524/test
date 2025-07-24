import { create } from 'zustand';
import { sseManager } from '@/utils/sseManager';

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

// 防抖函数
let refreshTimer: NodeJS.Timeout | null = null;
const debouncedRefresh = (fetchProjects: () => Promise<void>) => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  refreshTimer = setTimeout(() => {
    console.log('🔄 执行防抖刷新...');
    fetchProjects();
  }, 300); // 300ms防抖
};

// 项目Store接口
interface ProjectStore {
  // 状态
  projects: ProjectState[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  sseListenersSetup: boolean; // 添加标志位防止重复设置
  _sseHandlers?: { [key: string]: (data: any) => void }; // 内部存储监听器引用

  // 操作方法
  fetchProjects: () => Promise<void>;
  createProject: (projectData: Partial<ProjectState>) => Promise<ProjectState | null>;
  updateProject: (id: number, updates: Partial<ProjectState>) => Promise<ProjectState | null>;
  deleteProject: (id: number) => Promise<boolean>;
  getProjectById: (id: number) => ProjectState | undefined;
  
  // SSE相关方法
  setupSSEListeners: () => void;
  cleanupSSEListeners: () => void;
  
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
  sseListenersSetup: false, // 初始化标志位
  _sseHandlers: undefined, // 初始化监听器引用存储

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

  // 设置SSE事件监听器
  setupSSEListeners: () => {
    const state = get();
    if (state.sseListenersSetup) {
      console.log('🔄 SSE监听器已设置，跳过重复设置');
      return;
    }

    console.log('🎧 设置SSE事件监听器...');
    
    // 先清理可能存在的旧监听器
    get().cleanupSSEListeners();
    
    // 监听项目创建事件
    const projectCreatedHandler = (data: any) => {
      console.log('🆕 收到项目创建事件:', data);
      if (data.project) {
        // 检查项目是否已存在，如果不存在才添加
        const existingProject = get().projects.find(p => p.id === data.project.id);
        if (!existingProject) {
          get().addProject(data.project);
          // 触发状态更新强制刷新UI
          set({ lastUpdated: Date.now() });
        } else {
          console.log('🔄 项目已存在，跳过添加:', data.project.id);
        }
        // 使用防抖刷新数据确保一致性
        debouncedRefresh(get().fetchProjects);
      }
    };

    // 监听项目更新事件
    const projectUpdatedHandler = (data: any) => {
      console.log('📝 收到项目更新事件:', data);
      if (data.project) {
        get().updateProjectInStore(data.project.id, data.project);
        // 触发状态更新强制刷新UI
        set({ lastUpdated: Date.now() });
        // 使用防抖刷新数据确保一致性
        debouncedRefresh(get().fetchProjects);
      }
    };

    // 监听项目状态变更事件
    const projectStatusChangedHandler = (data: any) => {
      console.log('🔄 收到项目状态变更事件:', data);
      if (data.project) {
        get().updateProjectInStore(data.project.id, data.project);
        // 触发状态更新强制刷新UI
        set({ lastUpdated: Date.now() });
        // 使用防抖刷新数据确保一致性
        debouncedRefresh(get().fetchProjects);
      }
    };

    // 监听项目删除事件
    const projectDeletedHandler = (data: any) => {
      console.log('🗑️ 收到项目删除事件:', data);
      if (data.projectId) {
        get().removeProject(data.projectId);
        // 触发状态更新强制刷新UI
        set({ lastUpdated: Date.now() });
        // 通知主页面如果删除的是当前选中的项目需要取消选择
        window.dispatchEvent(new CustomEvent('project-deleted-sse', { 
          detail: { id: data.projectId } 
        }));
        // 使用防抖刷新数据确保一致性
        debouncedRefresh(get().fetchProjects);
      }
    };

    // 监听板材状态变更事件（不显示通知，但更新数据）
    const materialStatusChangedHandler = (data: any) => {
      console.log('🔧 收到板材状态变更事件:', data);
      if (data.projectId) {
        // 触发项目数据刷新以更新相关统计
        set({ lastUpdated: Date.now() });
        // 使用防抖刷新数据
        debouncedRefresh(get().fetchProjects);
        
        // 触发材料更新事件，通知其他组件
        window.dispatchEvent(new CustomEvent('materials-updated', { 
          detail: { 
            projectId: data.projectId, 
            materialId: data.material?.id,
            oldStatus: data.oldStatus,
            newStatus: data.newStatus 
          } 
        }));
      }
    };

    // 监听批量板材状态变更事件（不显示通知，但更新数据）
    const materialBatchStatusChangedHandler = (data: any) => {
      console.log('🔧 收到批量板材状态变更事件:', data);
      // 触发项目数据刷新
      set({ lastUpdated: Date.now() });
      // 使用防抖刷新数据
      debouncedRefresh(get().fetchProjects);
      
      // 触发材料更新事件
      window.dispatchEvent(new CustomEvent('materials-updated', { 
        detail: { 
          batchUpdate: true,
          materialIds: data.materialIds,
          status: data.status,
          updatedCount: data.updatedCount
        } 
      }));
    };
    // 注册事件监听器
    sseManager.addEventListener('project-created', projectCreatedHandler);
    sseManager.addEventListener('project-updated', projectUpdatedHandler);
    sseManager.addEventListener('project-status-changed', projectStatusChangedHandler);
    sseManager.addEventListener('project-deleted', projectDeletedHandler);
    sseManager.addEventListener('material-status-changed', materialStatusChangedHandler);
    sseManager.addEventListener('material-batch-status-changed', materialBatchStatusChangedHandler);

    // 保存监听器引用以便清理
    set({ 
      sseListenersSetup: true,
      _sseHandlers: {
        'project-created': projectCreatedHandler,
        'project-updated': projectUpdatedHandler,
        'project-status-changed': projectStatusChangedHandler,
        'project-deleted': projectDeletedHandler,
        'material-status-changed': materialStatusChangedHandler,
        'material-batch-status-changed': materialBatchStatusChangedHandler
      }
    });
  },

  // 清理SSE事件监听器
  cleanupSSEListeners: () => {
    const state = get();
    if (state._sseHandlers) {
      console.log('🧹 清理SSE事件监听器...');
      Object.entries(state._sseHandlers).forEach(([eventType, handler]) => {
        sseManager.removeEventListener(eventType as any, handler);
      });
    }
    set({ sseListenersSetup: false, _sseHandlers: undefined });
  },

  // 内部状态管理方法
  setProjects: (projects) => set({ projects, lastUpdated: Date.now() }),
  
  addProject: (project) => {
    console.log('📋 Zustand addProject被调用:', project);
    set(state => {
      const newProjects = [...state.projects, project];
      const newState = {
        projects: newProjects,
        lastUpdated: Date.now()
      };
      console.log('📋 Zustand项目数量:', state.projects.length, '->', newState.projects.length);
      console.log('📋 Zustand lastUpdated:', newState.lastUpdated);
      return newState;
    });
  },
  
  updateProjectInStore: (id, updates) => {
    console.log('📝 Zustand updateProjectInStore被调用:', id, updates);
    set(state => {
      const newState = {
        projects: state.projects.map(p => 
          p.id === id ? { ...p, ...updates } : p
        ),
        lastUpdated: Date.now()
      };
      console.log('📝 Zustand项目更新完成，项目数量:', newState.projects.length);
      return newState;
    });
  },
  
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