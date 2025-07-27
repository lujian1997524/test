'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginModal from '@/components/auth/LoginModal';
import { ProjectTree } from '@/components/materials/ProjectTree';
import { PastProjectsTree } from '@/components/projects/PastProjectsTree';
import { MaterialsTable } from '@/components/materials/MaterialsTable';
import { WorkerManagement } from '@/components/workers/WorkerManagement';
import { ProjectDetail } from '@/components/projects/ProjectDetail';
import { ProjectModal } from '@/components/materials/ProjectModal';
import { ThicknessSpecModal } from '@/components/materials/ThicknessSpecModal';
import { DashboardModal } from '@/components/materials/DashboardModal';
import { DrawingLibrary } from '@/components/drawings';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectStore, useMaterialStore } from '@/stores';
import { SyncStatusIndicator } from '@/components/common/SyncManager';
import { NotificationContainer } from '@/components/ui/NotificationContainer';
import { useNotificationStore } from '@/stores/notificationStore';
import { Card, Button, Dropdown, Input, Badge, Avatar, Loading, Alert, SearchBar, EmptyData } from '@/components/ui';
import { SearchBox } from '@/components/ui/SearchBox';
import type { SearchType, SearchResult } from '@/components/ui/SearchBox';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* 登录模态框 - 未登录时显示，强制模态 */}
      <LoginModal isOpen={!isAuthenticated} />
      
      {/* 主页面内容 - 始终渲染，未登录时显示模糊效果 */}
      <div className={!isAuthenticated ? 'filter blur-sm pointer-events-none' : ''}>
        <HomeContent />
      </div>
    </>
  );
}

