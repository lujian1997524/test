'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  projects: {
    total: number;
    byStatus: {
      pending?: number;
      in_progress?: number;
      completed?: number;
    };
  };
  workers: {
    total: number;
    workload: Array<{
      worker: { id: number; name: string; department: string };
      projectCount: number;
    }>;
  };
  materials: {
    byStatus: {
      pending?: number;
      in_progress?: number;
      completed?: number;
    };
    thicknessUsage: Array<{
      spec: { id: number; thickness: string; unit: string; materialType: string };
      usage: number;
    }>;
  };
  drawings: {
    total: number;
    perProject: Array<{
      project: { id: number; name: string };
      count: number;
    }>;
  };
  recent: {
    projects: Array<{
      id: number;
      name: string;
      status: string;
      priority: string;
      creator: { id: number; name: string };
      assignedWorker?: { id: number; name: string };
      updatedAt: string;
    }>;
  };
  completion: Array<{
    id: number;
    name: string;
    rate: number;
  }>;
}

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StatsCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
}> = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-600',
    green: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 text-green-600',
    orange: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 text-orange-600',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl border backdrop-blur-xl ${colorClasses[color]} p-4`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </h3>
          <div className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-white/50">
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

const PieChart: React.FC<{
  title: string;
  data: Array<{ label: string; value: number; color: string }>;
}> = ({ title, data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200 p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        {title}
      </h3>
      
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              
              cumulativePercentage += percentage;
              
              return (
                <motion.circle
                  key={item.label}
                  cx="50"
                  cy="50"
                  r="35"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="6"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  initial={{ strokeDasharray: "0 100" }}
                  animate={{ strokeDasharray }}
                  transition={{ delay: index * 0.2, duration: 1, ease: "easeOut" }}
                />
              );
            })}
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {total}
              </div>
              <div className="text-xs text-gray-500">
                总计
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-700">
                {item.label}
              </span>
            </div>
            <span className="text-xs font-medium text-gray-600">
              {item.value}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 模拟API调用，因为后端可能没有这个接口
      // 这里先使用模拟数据
      const mockStats: DashboardStats = {
        projects: {
          total: 15,
          byStatus: {
            pending: 3,
            in_progress: 8,
            completed: 4
          }
        },
        workers: {
          total: 12,
          workload: [
            { worker: { id: 1, name: '张三', department: '生产部' }, projectCount: 3 },
            { worker: { id: 2, name: '李四', department: '技术部' }, projectCount: 2 },
            { worker: { id: 3, name: '王五', department: '生产部' }, projectCount: 4 }
          ]
        },
        materials: {
          byStatus: {
            pending: 25,
            in_progress: 18,
            completed: 42
          },
          thicknessUsage: []
        },
        drawings: {
          total: 28,
          perProject: []
        },
        recent: {
          projects: [
            {
              id: 1,
              name: '120斗链',
              status: 'in_progress',
              priority: 'high',
              creator: { id: 1, name: '高春强' },
              assignedWorker: { id: 2, name: '杨伟' },
              updatedAt: new Date().toISOString()
            }
          ]
        },
        completion: [
          { id: 1, name: '120斗链', rate: 75 },
          { id: 2, name: '83200', rate: 60 }
        ]
      };

      // 实际情况下应该调用真实API
      // const response = await fetch('/api/dashboard/stats', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // if (!response.ok) throw new Error('获取统计数据失败');
      // const data = await response.json();
      // setStats(data.stats);

      setTimeout(() => {
        setStats(mockStats);
        setLoading(false);
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : '获取统计数据失败');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !stats) {
      fetchStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const projectStatusData = stats ? [
    { label: '待处理', value: stats.projects.byStatus.pending || 0, color: '#f59e0b' },
    { label: '进行中', value: stats.projects.byStatus.in_progress || 0, color: '#3b82f6' },
    { label: '已完成', value: stats.projects.byStatus.completed || 0, color: '#10b981' }
  ] : [];

  const materialStatusData = stats ? [
    { label: '待处理', value: stats.materials.byStatus.pending || 0, color: '#f59e0b' },
    { label: '进行中', value: stats.materials.byStatus.in_progress || 0, color: '#3b82f6' },
    { label: '已完成', value: stats.materials.byStatus.completed || 0, color: '#10b981' }
  ] : [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">数据仪表板</h2>
              <p className="text-sm text-gray-600 mt-1">系统运营数据统计与分析</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchStats}
                disabled={loading}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>加载中</span>
                  </div>
                ) : (
                  '🔄 刷新'
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">正在加载统计数据...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchStats}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  重试
                </button>
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatsCard
                    title="总项目数"
                    value={stats.projects.total}
                    subtitle="全部项目"
                    icon={<span className="text-lg">📋</span>}
                    color="blue"
                  />
                  
                  <StatsCard
                    title="工人总数"
                    value={stats.workers.total}
                    subtitle="注册工人"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    }
                    color="green"
                  />
                  
                  <StatsCard
                    title="图纸总数"
                    value={stats.drawings.total}
                    subtitle="上传图纸"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                    color="purple"
                  />
                  
                  <StatsCard
                    title="完成板材"
                    value={stats.materials.byStatus.completed || 0}
                    subtitle="已完成数量"
                    icon={<span className="text-lg">✅</span>}
                    color="orange"
                  />
                </div>

                {/* 图表区域 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PieChart
                    title="项目状态分布"
                    data={projectStatusData}
                  />
                  
                  <PieChart
                    title="板材状态分布"
                    data={materialStatusData}
                  />
                </div>

                {/* 工人工作负载 */}
                {stats.workers.workload.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200 p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      工人工作负载
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {stats.workers.workload.slice(0, 6).map((item, index) => (
                        <motion.div
                          key={item.worker.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm">
                                {item.worker.name}
                              </h4>
                              <p className="text-xs text-gray-600">
                                {item.worker.department}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">
                                {item.projectCount}
                              </div>
                              <div className="text-xs text-gray-500">
                                个项目
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 最近活动 */}
                {stats.recent.projects.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200 p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      最近活动
                    </h3>
                    
                    <div className="space-y-3">
                      {stats.recent.projects.slice(0, 5).map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            project.status === 'completed' ? 'bg-green-500' :
                            project.status === 'in_progress' ? 'bg-blue-500' : 'bg-orange-500'
                          }`} />
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                              {project.name}
                            </h4>
                            <p className="text-xs text-gray-600 truncate">
                              创建者: {project.creator.name}
                              {project.assignedWorker && ` • 负责人: ${project.assignedWorker.name}`}
                            </p>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};