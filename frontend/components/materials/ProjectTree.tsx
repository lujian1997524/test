'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectStore } from '@/stores';

interface Project {
  id: number;
  name: string;
  status: string;
  priority: string;
  createdAt: string;
  creator?: { id: number; name: string };
  assignedWorker?: { id: number; name: string };
}

interface ProjectTreeProps {
  onProjectSelect: (projectId: number | null) => void;
  selectedProjectId: number | null;
  onCreateProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: number) => void;
  onRefresh?: () => void;
  refreshTrigger?: number;
  className?: string;
}

export const ProjectTree: React.FC<ProjectTreeProps> = ({
  onProjectSelect,
  selectedProjectId,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onRefresh,
  refreshTrigger = 0,
  className = ''
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']));
  
  // 使用Zustand Store
  const { projects, loading, fetchProjects } = useProjectStore();

  // 获取项目列表
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, refreshTrigger]);

  // 按状态分组项目
  const groupedProjects = {
    all: projects,
    pending: projects.filter(p => p.status === 'pending'),
    in_progress: projects.filter(p => p.status === 'in_progress'),
    completed: projects.filter(p => p.status === 'completed'),
  };

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2" fill="white" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2" fill="white" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'pending':
        return (
          <div className="w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2" fill="white" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return <div className="w-3 h-3 bg-gray-300 rounded-full"></div>;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '进行中';
      case 'pending':
        return '待处理';
      default:
        return '未知';
    }
  };

  const groups = [
    { key: 'all', label: '全部项目', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ), projects: groupedProjects.all },
    { key: 'pending', label: '待处理', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ), projects: groupedProjects.pending },
    { key: 'in_progress', label: '进行中', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 011.5 1.5v1.5m-3-6v6m-1 1v-1a7 7 0 1114 0v1" />
      </svg>
    ), projects: groupedProjects.in_progress },
    { key: 'completed', label: '已完成', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ), projects: groupedProjects.completed },
  ];

  if (loading) {
    return (
      <div className={`bg-white/80 backdrop-blur-xl border-r border-gray-200 ${className}`}>
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/80 backdrop-blur-xl border-r border-gray-200 ${className}`}>
      {/* 标题区域 */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-text-primary">项目列表</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onProjectSelect(null)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedProjectId === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            <button
              onClick={onCreateProject}
              className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm"
              title="新建项目"
            >
              + 新建
            </button>
          </div>
        </div>
      </div>

      {/* 项目树 */}
      <div className="overflow-y-auto h-full">
        {groups.map((group) => (
          <div key={group.key} className="border-b border-gray-100 last:border-b-0">
            {/* 分组标题 */}
            <button
              onClick={() => toggleGroup(group.key)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <div className="text-ios18-blue">{group.icon}</div>
                <span className="font-medium text-text-primary">{group.label}</span>
                <span className="text-xs bg-gray-100 text-text-secondary px-2 py-1 rounded-full">
                  {group.projects.length}
                </span>
              </div>
              <motion.span
                animate={{ rotate: expandedGroups.has(group.key) ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-text-tertiary"
              >
                ▶
              </motion.span>
            </button>

            {/* 项目列表 */}
            <AnimatePresence>
              {expandedGroups.has(group.key) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  {group.projects.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-text-tertiary text-center">
                      暂无项目
                    </div>
                  ) : (
                    <div className="space-y-1 pb-2">
                      {group.projects.map((project) => (
                        <motion.div
                          key={project.id}
                          onClick={() => onProjectSelect(project.id)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            // TODO: 显示右键菜单（编辑、删除等）
                          }}
                          className={`group w-full px-4 py-2 mx-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedProjectId === project.id
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'hover:bg-gray-100 text-text-primary'
                          }`}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              {getStatusIcon(project.status)}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {project.name}
                                </div>
                                <div className={`text-xs truncate ${
                                  selectedProjectId === project.id 
                                    ? 'text-blue-100' 
                                    : 'text-text-secondary'
                                }`}>
                                  {project.assignedWorker?.name || '未分配'} • {getStatusText(project.status)}
                                </div>
                              </div>
                            </div>
                            
                            {/* 项目操作按钮 */}
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditProject?.(project);
                                }}
                                className={`p-1 rounded hover:bg-black/10 ${
                                  selectedProjectId === project.id ? 'text-white' : 'text-text-tertiary'
                                }`}
                                title="编辑项目"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteProject?.(project.id);
                                }}
                                className={`p-1 rounded hover:bg-black/10 ${
                                  selectedProjectId === project.id ? 'text-white' : 'text-red-500'
                                }`}
                                title="删除项目"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};