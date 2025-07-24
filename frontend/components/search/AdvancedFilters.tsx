'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdvancedFiltersProps {
  onFilterChange: (filters: any) => void;
  className?: string;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  onFilterChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    status: '',
    priority: '',
    department: '',
    dateFrom: '',
    dateTo: '',
    sort: 'relevance'
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      type: 'all',
      status: '',
      priority: '',
      department: '',
      dateFrom: '',
      dateTo: '',
      sort: 'relevance'
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value && value !== 'all' && value !== 'relevance'
  ).length;

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl text-text-primary hover:bg-gray-50 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-lg">⚙️</span>
        <span>高级筛选</span>
        {activeFiltersCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center"
          >
            {activeFiltersCount}
          </motion.span>
        )}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-text-tertiary"
        >
          ▼
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 right-0 w-80 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-lg p-6 z-40"
          >
            <div className="space-y-6">
              {/* 标题 */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-text-primary">筛选条件</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  清除全部
                </button>
              </div>

              {/* 搜索类型 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  搜索类型
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">全部类型</option>
                  <option value="projects">项目</option>
                  <option value="workers">工人</option>
                  <option value="drawings">图纸</option>
                </select>
              </div>

              {/* 状态筛选 */}
              {(filters.type === 'all' || filters.type === 'projects') && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    项目状态
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">所有状态</option>
                    <option value="pending">待处理</option>
                    <option value="in_progress">进行中</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>
              )}

              {/* 优先级筛选 */}
              {(filters.type === 'all' || filters.type === 'projects') && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    优先级
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">所有优先级</option>
                    <option value="high">高优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="low">低优先级</option>
                  </select>
                </div>
              )}

              {/* 部门筛选 */}
              {(filters.type === 'all' || filters.type === 'workers') && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    部门
                  </label>
                  <select
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">所有部门</option>
                    <option value="激光切割部">激光切割部</option>
                    <option value="焊接部">焊接部</option>
                    <option value="质检部">质检部</option>
                    <option value="包装部">包装部</option>
                  </select>
                </div>
              )}

              {/* 日期范围 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  创建日期
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="开始日期"
                  />
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="结束日期"
                  />
                </div>
              </div>

              {/* 排序方式 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  排序方式
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="relevance">相关度</option>
                  <option value="date_desc">创建时间 (新→旧)</option>
                  <option value="date_asc">创建时间 (旧→新)</option>
                  <option value="name">名称排序</option>
                </select>
              </div>

              {/* 应用按钮 */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
                >
                  应用筛选
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};