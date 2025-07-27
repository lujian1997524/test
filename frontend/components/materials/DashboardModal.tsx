'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

// 仪表盘数据类型定义
interface DashboardStats {
  projects: {
    total: number;
    byStatus: {
      pending: number;
      in_progress: number;
      completed: number;
      cancelled?: number;
    };
  };
  workers: {
    total: number;
    workload: Array<{
      worker: {
        id: number;
        name: string;
        department?: string;
      };
      projectCount: number;
    }>;
  };
  materials: {
    byStatus: {
      pending: number;
      in_progress: number;
      completed: number;
    };
    thicknessUsage: Array<{
      spec: {
        id: number;
        thickness: string;
        unit: string;
        materialType?: string;
      };
      usage: number;
    }>;
  };
  drawings: {
    total: number;
    perProject: Array<{
      project: {
        id: number;
        name: string;
      };
      count: number;
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

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1d' | '7d' | '30d'>('7d');
  const { token } = useAuth();

  // 获取仪表盘统计数据
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // API返回结构是 {success: true, stats: {...}}
        setStats(data.stats);
      } else {
        throw new Error('获取统计数据失败');
      }
    } catch (err) {
      console.error('获取仪表盘统计数据失败:', err);
      setError(err instanceof Error ? err.message : '获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换全屏模式
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'pending': return '待处理';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  // 计算材料完成率
  const calculateMaterialCompletionRate = () => {
    if (!stats?.materials.byStatus) return 0;
    const { pending, in_progress, completed } = stats.materials.byStatus;
    const total = (pending || 0) + (in_progress || 0) + (completed || 0);
    return total > 0 ? (completed / total * 100) : 0;
  };

  useEffect(() => {
    if (isOpen && !stats) {
      fetchStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          isFullscreen 
            ? 'bg-gray-900' 
            : 'bg-black/50 backdrop-blur-sm p-4'
        }`}
        onClick={isFullscreen ? undefined : onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`overflow-hidden ${
            isFullscreen 
              ? 'h-full w-full' 
              : 'bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-6xl max-h-[90vh]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {isFullscreen ? (
            // 全屏监控大屏模式
            <FullscreenDashboard 
              stats={stats}
              onExitFullscreen={toggleFullscreen}
              selectedTimeRange={selectedTimeRange}
              onTimeRangeChange={setSelectedTimeRange}
            />
          ) : (
            // 常规仪表盘模式
            <NormalDashboard 
              stats={stats}
              loading={loading}
              error={error}
              onEnterFullscreen={toggleFullscreen}
              onRefresh={fetchStats}
              onClose={onClose}
              selectedTimeRange={selectedTimeRange}
              onTimeRangeChange={setSelectedTimeRange}
              calculateMaterialCompletionRate={calculateMaterialCompletionRate}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// 常规仪表盘组件
const NormalDashboard: React.FC<{
  stats: DashboardStats | null;
  loading: boolean;
  error: string;
  onEnterFullscreen: () => void;
  onRefresh: () => void;
  onClose: () => void;
  selectedTimeRange: '1d' | '7d' | '30d';
  onTimeRangeChange: (range: '1d' | '7d' | '30d') => void;
  calculateMaterialCompletionRate: () => number;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}> = ({ 
  stats, 
  loading, 
  error, 
  onEnterFullscreen, 
  onRefresh, 
  onClose, 
  selectedTimeRange, 
  onTimeRangeChange,
  calculateMaterialCompletionRate,
  getStatusColor,
  getStatusText
}) => {
  return (
    <>
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">生产概览仪表盘</h2>
          <p className="text-sm text-gray-600 mt-1">激光切割生产管理系统数据总览</p>
        </div>
        <div className="flex items-center space-x-2">
          {/* 时间范围选择 */}
          <select
            value={selectedTimeRange}
            onChange={(e) => onTimeRangeChange(e.target.value as '1d' | '7d' | '30d')}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="1d">今日</option>
            <option value="7d">近7天</option>
            <option value="30d">近30天</option>
          </select>

          {/* 全屏按钮 */}
          <button
            onClick={onEnterFullscreen}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>全屏监控</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm disabled:opacity-50"
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
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              重试
            </button>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* 核心数据卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 活跃项目 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">活跃项目</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.projects.byStatus.in_progress || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">进行中的项目</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* 完成率 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">材料完成率</p>
                    <p className="text-3xl font-bold text-green-600">
                      {Math.round(calculateMaterialCompletionRate())}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">已完成材料占比</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* 工人数量 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">在线工人</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.workers.total || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">系统中的工人总数</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* 图纸数量 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">图纸总数</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.drawings.total || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">系统中的图纸文件</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 详细数据区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 项目状态分布 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">项目状态分布</h3>
                <div className="space-y-4">
                  {Object.entries(stats.projects.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">{count}</span>
                        <span className="text-sm text-gray-500 ml-1">个</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* 工人项目分配 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">工人项目分配</h3>
                <div className="space-y-3">
                  {stats.workers.workload.slice(0, 5).map((worker, index) => (
                    <div key={worker.worker.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                          {worker.worker.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{worker.worker.name}</span>
                          {worker.worker.department && (
                            <span className="text-xs text-gray-500 ml-2">{worker.worker.department}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">{worker.projectCount}</span>
                        <span className="text-sm text-gray-500 ml-1">个项目</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* 材料状态详情 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">各厚度板材完成情况</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.materials.thicknessUsage.map((thickness, index) => (
                  <div key={thickness.spec.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-center mb-3">
                      <span className="text-lg font-bold text-gray-900">
                        {thickness.spec.thickness}{thickness.spec.unit}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">使用量</span>
                        <span className="font-medium">{thickness.usage}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>材料类型: {thickness.spec.materialType || '标准'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : null}
      </div>
    </>
  );
};

// 全屏监控大屏组件
const FullscreenDashboard: React.FC<{
  stats: DashboardStats | null;
  onExitFullscreen: () => void;
  selectedTimeRange: '1d' | '7d' | '30d';
  onTimeRangeChange: (range: '1d' | '7d' | '30d') => void;
}> = ({ stats, onExitFullscreen, selectedTimeRange, onTimeRangeChange }) => {
  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white overflow-auto">
      {/* 全屏模式标题栏 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            🏭 激光切割生产监控中心
          </h1>
          <p className="text-gray-400 mt-2">Real-time Production Monitoring Dashboard</p>
        </div>
        <button
          onClick={onExitFullscreen}
          className="text-gray-400 hover:text-white transition-colors p-2"
          title="退出全屏"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 核心指标区域 */}
      <div className="grid grid-cols-4 gap-6 p-6">
        {/* 今日产量 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-center border border-blue-500/30"
        >
          <div className="text-blue-200 text-sm uppercase tracking-wide mb-2">Today Production</div>
          <div className="text-5xl font-bold text-white mb-2">
            {stats?.materials.byStatus.completed || 0}
          </div>
          <div className="text-blue-200 text-sm">完成材料数</div>
          <div className="mt-4 w-full bg-blue-700 rounded-full h-2">
            <motion.div 
              className="bg-blue-300 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '75%' }}
              transition={{ duration: 2, delay: 0.5 }}
            />
          </div>
        </motion.div>

        {/* 完成率 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-6 text-center border border-green-500/30"
        >
          <div className="text-green-200 text-sm uppercase tracking-wide mb-2">Completion Rate</div>
          <div className="text-5xl font-bold text-white mb-2">
            {stats ? Math.round((stats.materials.byStatus.completed / (stats.materials.byStatus.pending + stats.materials.byStatus.in_progress + stats.materials.byStatus.completed)) * 100) : 0}%
          </div>
          <div className="text-green-200 text-sm">材料完成率</div>
          <div className="mt-4 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-green-300 border-t-transparent animate-spin"></div>
          </div>
        </motion.div>

        {/* 活跃工人 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 text-center border border-purple-500/30"
        >
          <div className="text-purple-200 text-sm uppercase tracking-wide mb-2">Active Workers</div>
          <div className="text-5xl font-bold text-white mb-2">
            {stats?.workers.total || 0}
          </div>
          <div className="text-purple-200 text-sm">在线工人</div>
          <div className="mt-4 flex justify-center space-x-1">
            {[...Array(Math.min(stats?.workers.total || 0, 8))].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-8 bg-purple-300 rounded"
                initial={{ height: 0 }}
                animate={{ height: Math.random() * 32 + 16 }}
                transition={{ duration: 1, delay: i * 0.1 }}
              />
            ))}
          </div>
        </motion.div>

        {/* 异常警报 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6 text-center border border-orange-500/30"
        >
          <div className="text-orange-200 text-sm uppercase tracking-wide mb-2">System Status</div>
          <div className="text-5xl font-bold text-white mb-2">0</div>
          <div className="text-orange-200 text-sm">异常警报</div>
          <motion.div 
            className="mt-4 w-8 h-8 mx-auto bg-green-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </div>

      {/* 详细数据区域 */}
      <div className="grid grid-cols-2 gap-6 p-6">
        {/* 工人效率实时排行 */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">工人项目分配排行</h3>
          <div className="space-y-4">
            {stats?.workers.workload.slice(0, 6).map((worker, index) => (
              <motion.div
                key={worker.worker.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{worker.worker.name}</div>
                    <div className="text-gray-400 text-sm">{worker.worker.department || '生产部'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{worker.projectCount}</div>
                  <div className="text-gray-400 text-sm">项目</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 材料完成情况分布 */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">材料厚度完成分布</h3>
          <div className="grid grid-cols-2 gap-4">
            {stats?.materials.thicknessUsage.slice(0, 4).map((thickness, index) => {
              const maxUsage = Math.max(...(stats?.materials.thicknessUsage.map(t => t.usage) || [1]));
              const usageRate = maxUsage > 0 ? (thickness.usage / maxUsage * 100) : 0;
              return (
                <motion.div
                  key={thickness.spec.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="bg-gray-700/50 rounded-xl p-4 text-center"
                >
                  <div className="text-xl font-bold text-white mb-2">
                    {thickness.spec.thickness}{thickness.spec.unit}
                  </div>
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {thickness.usage}
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-3 mb-2">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${usageRate}%` }}
                      transition={{ duration: 1.5, delay: 0.8 + index * 0.1 }}
                    />
                  </div>
                  <div className="text-gray-400 text-sm">
                    使用量
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* 底部实时信息滚动 */}
      <div className="bg-gray-800/70 backdrop-blur-sm border-t border-gray-700 p-4">
        <div className="flex items-center space-x-8 text-gray-300">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>系统运行正常</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>数据实时更新中</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span>最后更新: {new Date().toLocaleTimeString('zh-CN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};