'use client';

import React, { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuth } from '@/contexts/AuthContext';

export default function DebugProjectUpdates() {
  const [logs, setLogs] = useState<string[]>([]);
  const { token, isAuthenticated } = useAuth();
  const { connectSSE, isSSEConnected } = useNotificationStore();
  
  // 订阅项目store状态
  const { projects, lastUpdated, loading } = useProjectStore();

  // 添加日志
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev.slice(-19), logMessage]); // 保留最新20条
  };

  // 监控项目数量变化
  useEffect(() => {
    addLog(`项目数量: ${projects.length}, lastUpdated: ${lastUpdated}`);
  }, [projects.length, lastUpdated]);

  // 监控SSE连接状态
  useEffect(() => {
    addLog(`SSE连接状态: ${isSSEConnected ? '已连接' : '未连接'}`);
  }, [isSSEConnected]);

  // 建立SSE连接
  useEffect(() => {
    if (isAuthenticated && token && !isSSEConnected) {
      addLog('正在建立SSE连接...');
      connectSSE(token).then((success) => {
        addLog(`SSE连接结果: ${success ? '成功' : '失败'}`);
      });
    }
  }, [isAuthenticated, token, isSSEConnected, connectSSE]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          项目更新调试页面
        </h1>
        <p className="text-gray-600">
          监控项目状态更新和SSE事件
        </p>
      </div>

      {/* 状态指示器 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-2">项目数量</h3>
          <div className="text-2xl font-bold text-blue-600">
            {projects.length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-2">最后更新</h3>
          <div className="text-sm text-gray-600">
            {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '未更新'}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-2">SSE状态</h3>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isSSEConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isSSEConnected ? '已连接' : '未连接'}
          </div>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="bg-white rounded-lg border mb-6">
        <div className="p-4 border-b">
          <h3 className="font-medium text-gray-900">当前项目列表</h3>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : projects.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无项目</p>
          ) : (
            <div className="space-y-2">
              {projects.map((project, index) => (
                <div 
                  key={project.id} 
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium">{project.name}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      (ID: {project.id})
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === 'completed' ? 'bg-green-100 text-green-800' :
                    project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {project.status === 'completed' ? '已完成' :
                     project.status === 'in_progress' ? '进行中' : '待处理'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 日志区域 */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-medium text-gray-900">实时日志</h3>
          <button
            onClick={() => setLogs([])}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            清空日志
          </button>
        </div>
        <div className="p-4">
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">暂无日志...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="mt-6 flex space-x-4">
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          返回主页
        </button>
        <button
          onClick={() => window.location.href = '/sse-test'}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          SSE测试页面
        </button>
      </div>
    </div>
  );
}