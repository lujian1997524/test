'use client'

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProjectTree } from '@/components/materials/ProjectTree';
import { PastProjectsTree } from '@/components/projects/PastProjectsTree';
import { MaterialsTable } from '@/components/materials/MaterialsTable';
import { ProjectModal } from '@/components/materials/ProjectModal';
import { ThicknessSpecModal } from '@/components/materials/ThicknessSpecModal';
import { DashboardModal } from '@/components/materials/DashboardModal';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectStore, useMaterialStore } from '@/stores';
import { SyncStatusIndicator } from '@/components/common/SyncManager';
import { NotificationContainer } from '@/components/ui/NotificationContainer';
import { useNotificationStore } from '@/stores/notificationStore';

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}

function HomeContent() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [viewType, setViewType] = useState<'active' | 'completed'>('active');
  const [workerNameFilter, setWorkerNameFilter] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showThicknessSpecModal, setShowThicknessSpecModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
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
        setSelectedProjectId(null);
      }
    };

    // 监听材料更新和SSE项目删除事件
    window.addEventListener('material-updated', handleMaterialUpdated);
    window.addEventListener('project-deleted-sse', handleProjectDeletedSSE as EventListener);

    return () => {
      window.removeEventListener('material-updated', handleMaterialUpdated);
      window.removeEventListener('project-deleted-sse', handleProjectDeletedSSE as EventListener);
    };
  }, [selectedProjectId, fetchMaterials]);

  // 初始加载项目数据并设置SSE监听（仅在组件挂载时执行一次）
  useEffect(() => {
    console.log('🚀 初始化应用...');
    // 先获取项目数据
    fetchProjects();
    // 设置SSE监听器（重新启用）
    setupSSEListeners();
  }, []); // 使用空依赖数组，只在挂载时执行一次

  // SSE连接管理
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('🔌 建立SSE连接...');
      connectSSE(token).then((success) => {
        if (success) {
          console.log('✅ SSE连接建立成功');
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
  const handleProjectSelect = (projectId: number | null, type: 'active' | 'completed') => {
    console.log('🔄 切换视图类型:', type, '项目ID:', projectId);
    setViewType(type);
    setSelectedProjectId(projectId);
    
    if (type === 'completed') {
      console.log('✅ 获取过往项目数据...');
      // 使用过往项目API
      const { fetchPastProjects } = useProjectStore.getState();
      fetchPastProjects();
    } else {
      console.log('📋 获取活跃项目数据...');
      fetchProjects(); // 获取活跃项目
    }
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
                <div className="w-8 h-8 bg-ios18-blue rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="font-medium text-text-primary text-sm">
                    {user?.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {user?.role === 'admin' ? '管理员' : '操作员'}
                  </p>
                </div>
              </div>

              {/* 功能按钮 */}
              <div className="flex items-center space-x-2">
                {/* 视图切换按钮组 */}
                <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleProjectSelect(null, 'active')}
                    className={`px-3 py-2 text-sm font-medium transition-all ${
                      viewType === 'active' 
                        ? 'bg-blue-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    活跃项目
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleProjectSelect(null, 'completed')}
                    className={`px-3 py-2 text-sm font-medium transition-all ${
                      viewType === 'completed' 
                        ? 'bg-green-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    过往项目
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDashboardModal(true)}
                  className="px-3 py-2 bg-white border border-gray-200 text-text-primary rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  仪表板
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowThicknessSpecModal(true)}
                  className="px-3 py-2 bg-white border border-gray-200 text-text-primary rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  板材管理
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = '/search'}
                  className="px-3 py-2 bg-white border border-gray-200 text-text-primary rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  搜索
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  disabled={projectLoading}
                  className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg text-sm disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 mr-1 ${projectLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {projectLoading ? '刷新中...' : '刷新'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="px-3 py-2 bg-white border border-gray-200 text-text-primary rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  退出
                </motion.button>
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
          className="w-full lg:w-80 xl:w-96 flex-shrink-0 h-64 lg:h-full lg:max-h-full lg:overflow-hidden"
        >
          {viewType === 'active' ? (
            <ProjectTree
              selectedProjectId={selectedProjectId}
              onProjectSelect={setSelectedProjectId}
              onCreateProject={openCreateModal}
              onEditProject={openEditModal}
              onDeleteProject={handleDeleteProject}
              onRefresh={handleRefresh}
              className="h-full"
            />
          ) : (
            <PastProjectsTree
              selectedProjectId={selectedProjectId}
              onProjectSelect={setSelectedProjectId}
              onRefresh={handleRefresh}
              className="h-full"
            />
          )}
        </motion.div>

        {/* 右侧表格区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 p-3 lg:p-6 overflow-hidden min-w-0 flex flex-col"
        >
          {/* 过往项目筛选器 */}
          {viewType === 'completed' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label htmlFor="workerFilter" className="block text-sm font-medium text-gray-700 mb-2">
                    按工人姓名筛选
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="workerFilter"
                      type="text"
                      placeholder="输入工人姓名..."
                      value={workerNameFilter}
                      onChange={(e) => setWorkerNameFilter(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleProjectSelect(null, 'completed');
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleProjectSelect(null, 'completed')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      搜索
                    </motion.button>
                    {workerNameFilter && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setWorkerNameFilter('');
                          handleProjectSelect(null, 'completed');
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        清除
                      </motion.button>
                    )}
                  </div>
                  {workerNameFilter && (
                    <p className="text-sm text-blue-600 mt-2">
                      当前筛选: 工人姓名包含 "{workerNameFilter}"
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <MaterialsTable
            selectedProjectId={selectedProjectId}
            onProjectSelect={setSelectedProjectId}
            viewType={viewType}
            className="flex-1"
          />
        </motion.div>
      </div>

      {/* 底部快速导航 */}
      <div className="fixed bottom-4 right-4 lg:hidden">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg p-2">
          <div className="flex space-x-2">
            <button
              onClick={() => window.location.href = '/workers'}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="工人管理"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </button>
            <button
              onClick={() => window.location.href = '/drawings'}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="图纸管理"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
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