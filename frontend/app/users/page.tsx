'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdminRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface User {
  id: number;
  name: string;
  role: 'admin' | 'operator';
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'operator'>('operator');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  const { token } = useAuth();

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取用户列表失败');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建用户
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserName.trim()) {
      setError('用户名不能为空');
      return;
    }

    try {
      setActionLoading(-1); // 使用-1表示创建操作
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newUserName.trim(),
          role: newUserRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建用户失败');
      }

      // 重新获取用户列表
      await fetchUsers();
      
      // 重置表单
      setNewUserName('');
      setNewUserRole('operator');
      setShowCreateForm(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建用户失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 更新用户角色
  const updateUserRole = async (userId: number, newRole: 'admin' | 'operator') => {
    try {
      setActionLoading(userId);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新用户角色失败');
      }

      // 重新获取用户列表
      await fetchUsers();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新用户角色失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 删除用户
  const deleteUser = async (userId: number, userName: string) => {
    if (!confirm(`确定要删除用户 "${userName}" 吗？此操作不可恢复。`)) {
      return;
    }

    try {
      setActionLoading(userId);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '删除用户失败');
      }

      // 重新获取用户列表
      await fetchUsers();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除用户失败');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <AdminRoute>
        <div className="min-h-screen flex items-center justify-center bg-bg-primary">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <motion.div
              className="w-12 h-12 border-4 border-ios18-blue border-t-transparent rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-text-secondary">正在加载用户列表...</p>
          </motion.div>
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              用户管理
            </h1>
            <p className="text-text-secondary">
              管理系统用户和权限设置
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

          {/* 创建用户按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              variant={showCreateForm ? 'secondary' : 'primary'}
            >
              {showCreateForm ? '取消创建' : '+ 创建用户'}
            </Button>
          </motion.div>

          {/* 创建用户表单 */}
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-text-primary mb-4">
                    创建新用户
                  </h2>
                  <form onSubmit={createUser} className="space-y-4">
                    <Input
                      label="用户名"
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="请输入用户名"
                      disabled={actionLoading === -1}
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        用户角色
                      </label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'operator')}
                        disabled={actionLoading === -1}
                        className="w-full px-4 py-3 rounded-ios-lg border border-macos15-separator focus:border-ios18-blue focus:outline-none focus:ring-2 focus:ring-ios18-blue focus:ring-opacity-50"
                      >
                        <option value="operator">操作员</option>
                        <option value="admin">管理员</option>
                      </select>
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        type="submit"
                        loading={actionLoading === -1}
                        disabled={actionLoading === -1}
                      >
                        创建用户
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowCreateForm(false)}
                        disabled={actionLoading === -1}
                      >
                        取消
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>
            </motion.div>
          )}

          {/* 用户列表 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  用户列表 ({users.length})
                </h2>
                
                {users.length === 0 ? (
                  <div className="text-center py-8">
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-text-secondary">暂无用户</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center justify-between p-4 rounded-ios-lg bg-macos15-control"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-ios18-blue rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">
                              {user.name}
                            </p>
                            <p className="text-sm text-text-secondary">
                              创建时间: {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'operator')}
                            disabled={actionLoading === user.id}
                            className="px-3 py-2 rounded-ios-md border border-macos15-separator focus:border-ios18-blue focus:outline-none text-sm"
                          >
                            <option value="operator">操作员</option>
                            <option value="admin">管理员</option>
                          </select>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => deleteUser(user.id, user.name)}
                            loading={actionLoading === user.id}
                            disabled={actionLoading === user.id}
                          >
                            删除
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminRoute>
  );
}