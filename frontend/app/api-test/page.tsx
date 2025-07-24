'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ApiTestPage() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');

  const apiBaseUrl = '/api';

  const makeRequest = async (method, endpoint, data = null, requireAuth = false) => {
    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (requireAuth && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const config = {
        method,
        headers,
      };

      if (data) {
        config.body = JSON.stringify(data);
      }

      // 处理特殊的健康检查路径
      let url;
      if (endpoint === '/../health') {
        url = '/health';
      } else if (endpoint === '') {
        url = `${apiBaseUrl}`;
      } else {
        url = `${apiBaseUrl}${endpoint}`;
      }

      const res = await fetch(url, config);
      const result = await res.json();
      
      setResponse(JSON.stringify({ 
        status: res.status, 
        statusText: res.statusText, 
        data: result 
      }, null, 2));
    } catch (error) {
      setResponse(JSON.stringify({ error: error.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    if (!username) {
      alert('请输入用户名');
      return;
    }
    const result = await makeRequest('POST', '/auth/login', { name: username });
    
    // 尝试解析响应并提取token
    try {
      const parsedResult = JSON.parse(response);
      if (parsedResult.data && parsedResult.data.token) {
        setToken(parsedResult.data.token);
      }
    } catch (e) {
      console.log('无法解析响应获取token');
    }
  };

  const testEndpoints = [
    {
      name: '健康检查',
      method: 'GET',
      endpoint: '/../health',
      requireAuth: false,
    },
    {
      name: 'API信息',
      method: 'GET', 
      endpoint: '',
      requireAuth: false,
    },
    {
      name: '获取用户列表',
      method: 'GET',
      endpoint: '/users',
      requireAuth: true,
    },
    {
      name: '获取工人列表',
      method: 'GET',
      endpoint: '/workers',
      requireAuth: true,
    },
    {
      name: '获取项目列表',
      method: 'GET',
      endpoint: '/projects',
      requireAuth: true,
    },
    {
      name: '获取材料统计',
      method: 'GET',
      endpoint: '/materials/stats',
      requireAuth: true,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">API 测试页面</h1>
      
      {/* 认证部分 */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">用户认证</h2>
          <div className="flex gap-4 items-end mb-4">
            <div className="flex-1">
              <Input
                label="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名进行登录"
              />
            </div>
            <Button onClick={testLogin} disabled={loading}>
              登录
            </Button>
          </div>
          
          {token && (
            <div className="mb-4">
              <Input
                label="JWT Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="登录后自动填入token"
              />
            </div>
          )}
        </div>
      </Card>

      {/* API端点测试 */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">API 端点测试</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testEndpoints.map((endpoint, index) => (
              <Button
                key={index}
                variant={endpoint.requireAuth ? 'primary' : 'secondary'}
                onClick={() => makeRequest(endpoint.method, endpoint.endpoint, null, endpoint.requireAuth)}
                disabled={loading || (endpoint.requireAuth && !token)}
                className="text-left justify-start"
              >
                <div>
                  <div className="font-medium">{endpoint.name}</div>
                  <div className="text-sm opacity-70">
                    {endpoint.method} {endpoint.endpoint}
                  </div>
                  {endpoint.requireAuth && (
                    <div className="text-xs opacity-50">需要认证</div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* 响应结果 */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">响应结果</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {response || '点击上方按钮测试API端点...'}
            </pre>
          </div>
        </div>
      </Card>

      {/* 使用说明 */}
      <Card className="mt-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">使用说明</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. 首先需要创建一个用户，可以通过数据库直接插入或使用管理员账户创建</p>
            <p>2. 输入用户名点击登录获取JWT token</p>
            <p>3. 使用token测试需要认证的API端点</p>
            <p>4. 灰色按钮为不需要认证的端点，蓝色按钮为需要认证的端点</p>
          </div>
        </div>
      </Card>
    </div>
  );
}