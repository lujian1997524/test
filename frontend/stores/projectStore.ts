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
  completedProjects: ProjectState[];
  pastProjects: ProjectState[];
  pastProjectsByMonth: Record<string, ProjectState[]>;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  sseListenersSetup: boolean;
  _sseHandlers?: { [key: string]: (data: any) => void };

  // 操作方法
  fetchProjects: () => Promise<void>;
  fetchCompletedProjects: (workerName?: string) => Promise<void>;
  fetchPastProjects: (year?: number, month?: number) => Promise<void>;
  createProject: (projectData: Partial<ProjectState>) => Promise<ProjectState | null>;
  updateProject: (id: number, updates: Partial<ProjectState>) => Promise<ProjectState | null>;
  deleteProject: (id: number) => Promise<boolean>;
  moveToPastProject: (id: number) => Promise<boolean>;
  restoreFromPastProject: (id: number) => Promise<boolean>;
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
  completedProjects: [],
  pastProjects: [],
  pastProjectsByMonth: {},
  loading: false,
  error: null,
  lastUpdated: 0,
  sseListenersSetup: false,
  _sseHandlers: undefined,

  // 获取项目列表
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
      const projects = data.projects || [];
      
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

  // 获取已完成任务列表
  fetchCompletedProjects: async (workerName) => {
    set({ loading: true, error: null });
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('未找到认证令牌');
      }
      
      const params = new URLSearchParams();
      if (workerName) {
        params.append('workerName', workerName);
      }
      
      const url = `/api/projects/completed${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('获取已完成任务失败');
      }
      
      const data = await response.json();
      const completedProjects = data.projects || [];
      
      set({ 
        completedProjects, 
        loading: false, 
        lastUpdated: Date.now() 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '获取已完成任务失败',
        loading: false 
      });
    }
  },

  // 获取过往项目列表
  fetchPastProjects: async (year, month) => {
    set({ loading: true, error: null });
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('未找到认证令牌');
      }
      
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (month) params.append('month', month.toString());
      
      const url = `/api/projects/past${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('获取过往项目失败');
      }
      
      const data = await response.json();
      
      if (year && month) {
        // 如果指定了年月，返回项目列表
        const pastProjects = data.projects || [];
        set({ 
          pastProjects, 
          loading: false, 
          lastUpdated: Date.now() 
        });
      } else {
        // 如果没有指定年月，返回按月分组的数据
        const pastProjectsByMonth = data.projectsByMonth || {};
        const pastProjects = Object.values(pastProjectsByMonth).flat() as ProjectState[];
        set({ 
          pastProjects,
          pastProjectsByMonth, 
          loading: false, 
          lastUpdated: Date.now() 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '获取过往项目失败',
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
      const newProject = data.project;
      
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
      const updatedProject = data.project;
      
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

  // 移动项目到过往项目
  moveToPastProject: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('未找到认证令牌');
      }
      
      const response = await fetch(`/api/projects/${id}/move-to-past`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '移动项目到过往失败');
      }
      
      const data = await response.json();
      const updatedProject = data.project;
      
      // 从活跃项目列表中移除
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        completedProjects: state.completedProjects.filter(p => p.id !== id),
        loading: false,
        lastUpdated: Date.now()
      }));
      
      // 通知其他组件更新
      window.dispatchEvent(new CustomEvent('project-moved-to-past', { 
        detail: { id, project: updatedProject } 
      }));
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '移动项目到过往失败',
        loading: false 
      });
      return false;
    }
  },

  // 恢复过往项目到活跃状态
  restoreFromPastProject: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('未找到认证令牌');
      }
      
      const response = await fetch(`/api/projects/${id}/restore-from-past`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '恢复项目失败');
      }
      
      const data = await response.json();
      const updatedProject = data.project;
      
      // 从过往项目列表中移除
      set(state => ({
        pastProjects: state.pastProjects.filter(p => p.id !== id),
        loading: false,
        lastUpdated: Date.now()
      }));
      
      // 通知其他组件更新
      window.dispatchEvent(new CustomEvent('project-restored-from-past', { 
        detail: { id, project: updatedProject } 
      }));
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '恢复项目失败',
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
        const existingProject = get().projects.find(p => p.id === data.project.id);
        if (!existingProject) {
          get().addProject(data.project);
          set({ lastUpdated: Date.now() });
        }
        debouncedRefresh(get().fetchProjects);
      }
    };

    // 监听项目更新事件
    const projectUpdatedHandler = (data: any) => {
      console.log('📝 收到项目更新事件:', data);
      if (data.project) {
        get().updateProjectInStore(data.project.id, data.project);
        set({ lastUpdated: Date.now() });
        debouncedRefresh(get().fetchProjects);
      }
    };

    // 监听项目状态变更事件
    const projectStatusChangedHandler = (data: any) => {
      console.log('🔄 收到项目状态变更事件:', data);
      if (data.project) {
        get().updateProjectInStore(data.project.id, data.project);
        set({ lastUpdated: Date.now() });
        debouncedRefresh(get().fetchProjects);
      }
    };

    // 监听项目删除事件
    const projectDeletedHandler = (data: any) => {
      console.log('🗑️ 收到项目删除事件:', data);
      if (data.projectId) {
        get().removeProject(data.projectId);
        set({ lastUpdated: Date.now() });
        window.dispatchEvent(new CustomEvent('project-deleted-sse', { 
          detail: { id: data.projectId } 
        }));
        debouncedRefresh(get().fetchProjects);
      }
    };

    // 监听板材状态变更事件
    const materialStatusChangedHandler = (data: any) => {
      console.log('🔧 收到板材状态变更事件:', data);
      if (data.projectId) {
        set({ lastUpdated: Date.now() });
        debouncedRefresh(get().fetchProjects);
        
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

    // 监听批量板材状态变更事件
    const materialBatchStatusChangedHandler = (data: any) => {
      console.log('🔧 收到批量板材状态变更事件:', data);
      set({ lastUpdated: Date.now() });
      debouncedRefresh(get().fetchProjects);
      
      window.dispatchEvent(new CustomEvent('materials-updated', { 
        detail: { 
          batchUpdate: true,
          materialIds: data.materialIds,
          status: data.status,
          updatedCount: data.updatedCount
        } 
      }));
    };

    // 监听项目移动到过往事件
    const projectMovedToPastHandler = (data: any) => {
      console.log('📁 收到项目移动到过往事件:', data);
      if (data.project) {
        get().removeProject(data.project.id);
        set({ lastUpdated: Date.now() });
        debouncedRefresh(get().fetchProjects);
      }
    };

    // 监听项目从过往恢复事件
    const projectRestoredFromPastHandler = (data: any) => {
      console.log('🔄 收到项目从过往恢复事件:', data);
      if (data.project) {
        get().addProject(data.project);
        set({ lastUpdated: Date.now() });
        debouncedRefresh(get().fetchProjects);
      }
    };
    
    // 注册事件监听器
    sseManager.addEventListener('project-created', projectCreatedHandler);
    sseManager.addEventListener('project-updated', projectUpdatedHandler);
    sseManager.addEventListener('project-status-changed', projectStatusChangedHandler);
    sseManager.addEventListener('project-deleted', projectDeletedHandler);
    sseManager.addEventListener('material-status-changed', materialStatusChangedHandler);
    sseManager.addEventListener('material-batch-status-changed', materialBatchStatusChangedHandler);
    sseManager.addEventListener('project-moved-to-past', projectMovedToPastHandler);
    sseManager.addEventListener('project-restored-from-past', projectRestoredFromPastHandler);

    // 保存监听器引用以便清理
    set({ 
      sseListenersSetup: true,
      _sseHandlers: {
        'project-created': projectCreatedHandler,
        'project-updated': projectUpdatedHandler,
        'project-status-changed': projectStatusChangedHandler,
        'project-deleted': projectDeletedHandler,
        'material-status-changed': materialStatusChangedHandler,
        'material-batch-status-changed': materialBatchStatusChangedHandler,
        'project-moved-to-past': projectMovedToPastHandler,
        'project-restored-from-past': projectRestoredFromPastHandler
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
      return newState;
    });
  },
  
  updateProjectInStore: (id, updates) => {
    console.log('📝 Zustand updateProjectInStore被调用:', id, updates);
    set(state => ({
      projects: state.projects.map(p => 
        p.id === id ? { ...p, ...updates } : p
      ),
      lastUpdated: Date.now()
    }));
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