function HomeContent() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [viewType, setViewType] = useState<'active' | 'completed' | 'drawings' | 'dashboard'>('active');
  const [workerNameFilter, setWorkerNameFilter] = useState('');
  const [workers, setWorkers] = useState<any[]>([]);
  const [thicknessFilter, setThicknessFilter] = useState('');
  const [thicknessSpecs, setThicknessSpecs] = useState<any[]>([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showThicknessSpecModal, setShowThicknessSpecModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [showWorkerManagement, setShowWorkerManagement] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [drawingCategory, setDrawingCategory] = useState('all'); // 图纸分类筛选
  const [drawingStats, setDrawingStats] = useState<{[key: string]: number}>({});
  
  // 分离手动刷新和自动刷新的加载状态
  const [manualRefreshLoading, setManualRefreshLoading] = useState(false);
  
  // 全局搜索状态
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchClearTrigger, setSearchClearTrigger] = useState(0);
  
  // 认证信息
  const { token, isAuthenticated, user, logout } = useAuth();
  const { connectSSE, disconnectSSE } = useNotificationStore();
  
  // 获取图纸统计信息
  const fetchDrawingStats = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/drawings?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const drawings = data.drawings || [];
        
        // 统计各分类数量
        const stats: {[key: string]: number} = {
          'all': drawings.length,
          'project-drawings': drawings.filter((d: any) => !d.isCommonPart && d.projectIds?.length > 0).length,
          'common-parts': drawings.filter((d: any) => d.isCommonPart).length,
          'dxf': drawings.filter((d: any) => d.fileType === 'DXF').length,
          'available': drawings.filter((d: any) => d.status === '可用').length,
          'deprecated': drawings.filter((d: any) => d.status === '已废弃').length,
          'archived': drawings.filter((d: any) => d.status === '已归档').length,
          'associated': drawings.filter((d: any) => !d.isCommonPart && d.projectIds?.length > 0).length,
          'unassociated': drawings.filter((d: any) => !d.isCommonPart && (!d.projectIds || d.projectIds.length === 0)).length
        };
        
        setDrawingStats(stats);
      }
    } catch (error) {
      console.error('获取图纸统计失败:', error);
    }
  };
  
  // Zustand状态管理
  const { 
    projects, 
    loading: projectLoading, 
    createProject,
    updateProject,
    deleteProject,
    fetchProjects,
    setupSSEListeners
  } = useProjectStore();
  
  const { fetchMaterials } = useMaterialStore();

  // 监听数据更新事件（移除SSE相关的监听，由项目store统一处理）
  useEffect(() => {
    const handleMaterialUpdated = () => {
      // 如果有选中的项目，重新获取该项目的材料
      if (selectedProjectId) {
        fetchMaterials(selectedProjectId);
      }
    };

    const handleProjectDeletedSSE = (event: CustomEvent) => {
      // 如果删除的是当前查看的项目，返回列表
      if (selectedProjectId === event.detail.id) {
        handleSelectProject(null);
      }
    };

    // 监听从工人管理组件跳转到项目筛选
    const handleCloseWorkerManagement = (event: CustomEvent) => {
      // 关闭工人管理模式
      setShowWorkerManagement(false);
      // 如果有传入工人姓名，设置筛选条件
      if (event.detail?.workerName) {
        setWorkerNameFilter(event.detail.workerName);
        // 切换到活跃项目视图并筛选（而不是过往项目）
        const targetViewType = event.detail?.viewType || 'active';
        handleProjectSelect(null, targetViewType);
      }
    };

    // 监听图纸更新事件
    const handleDrawingUpdated = () => {
      // 刷新图纸统计信息
      fetchDrawingStats();
    };

    // 监听材料更新和SSE项目删除事件
    window.addEventListener('material-updated', handleMaterialUpdated);
    window.addEventListener('project-deleted-sse', handleProjectDeletedSSE as EventListener);
    window.addEventListener('close-worker-management', handleCloseWorkerManagement as EventListener);
    window.addEventListener('drawing-updated', handleDrawingUpdated);

    return () => {
      window.removeEventListener('material-updated', handleMaterialUpdated);
      window.removeEventListener('project-deleted-sse', handleProjectDeletedSSE as EventListener);
      window.removeEventListener('close-worker-management', handleCloseWorkerManagement as EventListener);
      window.removeEventListener('drawing-updated', handleDrawingUpdated);
    };
  }, [selectedProjectId, fetchMaterials]);

  // 初始加载项目数据（仅在组件挂载时执行一次）
  useEffect(() => {
    console.log('🚀 初始化应用...');
    // 先获取项目数据
    fetchProjects();
    // 获取工人数据用于筛选
    fetchWorkers();
    // 获取厚度规格数据用于筛选
    fetchThicknessSpecs();
    // 获取图纸统计信息
    fetchDrawingStats();
    // SSE监听器将在连接成功后设置，不在这里重复设置
  }, []); // 使用空依赖数组，只在挂载时执行一次

  // 统一的SSE连接管理 - 通过notificationStore建立连接，通过projectStore设置监听器 
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('🔌 建立统一SSE连接...');
      connectSSE(token).then((success) => {
        if (success) {
          console.log('✅ SSE连接建立成功');
          // SSE连接成功后，设置项目store的监听器
          console.log('🎧 设置项目事件监听器...');
          setupSSEListeners();
        } else {
          console.error('❌ SSE连接建立失败');
        }
      });

      return () => {
        console.log('🔌 断开SSE连接...');
        disconnectSSE();
      };
    }
  }, [isAuthenticated, token]); // 移除connectSSE和disconnectSSE依赖

  // 创建项目
  const handleCreateProject = async (projectData: any) => {
    const result = await createProject(projectData);
    if (result) {
      setShowProjectModal(false);
    } else {
      alert('创建项目失败，请重试');
    }
  };

  // 更新项目
  const handleUpdateProject = async (projectData: any) => {
    if (!editingProject) return;

    const result = await updateProject(editingProject.id, projectData);
    if (result) {
      setShowProjectModal(false);
      setEditingProject(null);
    } else {
      alert('更新项目失败，请重试');
    }
  };

  // 删除项目
  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('确定要删除这个项目吗？此操作不可撤销。')) {
      return;
    }

    const success = await deleteProject(projectId);
    if (!success) {
      alert('删除项目失败，请重试');
    }
  };

  // 处理项目选择 - 添加平滑过渡
  const handleProjectSelect = (projectId: number | null, type: 'active' | 'completed' | 'drawings' | 'dashboard') => {
    console.log('🔄 切换视图类型:', type, '项目ID:', projectId);
    
    // 清空搜索状态
    setSearchResults([]);
    setSearchType('all');
    setSearchClearTrigger(prev => prev + 1);
    
    // 如果是跳转到仪表盘，直接跳转到仪表盘页面
    if (type === 'dashboard') {
      window.location.href = '/dashboard';
      return;
    }
    
    // 如果切换的是不同的视图类型，添加过渡延迟
    const isViewTypeChange = viewType !== type;
    
    // 当选择项目时，自动关闭工人管理界面
    setShowWorkerManagement(false);
    
    // 如果是视图类型切换，先清空选中的项目避免状态冲突
    if (isViewTypeChange) {
      setSelectedProjectId(null);
    }
    
    // 使用 setTimeout 来创建平滑过渡效果
    if (isViewTypeChange) {
      // 延迟设置新的视图类型，让动画有时间完成
      setTimeout(() => {
        setViewType(type);
        if (projectId !== null) {
          setSelectedProjectId(projectId);
        }
      }, 150);
    } else {
      setViewType(type);
      setSelectedProjectId(projectId);
    }
    
    // 根据视图类型获取数据 - 使用静默刷新
    if (type === 'completed') {
      console.log('✅ 获取过往项目数据...');
      // 延迟获取数据，确保视图切换完成
      setTimeout(() => {
        silentRefresh('completed');
      }, isViewTypeChange ? 200 : 0);
    } else if (type === 'active') {
      console.log('📋 获取活跃项目数据...');
      setTimeout(() => {
        silentRefresh('active');
      }, isViewTypeChange ? 200 : 0);
    } else if (type === 'drawings') {
      console.log('📂 切换到图纸库视图...');
      // 图纸库不需要额外数据获取，由 DrawingLibrary 组件自己处理
    }
  };

  // 处理单独选择项目（不改变视图类型，但关闭工人管理）
  const handleSelectProject = (projectId: number | null) => {
    setShowWorkerManagement(false);
    // 清空搜索状态
    setSearchResults([]);
    setSearchType('all');
    setSearchClearTrigger(prev => prev + 1);
    setSelectedProjectId(projectId);
  };

  // 获取厚度规格数据
  const fetchThicknessSpecs = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/thickness-specs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setThicknessSpecs(data.thicknessSpecs || data);
      }
    } catch (error) {
      console.error('获取厚度规格数据失败:', error);
    }
  };

  // 获取工人列表用于筛选
  const fetchWorkers = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/workers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkers(data.workers || data);
      }
    } catch (error) {
      console.error('获取工人数据失败:', error);
    }
  };

  // 清空所有筛选条件
  const clearFilters = () => {
    setWorkerNameFilter('');
    setThicknessFilter('');
  };



  // 组件内部使用的静默刷新回调
  const handleSilentRefreshActive = () => silentRefresh('active');
  const handleSilentRefreshCompleted = () => silentRefresh('completed');
  const silentRefresh = async (type: 'active' | 'completed' | 'drawings') => {
    try {
      if (type === 'completed') {
        const { fetchPastProjects } = useProjectStore.getState();
        await fetchPastProjects();
      } else if (type === 'active') {
        await fetchProjects();
      }
      // drawings 类型不需要额外数据获取
    } catch (error) {
      console.error('静默刷新失败:', error);
    }
  };

  // 刷新数据 - 手动刷新，显示加载状态
  const handleRefresh = async () => {
    setManualRefreshLoading(true);
    
    try {
      // 根据当前视图类型刷新相应数据
      if (viewType === 'completed') {
        const { fetchPastProjects } = useProjectStore.getState();
        await fetchPastProjects();
      } else {
        await fetchProjects();
      }
      
      if (selectedProjectId) {
        await fetchMaterials(selectedProjectId);
      }
    } catch (error) {
      console.error('手动刷新失败:', error);
    } finally {
      setManualRefreshLoading(false);
    }
  };

  // 打开新建项目对话框
  const openCreateModal = () => {
    setEditingProject(null);
    setShowProjectModal(true);
  };

  // 打开编辑项目对话框
  const openEditModal = (project: any) => {
    setEditingProject(project);
    setShowProjectModal(true);
  };

  // 全局搜索处理函数
  const handleGlobalSearch = async (query: string, type: SearchType) => {
    if (!token || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        console.error('搜索失败:', response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('搜索请求失败:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // 处理搜索结果选择
  const handleSearchResultSelect = (result: SearchResult) => {
    console.log('选择搜索结果:', result);
    
    // 根据搜索结果类型进行相应操作
    switch(result.type) {
      case 'projects':
        // 跳转到项目详情
        const projectId = parseInt(result.id);
        setSelectedProjectId(projectId);
        setViewType('active');
        break;
      case 'workers':
        // 打开工人管理并筛选
        setWorkerNameFilter(result.title);
        setShowWorkerManagement(true);
        break;
      case 'drawings':
        // 跳转到图纸库
        setViewType('drawings');
        break;
      case 'materials':
        // 可以根据材料信息进行筛选
        setThicknessFilter(result.title.match(/\d+/)?.[0] || '');
        setViewType('active');
        break;
      case 'time':
        // 时间相关搜索可以按日期筛选项目
        setViewType('completed');
        break;
      default:
        console.log('未知搜索结果类型:', result.type);
    }
    
    // 清空搜索结果和搜索状态
    setSearchResults([]);
    setSearchType('all');
    setSearchClearTrigger(prev => prev + 1);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* 页面标题栏 */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-text-primary">
                  激光切割生产管理系统
                </h1>
                {/* 状态同步指示器 */}
                <SyncStatusIndicator />
              </div>
              <p className="text-text-secondary mt-1">
                实时追踪不同厚度板材的生产完成状态
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 全局搜索框 - 增加宽度 */}
              <div className="hidden lg:block w-96">
                <SearchBox
                  placeholder="搜索项目、工人、图纸、板材..."
                  searchType={searchType}
                  onSearchTypeChange={setSearchType}
                  onSearch={handleGlobalSearch}
                  onResultSelect={handleSearchResultSelect}
                  results={searchResults}
                  loading={searchLoading}
                  clearTrigger={searchClearTrigger}
                />
              </div>

              {/* 移动端搜索按钮 */}
              <div className="lg:hidden">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // 可以打开一个移动端搜索模态框或跳转到搜索页面
                    alert('移动端搜索功能开发中...');
                  }}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  搜索
                </Button>
              </div>

              {/* 功能按钮区域 */}
              <div className="flex items-center space-x-2">
                {/* 视图切换按钮组 - 添加过渡动画 */}
                <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={viewType === 'active' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => handleProjectSelect(null, 'active')}
                      className="flex items-center gap-2 rounded-none transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      活跃项目
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={viewType === 'completed' ? 'primary' : 'ghost'} 
                      size="sm"
                      onClick={() => handleProjectSelect(null, 'completed')}
                      className="flex items-center gap-2 rounded-none transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      过往项目
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={viewType === 'drawings' ? 'primary' : 'ghost'} 
                      size="sm"
                      onClick={() => handleProjectSelect(null, 'drawings')}
                      className="flex items-center gap-2 rounded-none transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      图纸库
                    </Button>
                  </motion.div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDashboardModal(true)}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  仪表板
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowThicknessSpecModal(true)}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  板材管理
                </Button>

                <Button
                  variant={showWorkerManagement ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    // 清空搜索状态
                    setSearchResults([]);
                    setSearchType('all');
                    setSearchClearTrigger(prev => prev + 1);
                    setShowWorkerManagement(!showWorkerManagement);
                  }}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  工人管理
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={manualRefreshLoading}
                  loading={manualRefreshLoading}
                  className="shadow-lg"
                >
                  刷新
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={logout}
                >
                  退出
                </Button>
              </div>

              {/* 用户信息 - 移到最右边 */}
              <div className="flex items-center space-x-3">
                <Avatar
                  name={user?.name}
                  size="sm"
                  className="bg-ios18-blue text-white"
                />
                <div className="hidden md:block">
                  <p className="font-medium text-text-primary text-sm">
                    {user?.name}
                  </p>
                  <Badge
                    variant={user?.role === 'admin' ? 'primary' : 'secondary'}
                    size="sm"
                  >
                    {user?.role === 'admin' ? '管理员' : '操作员'}
                  </Badge>
                </div>
              </div>

            </div>
          </div>
        </div>
      </header>


      {/* 主要内容区域 */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
        {/* 左侧项目树 */}
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full lg:w-72 xl:w-80 flex-shrink-0 h-64 lg:h-full lg:max-h-full lg:overflow-hidden"
        >
          {viewType === 'active' ? (
            <ProjectTree
              selectedProjectId={selectedProjectId}
              onProjectSelect={handleSelectProject}
              onCreateProject={openCreateModal}
              onEditProject={openEditModal}
              onDeleteProject={handleDeleteProject}
              onRefresh={handleSilentRefreshActive}
              className="h-full"
            />
          ) : viewType === 'completed' ? (
            <PastProjectsTree
              selectedProjectId={selectedProjectId}
              onProjectSelect={handleSelectProject}
              onRefresh={handleSilentRefreshCompleted}
              className="h-full"
            />
          ) : (
            // 图纸库分类侧边栏 - 与项目树保持一致的风格
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
            >
              {/* 标题栏 */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    图纸分类
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDrawingCategory('all')}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    清除筛选
                  </Button>
                </div>
              </div>

              {/* 分类列表 */}
              <div className="p-3 h-full overflow-auto">
                <div className="space-y-1">
                  {/* 主要分类 */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-2">
                      📂 主要分类
                    </div>
                    {[
                      { key: 'all', label: '全部图纸', icon: '📋', count: drawingStats['all'] || 0 },
                      { key: 'project-drawings', label: '项目图纸', icon: '🏗️', count: drawingStats['project-drawings'] || 0 },
                      { key: 'common-parts', label: '常用零件', icon: '⚙️', count: drawingStats['common-parts'] || 0 },
                      { key: 'dxf', label: 'DXF文件', icon: '📐', count: drawingStats['dxf'] || 0 }
                    ].map((category) => (
                      <motion.div
                        key={category.key}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant={drawingCategory === category.key ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => setDrawingCategory(category.key)}
                          className={`w-full justify-start text-left transition-all duration-200 ${
                            drawingCategory === category.key
                              ? 'bg-ios18-blue text-white shadow-md'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="mr-2">{category.icon}</span>
                          <span className="flex-1">{category.label}</span>
                          {category.count > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              drawingCategory === category.key
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {category.count}
                            </span>
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>

                  {/* 状态分类 */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-2">
                      📊 状态分类
                    </div>
                    {[
                      { key: 'available', label: '可用', icon: '✅', color: 'text-green-600', count: drawingStats['available'] || 0 },
                      { key: 'deprecated', label: '已废弃', icon: '⚠️', color: 'text-yellow-600', count: drawingStats['deprecated'] || 0 },
                      { key: 'archived', label: '已归档', icon: '📦', color: 'text-gray-600', count: drawingStats['archived'] || 0 }
                    ].map((category) => (
                      <motion.div
                        key={category.key}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant={drawingCategory === category.key ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => setDrawingCategory(category.key)}
                          className={`w-full justify-start text-left transition-all duration-200 ${
                            drawingCategory === category.key
                              ? 'bg-ios18-blue text-white shadow-md'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className={`mr-2 ${category.color}`}>{category.icon}</span>
                          <span className="flex-1">{category.label}</span>
                          {category.count > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              drawingCategory === category.key
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {category.count}
                            </span>
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>

                  {/* 关联分类 */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-2">
                      🔗 关联状态
                    </div>
                    {[
                      { key: 'associated', label: '已关联项目', icon: '🔗', color: 'text-blue-600', count: drawingStats['associated'] || 0 },
                      { key: 'unassociated', label: '未关联项目', icon: '🔓', color: 'text-gray-600', count: drawingStats['unassociated'] || 0 }
                    ].map((category) => (
                      <motion.div
                        key={category.key}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant={drawingCategory === category.key ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => setDrawingCategory(category.key)}
                          className={`w-full justify-start text-left transition-all duration-200 ${
                            drawingCategory === category.key
                              ? 'bg-ios18-blue text-white shadow-md'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className={`mr-2 ${category.color}`}>{category.icon}</span>
                          <span className="flex-1">{category.label}</span>
                          {category.count > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              drawingCategory === category.key
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {category.count}
                            </span>
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* 右侧表格区域 - 添加更平滑的过渡动画 */}
        <motion.div
          key={`${viewType}-${showWorkerManagement}-${selectedProjectId}`} // 添加key确保重新渲染
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ 
            duration: 0.4, 
            delay: 0.1,
            ease: "easeInOut"
          }}
          className="flex-1 p-3 lg:p-6 overflow-hidden min-w-0 flex flex-col"
        >
          {/* 条件渲染：工人管理、项目详情页、图纸库 或 项目列表表格 - 使用AnimatePresence */}
          <AnimatePresence mode="wait">
            {showWorkerManagement ? (
              <motion.div
                key="worker-management"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex-1"
              >
                <WorkerManagement className="h-full" />
              </motion.div>
            ) : selectedProjectId && (viewType === 'active' || viewType === 'completed') ? (
              <motion.div
                key={`project-detail-${selectedProjectId}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex-1"
              >
                <ProjectDetail
                  projectId={selectedProjectId}
                  onBack={() => handleSelectProject(null)}
                  className="h-full max-h-full"
                />
              </motion.div>
            ) : viewType === 'drawings' ? (
              <motion.div
                key="drawing-library"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex-1"
              >
                <DrawingLibrary
                  className="h-full"
                  selectedCategory={drawingCategory}
                  onCategoryChange={setDrawingCategory}
                />
              </motion.div>
            ) : (
              <motion.div
                key={`materials-table-${viewType}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex-1"
              >
                <MaterialsTable
                  selectedProjectId={selectedProjectId}
                  onProjectSelect={handleSelectProject}
                  viewType={viewType as 'active' | 'completed'}  // 类型转换，因为此时 viewType 不会是 'drawings'
                  workerNameFilter={workerNameFilter}
                  thicknessFilter={thicknessFilter}
                  className="h-full"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 底部快速导航 */}
      <div className="fixed bottom-4 right-4 lg:hidden">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg p-2">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/workers'}
              className="p-2 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/drawings'}
              className="p-2 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* 项目管理对话框 */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => {
          setShowProjectModal(false);
          setEditingProject(null);
        }}
        onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
        project={editingProject}
        loading={projectLoading}
      />

      {/* 厚度规格管理对话框 */}
      <ThicknessSpecModal
        isOpen={showThicknessSpecModal}
        onClose={() => setShowThicknessSpecModal(false)}
        onUpdate={handleRefresh}
      />

      {/* 仪表板模态框 */}
      <DashboardModal
        isOpen={showDashboardModal}
        onClose={() => setShowDashboardModal(false)}
      />

      {/* 通知容器 */}
      <NotificationContainer />
    </div>
  );
}