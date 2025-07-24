'use client'

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProjectTree } from '@/components/materials/ProjectTree';
import { MaterialsTable } from '@/components/materials/MaterialsTable';
import { ProjectModal } from '@/components/materials/ProjectModal';
import { ThicknessSpecModal } from '@/components/materials/ThicknessSpecModal';
import { DashboardModal } from '@/components/materials/DashboardModal';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectStore, useMaterialStore } from '@/stores';
import { SyncStatusIndicator } from '@/components/common/SyncManager';

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}

function HomeContent() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showThicknessSpecModal, setShowThicknessSpecModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const { user, logout } = useAuth();
  
  // Zustand状态管理
  const { 
    projects, 
    loading: projectLoading, 
    createProject,
    updateProject,
    deleteProject,
    fetchProjects
  } = useProjectStore();
  
  const { fetchMaterials } = useMaterialStore();

  // 监听数据更新事件
  useEffect(() => {
    const handleProjectCreated = () => {
      fetchProjects(); // 重新获取项目列表
    };

    const handleProjectUpdated = () => {
      fetchProjects(); // 重新获取项目列表
    };

    const handleProjectDeleted = (event: CustomEvent) => {
      if (selectedProjectId === event.detail.id) {
        setSelectedProjectId(null); // 如果删除的是当前查看的项目，返回列表
      }
      fetchProjects(); // 重新获取项目列表
    };

    const handleMaterialUpdated = () => {
      // 如果有选中的项目，重新获取该项目的材料
      if (selectedProjectId) {
        fetchMaterials(selectedProjectId);
      }
    };

    // 监听全局事件
    window.addEventListener('project-created', handleProjectCreated);
    window.addEventListener('project-updated', handleProjectUpdated);
    window.addEventListener('project-deleted', handleProjectDeleted as EventListener);
    window.addEventListener('material-updated', handleMaterialUpdated);

    return () => {
      window.removeEventListener('project-created', handleProjectCreated);
      window.removeEventListener('project-updated', handleProjectUpdated);
      window.removeEventListener('project-deleted', handleProjectDeleted as EventListener);
      window.removeEventListener('material-updated', handleMaterialUpdated);
    };
  }, [selectedProjectId, fetchProjects, fetchMaterials]);

  // 初始加载项目数据
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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

  // 刷新数据
  const handleRefresh = () => {
    fetchProjects();
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
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* 左侧项目树 */}
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full lg:w-80 flex-shrink-0 h-64 lg:h-full"
        >
          <ProjectTree
            selectedProjectId={selectedProjectId}
            onProjectSelect={setSelectedProjectId}
            onCreateProject={openCreateModal}
            onEditProject={openEditModal}
            onDeleteProject={handleDeleteProject}
            onRefresh={handleRefresh}
            className="h-full"
          />
        </motion.div>

        {/* 右侧表格区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 p-3 lg:p-6 overflow-hidden"
        >
          <MaterialsTable
            selectedProjectId={selectedProjectId}
            onProjectSelect={setSelectedProjectId}
            className="h-full"
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
    </div>
  );
}