'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function SSETestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('未连接');
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('高春强');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-20), `[${timestamp}] ${message}`]);
  };

  const login = async () => {
    try {
      addLog(`正在使用用户 ${username} 登录...`);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: username }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        addLog(`✅ 登录成功，获得token: ${data.token.substring(0, 20)}...`);
        return data.token;
      } else {
        addLog(`❌ 登录失败: ${response.statusText}`);
        return null;
      }
    } catch (error) {
      addLog(`❌ 登录错误: ${error}`);
      return null;
    }
  };

  const connectSSE = async () => {
    if (eventSource) {
      addLog('🔌 关闭现有SSE连接...');
      eventSource.close();
      setEventSource(null);
      setConnected(false);
    }

    let currentToken = token;
    if (!currentToken) {
      currentToken = await login();
      if (!currentToken) return;
    }

    try {
      addLog('🔌 建立SSE连接...');
      setConnectionStatus('连接中...');

      // 获取当前页面的hostname来构建SSE URL
      const hostname = window.location.hostname;
      let sseUrl: string;
      
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        // 直接连接到后端
        sseUrl = `http://${hostname}:35001/api/sse/connect?token=${encodeURIComponent(currentToken)}`;
        addLog(`📡 使用直连URL: ${sseUrl.substring(0, 50)}...`);
      } else {
        // 使用Next.js代理
        sseUrl = `/api/sse/connect?token=${encodeURIComponent(currentToken)}`;
        addLog(`📡 使用代理URL: ${sseUrl.substring(0, 50)}...`);
      }

      const es = new EventSource(sseUrl);
      setEventSource(es);

      es.onopen = () => {
        addLog('✅ SSE连接已建立');
        setConnected(true);
        setConnectionStatus('已连接');
      };

      es.onmessage = (event) => {
        addLog(`📨 收到消息: ${event.data}`);
      };

      es.onerror = () => {
        addLog(`❌ SSE连接错误`);
        setConnected(false);
        setConnectionStatus('连接失败');
      };

      // 监听自定义事件
      const eventTypes = ['connected', 'heartbeat', 'project-created', 'project-updated', 'project-deleted', 'project-status-changed', 'test'];
      
      eventTypes.forEach(eventType => {
        es.addEventListener(eventType, (event: any) => {
          addLog(`🎯 收到${eventType}事件: ${event.data}`);
        });
      });

    } catch (error) {
      addLog(`❌ SSE连接异常: ${error}`);
      setConnectionStatus('连接异常');
    }
  };

  const disconnectSSE = () => {
    if (eventSource) {
      addLog('🔌 断开SSE连接');
      eventSource.close();
      setEventSource(null);
      setConnected(false);
      setConnectionStatus('已断开');
    }
  };

  const createTestProject = async () => {
    if (!token) {
      addLog('❌ 请先登录');
      return;
    }

    try {
      addLog('📋 创建测试项目...');
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `SSE测试项目-${Date.now()}`,
          description: '用于测试SSE实时推送的项目',
          priority: 'high'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addLog(`✅ 项目创建成功: ${data.project.name} (ID: ${data.project.id})`);
      } else {
        addLog(`❌ 项目创建失败: ${response.statusText}`);
      }
    } catch (error) {
      addLog(`❌ 项目创建错误: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            SSE跨设备连接测试工具
          </h1>

          {/* 控制面板 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择用户
                </label>
                <select
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="高春强">高春强 (管理员)</option>
                  <option value="杨伟">杨伟 (操作员)</option>
                </select>
              </div>

              <button
                onClick={login}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                登录获取Token
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  连接状态
                </label>
                <div className={`px-3 py-2 rounded-lg text-center font-medium ${
                  connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {connectionStatus}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={connectSSE}
                  disabled={connected}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  连接SSE
                </button>
                <button
                  onClick={disconnectSSE}
                  disabled={!connected}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  断开连接
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  测试操作
                </label>
                <button
                  onClick={createTestProject}
                  disabled={!token}
                  className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  创建测试项目
                </button>
              </div>

              <button
                onClick={clearLogs}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                清空日志
              </button>
            </div>
          </div>

          {/* Token显示 */}
          {token && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">当前Token:</p>
              <p className="font-mono text-xs break-all">{token}</p>
            </div>
          )}

          {/* 日志面板 */}
          <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto">
            <div className="text-green-400 font-mono text-sm space-y-1">
              {logs.length === 0 ? (
                <p className="text-gray-500">等待日志...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))
              )}
            </div>
          </div>

          {/* 使用说明 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">测试步骤:</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>在电脑A上访问此页面，选择"高春强"用户并连接SSE</li>
              <li>在电脑B上访问 http://192.168.31.203:4000/sse-test</li>
              <li>在电脑B上选择"杨伟"用户并连接SSE</li>
              <li>在任一设备上点击"创建测试项目"</li>
              <li>观察另一设备是否收到实时通知</li>
            </ol>
          </div>
        </motion.div>
      </div>
    </div>
  );
}