'use client';

import { useState, useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { HiMagnifyingGlass, HiFunnel } from 'react-icons/hi2';

interface ProjectState {
  id: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assigned_worker_id?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  assignedWorker?: {
    id: number;
    name: string;
    department?: string;
  };
  materials?: any[];
  drawings?: any[];
}

export default function CompletedTasksPage() {
  const { completedProjects, loading, error, fetchCompletedProjects } = useProjectStore();
  const [workerNameFilter, setWorkerNameFilter] = useState('');
  const [searchWorkerName, setSearchWorkerName] = useState('');

  useEffect(() => {
    fetchCompletedProjects();
  }, [fetchCompletedProjects]);

  const handleSearch = () => {
    setSearchWorkerName(workerNameFilter);
    fetchCompletedProjects(workerNameFilter || undefined);
  };

  const handleClearFilter = () => {
    setWorkerNameFilter('');
    setSearchWorkerName('');
    fetchCompletedProjects();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '-';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载已完成任务中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchCompletedProjects()}>重试</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">已完成任务</h1>
          <p className="text-gray-600">查看超过一天的已完成项目，支持按工人姓名筛选</p>
        </div>

        {/* 筛选器 */}
        <Card className="mb-6 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label htmlFor="workerName" className="block text-sm font-medium text-gray-700 mb-1">
                工人姓名筛选
              </label>
              <Input
                id="workerName"
                type="text"
                placeholder="输入工人姓名进行筛选..."
                value={workerNameFilter}
                onChange={(e) => setWorkerNameFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="w-full"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={handleSearch}
                className="flex items-center gap-2"
              >
                <HiMagnifyingGlass className="h-4 w-4" />
                搜索
              </Button>
              {searchWorkerName && (
                <Button
                  onClick={handleClearFilter}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <HiFunnel className="h-4 w-4" />
                  清除筛选
                </Button>
              )}
            </div>
          </div>
          {searchWorkerName && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                当前筛选: 工人姓名包含 "{searchWorkerName}"
              </p>
            </div>
          )}
        </Card>

        {/* 任务列表 */}
        {completedProjects.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <HiFunnel className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">暂无已完成任务</h3>
              <p className="text-sm">
                {searchWorkerName 
                  ? `没有找到工人姓名包含 "${searchWorkerName}" 的已完成任务`
                  : '目前没有超过一天的已完成任务'
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {completedProjects.map((project: ProjectState) => (
              <Card key={project.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.name}
                      </h3>
                      <StatusIndicator 
                        status={project.status} 
                        text="已完成"
                      />
                      <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                        优先级: {getPriorityText(project.priority)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">分配工人:</span>{' '}
                        {project.assignedWorker ? (
                          <span className="text-gray-900">
                            {project.assignedWorker.name}
                            {project.assignedWorker.department && (
                              <span className="text-gray-500 ml-1">
                                ({project.assignedWorker.department})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">未分配</span>
                        )}
                      </div>
                      
                      <div>
                        <span className="font-medium">完成时间:</span>{' '}
                        <span className="text-gray-900">
                          {formatDate(project.updated_at)}
                        </span>
                      </div>
                      
                      <div>
                        <span className="font-medium">创建时间:</span>{' '}
                        <span className="text-gray-900">
                          {formatDate(project.created_at)}
                        </span>
                      </div>
                      
                      {project.materials && project.materials.length > 0 && (
                        <div>
                          <span className="font-medium">板材数量:</span>{' '}
                          <span className="text-gray-900">
                            {project.materials.length} 个
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 统计信息 */}
        {completedProjects.length > 0 && (
          <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              共找到 <span className="font-medium text-gray-900">{completedProjects.length}</span> 个已完成任务
              {searchWorkerName && (
                <span>（筛选条件: 工人姓名包含 "{searchWorkerName}"）</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}