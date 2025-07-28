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
import { Card, Button, Dropdown, Input, Badge, Avatar, Loading, Alert, SearchBar, EmptyData, useDialog } from '@/components/ui';
import { SearchBox } from '@/components/ui/SearchBox';
import type { SearchType, SearchResult } from '@/components/ui/SearchBox';
import { ResponsiveMainLayout } from '@/components/layout/ResponsiveMainLayout';
import { ResponsiveHeader } from '@/components/layout/ResponsiveHeader';
import { useResponsive } from '@/hooks/useResponsive';

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
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [viewType, setViewType] = useState<'active' | 'completed' | 'drawings' | 'dashboard'>('active');
  const [workerNameFilter, setWorkerNameFilter] = useState('');
  const [thicknessFilter, setThicknessFilter] = useState('');
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
  
  // Dialog组件
  const { alert, confirm, DialogRenderer } = useDialog();
  
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

  // 简化的刷新函数移除不需要的dependencies
  const fetchWorkersData = async () => {
    // 这个函数现在只负责获取必要的工人数据，如果需要的话
  };

  const fetchThicknessSpecsData = async () => {
    // 这个函数现在只负责获取必要的厚度规格数据，如果需要的话
  };

  // 初始加载项目数据（仅在组件挂载时执行一次）
  useEffect(() => {
    console.log('🚀 初始化应用...');
    // 先获取项目数据
    fetchProjects();
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
    const confirmed = await confirm('确定要删除这个项目吗？此操作不可撤销。');
    if (!confirmed) {
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
    // MaterialsTable 组件内部会处理厚度规格数据获取
  };

  // 获取工人列表用于筛选
  const fetchWorkers = async () => {
    // WorkerManagement 组件内部会处理工人数据获取
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
    <ResponsiveMainLayout
      header={
        <ResponsiveHeader
          onMenuClick={() => {/* 移动端菜单点击处理 */}}
          onSearchResults={(results) => {
            setSearchResults(results);
          }}
          searchClearTrigger={searchClearTrigger}
          viewType={viewType}
          onViewTypeChange={(type) => handleProjectSelect(null, type)}
          onShowWorkerManagement={() => setShowWorkerManagement(true)}
          onShowDashboard={() => setShowDashboardModal(true)}
          onShowThicknessSpec={() => setShowThicknessSpecModal(true)}
        />
      }
      sidebar={
        // 根据当前视图类型渲染不同的侧边栏
        viewType === 'active' ? (
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
          // 图纸库分类侧边栏
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">图纸分类</h3>
            </div>
            <div className="p-3 h-full overflow-auto">
              {/* 简化的图纸分类列表 */}
              <div className="space-y-1">
                {[
                  { key: 'all', label: '全部图纸', count: drawingStats['all'] || 0 },
                  { key: 'project-drawings', label: '项目图纸', count: drawingStats['project-drawings'] || 0 },
                  { key: 'common-parts', label: '常用零件', count: drawingStats['common-parts'] || 0 }
                ].map((category) => (
                  <Button
                    key={category.key}
                    variant={drawingCategory === category.key ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setDrawingCategory(category.key)}
                    className="w-full justify-start text-left"
                  >
                    <span className="flex-1">{category.label}</span>
                    {category.count > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
                        {category.count}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )
      }
      bottomNavigation={
        // 移动端底部导航内容
        <div className="p-4">
          <div className="flex justify-around">
            <Button variant="ghost" size="sm" onClick={() => handleProjectSelect(null, 'active')}>
              活跃项目
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleProjectSelect(null, 'completed')}>
              过往项目
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowWorkerManagement(true)}>
              工人管理
            </Button>
          </div>
        </div>
      }
    >
      {/* 主内容区域 */}
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
              viewType={viewType as 'active' | 'completed'}
              workerNameFilter={workerNameFilter}
              thicknessFilter={thicknessFilter}
              className="h-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 模态框 */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => {
          setShowProjectModal(false);
          setEditingProject(null);
        }}
        onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
        project={editingProject}
        loading={false}
      />

      <ThicknessSpecModal
        isOpen={showThicknessSpecModal}
        onClose={() => setShowThicknessSpecModal(false)}
        onUpdate={handleRefresh}
      />

      <DashboardModal
        isOpen={showDashboardModal}
        onClose={() => setShowDashboardModal(false)}
      />

      {/* 通知容器 */}
      <NotificationContainer />
      
      {/* Dialog渲染器 */}
      <DialogRenderer />
    </ResponsiveMainLayout>
  );
}