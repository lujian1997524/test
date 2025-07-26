'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
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

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}

function HomeContent() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [viewType, setViewType] = useState<'active' | 'completed' | 'drawings'>('active');
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
  const { token, isAuthenticated, user, logout } = useAuth();
  const { connectSSE, disconnectSSE } = useNotificationStore();
  
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
        // 切换到已完成项目视图并筛选
        handleProjectSelect(null, 'completed');
      }
    };

    // 监听材料更新和SSE项目删除事件
    window.addEventListener('material-updated', handleMaterialUpdated);
    window.addEventListener('project-deleted-sse', handleProjectDeletedSSE as EventListener);
    window.addEventListener('close-worker-management', handleCloseWorkerManagement as EventListener);

    return () => {
      window.removeEventListener('material-updated', handleMaterialUpdated);
      window.removeEventListener('project-deleted-sse', handleProjectDeletedSSE as EventListener);
      window.removeEventListener('close-worker-management', handleCloseWorkerManagement as EventListener);
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

  // 处理项目选择
  const handleProjectSelect = (projectId: number | null, type: 'active' | 'completed' | 'drawings') => {
    console.log('🔄 切换视图类型:', type, '项目ID:', projectId);
    // 当选择项目时，自动关闭工人管理界面
    setShowWorkerManagement(false);
    setViewType(type);
    setSelectedProjectId(projectId);
    
    if (type === 'completed') {
      console.log('✅ 获取过往项目数据...');
      // 使用过往项目API
      const { fetchPastProjects } = useProjectStore.getState();
      fetchPastProjects();
    } else if (type === 'active') {
      console.log('📋 获取活跃项目数据...');
      fetchProjects(); // 获取活跃项目
    } else if (type === 'drawings') {
      console.log('📂 切换到图纸库视图...');
      // 图纸库不需要额外数据获取，由 DrawingLibrary 组件自己处理
    }
  };

  // 处理单独选择项目（不改变视图类型，但关闭工人管理）
  const handleSelectProject = (projectId: number | null) => {
    setShowWorkerManagement(false);
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



  // 刷新数据
  const handleRefresh = () => {
    // 根据当前视图类型刷新相应数据
    if (viewType === 'completed') {
      const { fetchPastProjects } = useProjectStore.getState();
      fetchPastProjects();
    } else {
      fetchProjects();
    }
    
    if (selectedProjectId) {
      fetchMaterials(selectedProjectId);
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
              {/* 用户信息 */}
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

              {/* 功能按钮 */}
              <div className="flex items-center space-x-2">
                {/* 视图切换按钮组 */}
                <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <Button
                    variant={viewType === 'active' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleProjectSelect(null, 'active')}
                    className="flex items-center gap-2 rounded-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    活跃项目
                  </Button>
                  <Button
                    variant={viewType === 'completed' ? 'primary' : 'ghost'} 
                    size="sm"
                    onClick={() => handleProjectSelect(null, 'completed')}
                    className="flex items-center gap-2 rounded-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    过往项目
                  </Button>
                  <Button
                    variant={viewType === 'drawings' ? 'primary' : 'ghost'} 
                    size="sm"
                    onClick={() => handleProjectSelect(null, 'drawings')}
                    className="flex items-center gap-2 rounded-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    图纸库
                  </Button>
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
                  variant="secondary"
                  size="sm"
                  onClick={() => window.location.href = '/search'}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  搜索
                </Button>

                <Button
                  variant={showWorkerManagement ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setShowWorkerManagement(!showWorkerManagement)}
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
                  disabled={projectLoading}
                  loading={projectLoading}
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
              onRefresh={handleRefresh}
              className="h-full"
            />
          ) : viewType === 'completed' ? (
            <PastProjectsTree
              selectedProjectId={selectedProjectId}
              onProjectSelect={handleSelectProject}
              onRefresh={handleRefresh}
              className="h-full"
            />
          ) : (
            // 图纸库分类树
            <Card padding="none" className="h-full overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">图纸库分类</h3>
              </div>
              <div className="p-4 space-y-2 overflow-auto flex-1">
                {[
                  { key: 'all', label: '全部图纸' },
                  { key: 'project-drawings', label: '项目图纸' },
                  { key: 'common-parts', label: '常用零件' },
                  { key: 'dxf', label: 'DXF文件' },
                  { key: 'associated', label: '已关联' },
                  { key: 'unassociated', label: '未关联' },
                  { key: 'available', label: '可用' },
                  { key: 'deprecated', label: '已废弃' },
                  { key: 'archived', label: '已归档' }
                ].map((category) => (
                  <Button
                    key={category.key}
                    variant={drawingCategory === category.key ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setDrawingCategory(category.key)}
                    className="w-full justify-start"
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </motion.div>

        {/* 右侧表格区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 p-3 lg:p-6 overflow-hidden min-w-0 flex flex-col"
        >
          {/* 活跃项目筛选器 */}
          {viewType === 'active' && !showWorkerManagement && !selectedProjectId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <Card padding="md" className="bg-white/80 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">项目筛选</h3>
                    <p className="text-sm text-text-secondary">按条件筛选活跃项目</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    清空筛选
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 工人筛选 */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      负责工人
                    </label>
                    <Dropdown
                      options={[
                        { label: '全部工人', value: '' },
                        ...workers.map(worker => ({
                          label: worker.name,
                          value: worker.name
                        }))
                      ]}
                      value={workerNameFilter}
                      onChange={setWorkerNameFilter}
                      placeholder="选择工人"
                      className="w-full"
                    />
                  </div>

                  {/* 板材厚度筛选 */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      板材厚度
                    </label>
                    <Dropdown
                      options={[
                        { label: '全部厚度', value: '' },
                        ...thicknessSpecs
                          .filter(spec => spec.isActive)
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map(spec => ({
                            label: `${spec.thickness}${spec.unit} (${spec.materialType})`,
                            value: spec.thickness
                          }))
                      ]}
                      value={thicknessFilter}
                      onChange={setThicknessFilter}
                      placeholder="选择厚度"
                      className="w-full"
                    />
                  </div>

                  {/* 项目状态筛选 */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      项目状态
                    </label>
                    <Dropdown
                      options={[
                        { label: '全部状态', value: '' },
                        { label: '待处理', value: 'pending' },
                        { label: '进行中', value: 'in_progress' },
                        { label: '已完成', value: 'completed' }
                      ]}
                      value=""
                      onChange={() => {}}
                      placeholder="选择状态"
                      className="w-full"
                    />
                  </div>
                </div>
                
                {/* 筛选状态提示 */}
                {(workerNameFilter || thicknessFilter) && (
                  <Alert
                    variant="info"
                    className="mt-4"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <span className="font-medium">当前筛选条件:</span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      {workerNameFilter && <div>• 工人: {workerNameFilter}</div>}
                      {thicknessFilter && <div>• 板材厚度: {thicknessFilter}mm</div>}
                    </div>
                  </Alert>
                )}
              </Card>
            </motion.div>
          )}

          {/* 过往项目筛选器 */}
          {viewType === 'completed' && (
            <Card padding="md" className="mb-4 bg-white/80 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label htmlFor="workerFilter" className="block text-sm font-medium text-gray-700 mb-2">
                    按工人姓名筛选
                  </label>
                  <div className="flex gap-2">
                    <SearchBar
                      placeholder="输入工人姓名..."
                      value={workerNameFilter}
                      onChange={setWorkerNameFilter}
                      onSearch={() => handleProjectSelect(null, 'completed')}
                      className="flex-1"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleProjectSelect(null, 'completed')}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      搜索
                    </Button>
                    {workerNameFilter && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setWorkerNameFilter('');
                          handleProjectSelect(null, 'completed');
                        }}
                        className="flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        清除
                      </Button>
                    )}
                  </div>
                  {workerNameFilter && (
                    <Alert
                      variant="info"
                      size="sm"
                      className="mt-2"
                    >
                      当前筛选: 工人姓名包含 "{workerNameFilter}"
                    </Alert>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* 条件渲染：工人管理、项目详情页、图纸库 或 项目列表表格 */}
          {showWorkerManagement ? (
            <WorkerManagement className="flex-1" />
          ) : selectedProjectId && viewType === 'active' ? (
            <ProjectDetail
              projectId={selectedProjectId}
              onBack={() => handleSelectProject(null)}
              className="flex-1"
            />
          ) : viewType === 'drawings' ? (
            <DrawingLibrary
              selectedCategory={drawingCategory}
              onCategoryChange={setDrawingCategory}
              className="flex-1"
            />
          ) : (
            <MaterialsTable
              selectedProjectId={selectedProjectId}
              onProjectSelect={handleSelectProject}
              viewType={viewType as 'active' | 'completed'}  // 类型转换，因为此时 viewType 不会是 'drawings'
              workerNameFilter={workerNameFilter}
              thicknessFilter={thicknessFilter}
              className="flex-1"
            />
          )}
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
              title="工人管理"
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
              title="图纸管理"
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