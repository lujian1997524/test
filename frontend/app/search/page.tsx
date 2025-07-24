'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout';
import { SearchInput } from '@/components/search/SearchInput';
import { SearchResults } from '@/components/search/SearchResults';
import { AdvancedFilters } from '@/components/search/AdvancedFilters';
import { useAuth } from '@/contexts/AuthContext';

interface SearchResult {
  id: number;
  name?: string;
  filename?: string;
  description?: string;
  status?: string;
  priority?: string;
  department?: string;
  position?: string;
  phone?: string;
  email?: string;
  creator?: { id: number; name: string };
  assignedWorker?: { id: number; name: string; department: string };
  project?: { id: number; name: string };
  uploader?: { id: number; name: string };
  createdAt: string;
  updatedAt?: string;
  type: 'project' | 'worker' | 'drawing';
}

interface SearchResultsData {
  projects: SearchResult[];
  workers: SearchResult[];
  drawings: SearchResult[];
  total: number;
}

export default function SearchPage() {
  const [results, setResults] = useState<SearchResultsData>({
    projects: [],
    workers: [],
    drawings: [],
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: '',
    priority: '',
    department: '',
    dateFrom: '',
    dateTo: '',
    sort: 'relevance'
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = useAuth();

  // 从 URL 参数获取初始搜索词
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setCurrentQuery(query);
      performSearch(query, filters);
    }
  }, [searchParams]);

  // 配置侧边栏导航
  const sidebarItems = [
    {
      id: 'search-results',
      label: '搜索结果',
      active: true,
      children: [
        { id: 'all', label: `全部 (${results.total})`, active: filters.type === 'all' },
        { id: 'projects', label: `📋 项目 (${results.projects.length})`, active: filters.type === 'projects' },
        { id: 'workers', label: `👥 工人 (${results.workers.length})`, active: filters.type === 'workers' },
        { id: 'drawings', label: `📐 图纸 (${results.drawings.length})`, active: filters.type === 'drawings' }
      ]
    },
    {
      id: 'quick-nav',
      label: '快速导航',
      children: [
        { 
          id: 'dashboard', 
          label: '📈 仪表板',
          onClick: () => router.push('/dashboard')
        },
        { 
          id: 'projects-manage', 
          label: '📋 项目管理',
          onClick: () => router.push('/projects')
        },
        { 
          id: 'workers-manage', 
          label: '👥 工人管理',
          onClick: () => router.push('/workers')
        },
        { 
          id: 'drawings-manage', 
          label: '📐 图纸管理',
          onClick: () => router.push('/drawings')
        }
      ]
    }
  ];

  // 执行搜索
  const performSearch = async (query: string, searchFilters = filters) => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError('');

      // 使用高级搜索 API
      const response = await fetch('/api/search/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: query.trim(),
          ...searchFilters,
          limit: 50
        }),
      });

      if (!response.ok) {
        throw new Error('搜索失败');
      }

      const data = await response.json();
      setResults(data.results);
      setCurrentQuery(query);

      // 更新 URL
      const params = new URLSearchParams(searchParams.toString());
      params.set('q', query.trim());
      router.replace(`/search?${params.toString()}`, { scroll: false });

    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
      setResults({ projects: [], workers: [], drawings: [], total: 0 });
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = (query: string) => {
    performSearch(query, filters);
  };

  // 处理筛选变更
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    if (currentQuery) {
      performSearch(currentQuery, newFilters);
    }
  };

  // 处理结果点击
  const handleResultClick = (result: SearchResult) => {
    // 可以在此处添加点击统计或其他逻辑
    console.log('点击搜索结果:', result);
  };

  return (
    <MainLayout
      headerTitle="全局搜索"
      headerSubtitle="搜索项目、工人、图纸等内容"
      sidebarItems={sidebarItems}
      headerActions={
        <div className="flex items-center space-x-3">
          <AdvancedFilters onFilterChange={handleFilterChange} />
        </div>
      }
    >
      <div className="container mx-auto px-4 py-8">
        {/* 搜索输入 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <SearchInput
            onSearch={handleSearch}
            placeholder="搜索项目、工人、图纸..."
            className="max-w-2xl mx-auto"
          />
        </motion.div>

        {/* 错误提示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-4 mb-8"
          >
            <div className="flex items-center space-x-2">
              <span className="text-red-500 text-xl">⚠️</span>
              <p className="text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {/* 搜索结果 */}
        {(currentQuery || loading) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <SearchResults
              results={results}
              query={currentQuery}
              loading={loading}
              onResultClick={handleResultClick}
            />
          </motion.div>
        )}

        {/* 空状态 - 未搜索时 */}
        {!currentQuery && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center py-16"
          >
            <div className="text-8xl mb-6">🔍</div>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">
              开始搜索内容
            </h2>
            <p className="text-text-secondary max-w-md mx-auto mb-8">
              输入关键词搜索项目、工人资料、图纸文件等内容。支持模糊匹配和高级筛选功能。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200 p-6"
              >
                <div className="text-3xl mb-3">📋</div>
                <h3 className="font-medium text-text-primary mb-2">搜索项目</h3>
                <p className="text-sm text-text-secondary">
                  查找生产项目信息
                </p>
              </motion.div>
              
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200 p-6"
              >
                <div className="text-3xl mb-3">👥</div>
                <h3 className="font-medium text-text-primary mb-2">搜索工人</h3>
                <p className="text-sm text-text-secondary">
                  查找工人联系信息
                </p>
              </motion.div>
              
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200 p-6"
              >
                <div className="text-3xl mb-3">📐</div>
                <h3 className="font-medium text-text-primary mb-2">搜索图纸</h3>
                <p className="text-sm text-text-secondary">
                  查找图纸文件资源
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}