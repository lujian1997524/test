'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

interface Worker {
  id: number;
  name: string;
  phone: string;  // 手机号改为必填
  department?: string;
  projectCount?: number;  // 关联项目数量
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: number;
  name: string;
  workerCount?: number;
}

interface WorkerManagementProps {
  className?: string;
  onClose?: () => void;
}

export const WorkerManagement: React.FC<WorkerManagementProps> = ({ className = '', onClose }) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: ''
  });
  const [departmentFormData, setDepartmentFormData] = useState({ name: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // 获取工人列表
  const fetchWorkers = async () => {
    if (!token) {
      console.warn('没有token，无法获取工人数据');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/workers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkers(data.workers || data);
      } else {
        console.error('获取工人数据失败:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('获取工人数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取部门列表
  const fetchDepartments = async () => {
    if (!token) {
      console.warn('没有token，无法获取部门数据');
      return;
    }
    
    try {
      const response = await fetch('/api/departments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || data);
      } else {
        console.error('获取部门数据失败:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('获取部门数据失败:', error);
    }
  };

  // 创建部门
  const createDepartment = async (name: string) => {
    if (!token) {
      console.warn('没有token，无法创建部门');
      return;
    }
    
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: name.trim() })
      });
      
      if (response.ok) {
        fetchDepartments();
        return true;
      } else {
        const errorData = await response.json();
        alert(`创建部门失败: ${errorData.message || '未知错误'}`);
        return false;
      }
    } catch (error) {
      console.error('创建部门失败:', error);
      alert('创建失败，请重试');
      return false;
    }
  };

  // 删除部门
  const deleteDepartment = async (departmentId: number, departmentName: string) => {
    if (!token) {
      console.warn('没有token，无法删除部门');
      return;
    }
    
    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchDepartments();
        return true;
      } else {
        const errorData = await response.json();
        alert(`删除部门失败: ${errorData.message || '未知错误'}`);
        return false;
      }
    } catch (error) {
      console.error('删除部门失败:', error);
      alert('删除失败，请重试');
      return false;
    }
  };

  useEffect(() => {
    if (token) {
      fetchWorkers();
      fetchDepartments();
    }
  }, [token]);

  // 表单验证
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = '工人姓名不能为空';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = '手机号不能为空';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      errors.phone = '请输入有效的手机号';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      department: ''
    });
    setEditingWorker(null);
    setFormErrors({});
  };

  // 跳转到主页面并筛选活跃项目
  const handleJumpToProjects = (workerName: string) => {
    // 关闭工人管理模式，回到主页面的活跃项目视图
    window.dispatchEvent(new CustomEvent('close-worker-management', { 
      detail: { workerName, viewType: 'active' } // 明确指定跳转到活跃项目
    }));
  };

  // 过滤工人
  const filteredWorkers = selectedDepartment === 'all' 
    ? workers 
    : workers.filter(worker => worker.department === selectedDepartment);

  // 按部门分组工人
  const groupedWorkers = filteredWorkers.reduce((groups, worker) => {
    const dept = worker.department || '未分配部门';
    if (!groups[dept]) {
      groups[dept] = [];
    }
    groups[dept].push(worker);
    return groups;
  }, {} as Record<string, Worker[]>);

  // 打开新建工人对话框
  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  // 打开编辑工人对话框
  const openEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      phone: worker.phone,
      department: worker.department || ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  // 保存工人
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitLoading(true);
      const url = editingWorker ? `/api/workers/${editingWorker.id}` : '/api/workers';
      const method = editingWorker ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        fetchWorkers();
      } else {
        const errorData = await response.json();
        alert(`操作失败: ${errorData.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('保存工人数据失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 删除工人
  const handleDelete = async (workerId: number, workerName: string) => {
    if (!confirm(`确定要删除工人 "${workerName}" 吗？此操作不可撤销。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/workers/${workerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchWorkers();
      } else {
        const errorData = await response.json();
        alert(`删除失败: ${errorData.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('删除工人失败:', error);
      alert('删除失败，请重试');
    }
  };

  if (loading) {
    return (
      <Card className={`flex items-center justify-center h-64 ${className}`}>
        <motion.div
          className="flex items-center space-x-3 text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-5 h-5 border-2 border-ios18-blue border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <span>加载中...</span>
        </motion.div>
      </Card>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 标题栏 */}
      <Card className="flex-shrink-0" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary">工人管理</h2>
            <p className="text-text-secondary text-sm mt-1">管理工人信息和部门分配</p>
          </div>
          {isAdmin && (
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDepartmentModal(true)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                部门管理
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={openCreateModal}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                添加工人
              </Button>
            </div>
          )}
        </div>

        {/* 部门筛选 */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-text-secondary">筛选部门:</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedDepartment('all')}
            className={`px-3 py-1 rounded-full text-sm transition-all ${
              selectedDepartment === 'all'
                ? 'bg-ios18-blue text-white'
                : 'bg-macos15-control text-text-secondary hover:bg-macos15-control/80'
            }`}
          >
            全部 ({workers.length})
          </motion.button>
          {departments.map(dept => {
            const count = workers.filter(w => w.department === dept.name).length;
            return (
              <motion.button
                key={dept.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDepartment(dept.name)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedDepartment === dept.name
                    ? 'bg-ios18-blue text-white'
                    : 'bg-macos15-control text-text-secondary hover:bg-macos15-control/80'
                }`}
              >
                {dept.name} ({count})
              </motion.button>
            );
          })}
        </div>
      </Card>

      {/* 工人列表 - 全高度自适应 */}
      <Card className="flex-1 mt-4 overflow-hidden" padding="none">
        {Object.keys(groupedWorkers).length === 0 ? (
          <motion.div
            className="flex items-center justify-center h-full text-text-secondary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </motion.div>
              <p className="text-lg font-medium mb-2">
                {selectedDepartment === 'all' ? '暂无工人数据' : `${selectedDepartment}部门暂无工人`}
              </p>
              <p className="text-sm mb-4">开始添加第一个工人吧</p>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openCreateModal}
                >
                  立即添加
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="h-full overflow-auto">
            {Object.entries(groupedWorkers).map(([departmentName, deptWorkers]) => (
              <motion.div
                key={departmentName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border-b border-macos15-separator last:border-b-0"
              >
                {/* 部门标题 */}
                <div className="px-6 py-3 bg-macos15-control/20 border-b border-macos15-separator">
                  <h3 className="font-semibold text-text-primary flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {departmentName}
                    <span className="ml-2 px-2 py-1 bg-ios18-blue/10 text-ios18-blue rounded-full text-xs">
                      {deptWorkers.length}人
                    </span>
                  </h3>
                </div>

                {/* 该部门的工人列表 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-macos15-control/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">姓名</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">电话</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">项目数量</th>
                        {isAdmin && (
                          <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">操作</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-macos15-separator">
                      <AnimatePresence>
                        {deptWorkers.map((worker, index) => (
                          <motion.tr
                            key={worker.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-macos15-control/20 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-text-primary">{worker.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-text-secondary text-sm">
                              {worker.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleJumpToProjects(worker.name)}
                                className="inline-flex items-center px-3 py-1 bg-ios18-blue/10 text-ios18-blue rounded-full text-sm font-medium hover:bg-ios18-blue/20 transition-colors"
                              >
                                {worker.projectCount || 0} 个项目
                                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </motion.button>
                            </td>
                            {isAdmin && (
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditModal(worker)}
                                  >
                                    编辑
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDelete(worker.id, worker.name)}
                                  >
                                    删除
                                  </Button>
                                </div>
                              </td>
                            )}
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* 工人表单模态框 */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card padding="none" glass>
                <div className="px-6 py-4 border-b border-macos15-separator">
                  <h3 className="text-lg font-bold text-text-primary">
                    {editingWorker ? '编辑工人' : '添加工人'}
                  </h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <Input
                    label="姓名"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="请输入工人姓名"
                    error={formErrors.name}
                    required
                  />

                  <Input
                    label="手机号"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="请输入手机号"
                    error={formErrors.phone}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      部门
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-4 py-3 rounded-ios-lg border border-macos15-separator bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ios18-blue focus:ring-opacity-50 focus:border-ios18-blue"
                    >
                      <option value="">选择部门</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowModal(false)}
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={submitLoading}
                    >
                      {editingWorker ? '更新' : '创建'}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 部门管理模态框 */}
      <AnimatePresence>
        {showDepartmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDepartmentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card padding="none" glass>
                <div className="px-6 py-4 border-b border-macos15-separator">
                  <h3 className="text-lg font-bold text-text-primary">
                    部门管理
                  </h3>
                </div>

                <div className="p-6">
                  {/* 部门列表 */}
                  <div className="space-y-2 mb-4 max-h-60 overflow-auto">
                    {departments.map(dept => (
                      <div key={dept.id} className="flex items-center justify-between p-3 bg-macos15-control/20 rounded-lg">
                        <span className="font-medium text-text-primary">{dept.name}</span>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={async () => {
                            if (confirm(`确定要删除部门 "${dept.name}" 吗？`)) {
                              await deleteDepartment(dept.id, dept.name);
                            }
                          }}
                        >
                          删除
                        </Button>
                      </div>
                    ))}
                    {departments.length === 0 && (
                      <p className="text-text-secondary text-center py-4">暂无部门</p>
                    )}
                  </div>

                  {/* 添加新部门 */}
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (departmentFormData.name.trim()) {
                      const success = await createDepartment(departmentFormData.name);
                      if (success) {
                        setDepartmentFormData({ name: '' });
                      }
                    }
                  }} className="space-y-4">
                    <Input
                      label="新部门名称"
                      value={departmentFormData.name}
                      onChange={(e) => setDepartmentFormData({ name: e.target.value })}
                      placeholder="请输入部门名称"
                    />
                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowDepartmentModal(false)}
                      >
                        关闭
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={!departmentFormData.name.trim()}
                      >
                        添加部门
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};