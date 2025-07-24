'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Worker {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  department?: string;
  position?: string;
  skillTags?: string;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    department: '',
    position: '',
    skillTags: [] as string[],
    notes: ''
  });

  const [newSkillTag, setNewSkillTag] = useState('');
  
  const { token } = useAuth();

  // 预设的技能标签
  const predefinedSkills = [
    '激光切割', '钣金加工', '焊接', '打磨', '装配',
    '质检', '设备维护', '图纸识读', 'CAD操作', '安全生产'
  ];

  // 预设的部门
  const departments = ['生产部', '质检部', '设备维护部', '仓储部', '技术部'];

  // 获取工人列表
  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取工人列表失败');
      }

      const data = await response.json();
      setWorkers(data.workers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取工人列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      department: '',
      position: '',
      skillTags: [],
      notes: ''
    });
    setNewSkillTag('');
    setEditingWorker(null);
    setShowCreateForm(false);
  };

  // 添加技能标签
  const addSkillTag = (tag: string) => {
    if (tag && !formData.skillTags.includes(tag)) {
      setFormData({
        ...formData,
        skillTags: [...formData.skillTags, tag]
      });
    }
    setNewSkillTag('');
  };

  // 移除技能标签
  const removeSkillTag = (tag: string) => {
    setFormData({
      ...formData,
      skillTags: formData.skillTags.filter(t => t !== tag)
    });
  };

  // 创建或更新工人
  const saveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('工人姓名不能为空');
      return;
    }

    try {
      setActionLoading(editingWorker ? editingWorker.id : -1);
      
      const payload = {
        ...formData,
        name: formData.name.trim(),
        skillTags: formData.skillTags.length > 0 ? formData.skillTags : undefined
      };

      const url = editingWorker 
        ? `/api/workers/${editingWorker.id}`
        : '/api/workers';
      
      const method = editingWorker ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `${editingWorker ? '更新' : '创建'}工人失败`);
      }

      // 重新获取工人列表
      await fetchWorkers();
      resetForm();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : `${editingWorker ? '更新' : '创建'}工人失败`);
    } finally {
      setActionLoading(null);
    }
  };

  // 编辑工人
  const editWorker = (worker: Worker) => {
    setFormData({
      name: worker.name,
      phone: worker.phone || '',
      email: worker.email || '',
      department: worker.department || '',
      position: worker.position || '',
      skillTags: worker.skillTags ? JSON.parse(worker.skillTags) : [],
      notes: worker.notes || ''
    });
    setEditingWorker(worker);
    setShowCreateForm(true);
  };

  // 删除工人
  const deleteWorker = async (workerId: number, workerName: string) => {
    if (!confirm(`确定要删除工人 "${workerName}" 吗？此操作不可恢复。`)) {
      return;
    }

    try {
      setActionLoading(workerId);
      const response = await fetch(`/api/workers/${workerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '删除工人失败');
      }

      // 重新获取工人列表
      await fetchWorkers();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除工人失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 切换工人状态
  const toggleWorkerStatus = async (worker: Worker) => {
    const newStatus = worker.status === 'active' ? 'inactive' : 'active';
    
    try {
      setActionLoading(worker.id);
      const response = await fetch(`/api/workers/${worker.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新工人状态失败');
      }

      // 重新获取工人列表
      await fetchWorkers();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新工人状态失败');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
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
            <p className="text-text-secondary">正在加载工人列表...</p>
          </motion.div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              工人管理
            </h1>
            <p className="text-text-secondary">
              管理生产工人信息和技能档案
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

          {/* 操作按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Button
              onClick={() => {
                resetForm();
                setShowCreateForm(!showCreateForm);
              }}
              variant={showCreateForm ? 'secondary' : 'primary'}
            >
              {showCreateForm ? '取消创建' : '+ 添加工人'}
            </Button>
          </motion.div>

          {/* 创建/编辑表单 */}
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
                    {editingWorker ? '编辑工人信息' : '添加新工人'}
                  </h2>
                  <form onSubmit={saveWorker} className="space-y-6">
                    {/* 基本信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="姓名 *"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="请输入工人姓名"
                        disabled={actionLoading !== null}
                      />
                      
                      <Input
                        label="联系电话"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="请输入联系电话"
                        disabled={actionLoading !== null}
                      />

                      <Input
                        label="邮箱地址"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="请输入邮箱地址"
                        disabled={actionLoading !== null}
                      />

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          所属部门
                        </label>
                        <select
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          disabled={actionLoading !== null}
                          className="w-full px-4 py-3 rounded-ios-lg border border-macos15-separator focus:border-ios18-blue focus:outline-none focus:ring-2 focus:ring-ios18-blue focus:ring-opacity-50"
                        >
                          <option value="">请选择部门</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <Input
                        label="职位"
                        type="text"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        placeholder="请输入职位"
                        disabled={actionLoading !== null}
                      />
                    </div>

                    {/* 技能标签 */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        技能标签
                      </label>
                      
                      {/* 当前标签 */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.skillTags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-ios18-blue bg-opacity-20 text-ios18-blue"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeSkillTag(tag)}
                              className="ml-2 text-ios18-blue hover:text-status-error"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* 添加标签 */}
                      <div className="flex gap-2 mb-3">
                        <Input
                          value={newSkillTag}
                          onChange={(e) => setNewSkillTag(e.target.value)}
                          placeholder="输入技能标签"
                          disabled={actionLoading !== null}
                        />
                        <Button
                          type="button"
                          onClick={() => addSkillTag(newSkillTag)}
                          disabled={!newSkillTag || actionLoading !== null}
                          size="sm"
                        >
                          添加
                        </Button>
                      </div>

                      {/* 预设标签 */}
                      <div className="flex flex-wrap gap-2">
                        {predefinedSkills.map(skill => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => addSkillTag(skill)}
                            disabled={formData.skillTags.includes(skill) || actionLoading !== null}
                            className="px-2 py-1 text-xs rounded-full border border-ios18-blue text-ios18-blue hover:bg-ios18-blue hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 备注 */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        备注信息
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="请输入备注信息"
                        disabled={actionLoading !== null}
                        rows={3}
                        className="w-full px-4 py-3 rounded-ios-lg border border-macos15-separator focus:border-ios18-blue focus:outline-none focus:ring-2 focus:ring-ios18-blue focus:ring-opacity-50 resize-none"
                      />
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        type="submit"
                        loading={actionLoading === (editingWorker?.id || -1)}
                        disabled={actionLoading !== null}
                      >
                        {editingWorker ? '更新工人' : '创建工人'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={resetForm}
                        disabled={actionLoading !== null}
                      >
                        取消
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>
            </motion.div>
          )}

          {/* 工人列表 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  工人列表 ({workers.length})
                </h2>
                
                {workers.length === 0 ? (
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
                    <p className="text-text-secondary">暂无工人信息</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workers.map((worker, index) => (
                      <motion.div
                        key={worker.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-start justify-between p-4 rounded-ios-lg bg-macos15-control"
                      >
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-ios18-blue rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {worker.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-text-primary">
                                {worker.name}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                worker.status === 'active' 
                                  ? 'bg-status-success bg-opacity-20 text-status-success'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {worker.status === 'active' ? '在职' : '离职'}
                              </span>
                            </div>
                            
                            <div className="text-sm text-text-secondary space-y-1">
                              {worker.department && (
                                <p>部门: {worker.department}</p>
                              )}
                              {worker.position && (
                                <p>职位: {worker.position}</p>
                              )}
                              {worker.phone && (
                                <p>电话: {worker.phone}</p>
                              )}
                              {worker.email && (
                                <p>邮箱: {worker.email}</p>
                              )}
                            </div>

                            {/* 技能标签 */}
                            {worker.skillTags && (
                              <div className="mt-2">
                                <div className="flex flex-wrap gap-1">
                                  {JSON.parse(worker.skillTags).map((tag: string, tagIndex: number) => (
                                    <span
                                      key={tagIndex}
                                      className="px-2 py-1 text-xs rounded-full bg-ios18-blue bg-opacity-10 text-ios18-blue"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {worker.notes && (
                              <p className="mt-2 text-sm text-text-secondary italic">
                                备注: {worker.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleWorkerStatus(worker)}
                            loading={actionLoading === worker.id}
                            disabled={actionLoading === worker.id}
                          >
                            {worker.status === 'active' ? '设为离职' : '设为在职'}
                          </Button>
                          
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => editWorker(worker)}
                            disabled={actionLoading === worker.id}
                          >
                            编辑
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => deleteWorker(worker.id, worker.name)}
                            loading={actionLoading === worker.id}
                            disabled={actionLoading === worker.id}
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
    </ProtectedRoute>
  );
}