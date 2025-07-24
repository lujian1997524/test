'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectTree } from '@/components/projects/ProjectTree';
import { Card } from '@/components/ui/Card';

interface Project {
  id: number;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedWorker?: {
    id: number;
    name: string;
    department?: string;
  };
}

export default function ProjectTreeDemoPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { token } = useAuth();

  // 获取项目列表
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取项目列表失败');
      }

      const data = await response.json();
      setProjects(data.projects || []);
      
      // 默认选择第一个项目
      if (data.projects?.length > 0 && !selectedProject) {
        setSelectedProject(data.projects[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理项目选择
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // 生成示例项目数据（如果没有真实数据）
  const generateDemoProjects = (): Project[] => {
    return [
      {
        id: 1,
        name: '激光切割项目A',
        description: '高精度不锈钢板切割任务，要求严格控制切割质量',
        status: 'in_progress',
        priority: 'high',
        assignedWorker: {
          id: 1,
          name: '张师傅',
          department: '生产部'
        }
      },
      {
        id: 2,
        name: '铝合金面板制作',
        description: '电子设备外壳面板批量生产',
        status: 'pending',
        priority: 'medium',
        assignedWorker: {
          id: 2,
          name: '李工',
          department: '技术部'
        }
      },
      {
        id: 3,
        name: '定制钢板切割',
        description: '客户定制钢板切割，需要特殊工艺处理',
        status: 'completed',
        priority: 'urgent',
        assignedWorker: {
          id: 3,
          name: '王师傅',
          department: '生产部'
        }
      },
      {
        id: 4,
        name: '铜板精密加工',
        description: '精密铜板切割，用于电子元件制造',
        status: 'in_progress',
        priority: 'high',
        assignedWorker: {
          id: 4,
          name: '赵工',
          department: '技术部'
        }
      },
      {
        id: 5,
        name: '镀锌板批量生产',
        description: '标准规格镀锌板批量切割任务',
        status: 'pending',
        priority: 'low',
        assignedWorker: {
          id: 5,
          name: '钱师傅',
          department: '生产部'
        }
      },
      {
        id: 6,
        name: '钛合金特殊切割',
        description: '航空级钛合金精密切割，高技术要求',
        status: 'cancelled',
        priority: 'urgent',
        assignedWorker: {
          id: 6,
          name: '孙工',
          department: '研发部'
        }
      }
    ];
  };

  const displayProjects = projects.length > 0 ? projects : generateDemoProjects();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              项目树形导航演示
            </h1>
            <p className="text-text-secondary">
              展示项目树形结构的交互效果，支持按状态和优先级分组显示
            </p>
          </motion.div>

          {/* 错误提示 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="border-status-error bg-status-error bg-opacity-10">
                <div className="p-4">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-status-error mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <span className="text-status-error font-medium">
                      {error}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧：项目树形导航 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
            >
              <ProjectTree
                projects={displayProjects}
                selectedProjectId={selectedProject?.id}
                onProjectSelect={handleProjectSelect}
                loading={loading}
                className="sticky top-8"
              />
            </motion.div>

            {/* 右侧：选中项目详情 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card>
                <div className="p-6">
                  {selectedProject ? (
                    <>
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-text-primary mb-2">
                            {selectedProject.name}
                          </h2>
                          {selectedProject.description && (
                            <p className="text-text-secondary text-base leading-relaxed">
                              {selectedProject.description}
                            </p>
                          )}
                        </div>
                        
                        {/* 状态和优先级标签 */}
                        <div className="flex flex-col space-y-2">
                          <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                            selectedProject.status === 'completed' ? 'bg-status-success bg-opacity-20 text-status-success' :
                            selectedProject.status === 'in_progress' ? 'bg-status-warning bg-opacity-20 text-status-warning' :
                            selectedProject.status === 'cancelled' ? 'bg-status-error bg-opacity-20 text-status-error' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {selectedProject.status === 'pending' ? '待开始' :
                             selectedProject.status === 'in_progress' ? '进行中' :
                             selectedProject.status === 'completed' ? '已完成' : '已取消'}
                          </span>
                          <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                            selectedProject.priority === 'urgent' ? 'bg-status-error bg-opacity-20 text-status-error' :
                            selectedProject.priority === 'high' ? 'bg-status-warning bg-opacity-20 text-status-warning' :
                            selectedProject.priority === 'medium' ? 'bg-ios18-blue bg-opacity-20 text-ios18-blue' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {selectedProject.priority === 'low' ? '低优先级' :
                             selectedProject.priority === 'medium' ? '中优先级' :
                             selectedProject.priority === 'high' ? '高优先级' : '紧急'}
                          </span>
                        </div>
                      </div>

                      {/* 项目详细信息 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary mb-4">项目信息</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-text-secondary">项目ID:</span>
                              <span className="text-text-primary font-medium">#{selectedProject.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-secondary">状态:</span>
                              <span className="text-text-primary font-medium">
                                {selectedProject.status === 'pending' ? '待开始' :
                                 selectedProject.status === 'in_progress' ? '进行中' :
                                 selectedProject.status === 'completed' ? '已完成' : '已取消'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-secondary">优先级:</span>
                              <span className="text-text-primary font-medium">
                                {selectedProject.priority === 'low' ? '低' :
                                 selectedProject.priority === 'medium' ? '中' :
                                 selectedProject.priority === 'high' ? '高' : '紧急'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-text-primary mb-4">负责人信息</h3>
                          {selectedProject.assignedWorker ? (
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-text-secondary">姓名:</span>
                                <span className="text-text-primary font-medium">
                                  {selectedProject.assignedWorker.name}
                                </span>
                              </div>
                              {selectedProject.assignedWorker.department && (
                                <div className="flex justify-between">
                                  <span className="text-text-secondary">部门:</span>
                                  <span className="text-text-primary font-medium">
                                    {selectedProject.assignedWorker.department}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-text-secondary">暂未分配负责人</p>
                          )}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="mt-8 flex space-x-4">
                        <button className="px-6 py-2 bg-ios18-blue text-white rounded-ios-lg hover:bg-opacity-90 transition-all">
                          查看详情
                        </button>
                        <button className="px-6 py-2 border border-macos15-separator text-text-primary rounded-ios-lg hover:bg-macos15-control transition-all">
                          编辑项目
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-text-secondary">请从左侧树形导航选择一个项目</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* 功能说明 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">功能特点</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-ios18-blue bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-ios18-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">树形结构</h4>
                      <p className="text-sm text-text-secondary">按状态或优先级分组显示项目，层级清晰</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-status-success bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">实时搜索</h4>
                      <p className="text-sm text-text-secondary">支持按项目名称、描述和负责人搜索</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-status-warning bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">                    
                      <svg className="w-4 h-4 text-status-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">交互动画</h4>
                      <p className="text-sm text-text-secondary">流畅的展开折叠动画和选中效果</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-ios18-purple bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-ios18-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">键盘导航</h4>
                      <p className="text-sm text-text-secondary">支持方向键、回车等键盘操作</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-ios18-indigo bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-ios18-indigo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">状态统计</h4>
                      <p className="text-sm text-text-secondary">实时显示各状态项目数量统计</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-status-error bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">macOS 15风格</h4>
                      <p className="text-sm text-text-secondary">原生macOS 15侧边栏设计风格</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}