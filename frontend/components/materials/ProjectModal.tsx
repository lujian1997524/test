'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Select, Form, FormField, FormActions } from '@/components/ui';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Worker {
  id: number;
  name: string;
  department: string;
  position: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedWorkerId: number | null;
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
  project?: {
    id: number;
    name: string;
    description?: string;
    status: string;
    priority: string;
    assignedWorker?: { id: number; name: string };
  } | null;
  loading?: boolean;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  project = null,
  loading = false
}) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    assignedWorkerId: null
  });
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { token } = useAuth();

  // 获取工人列表
  useEffect(() => {
    if (isOpen) {
      fetchWorkers();
    }
  }, [isOpen]);

  // 设置表单数据
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        status: project.status as any,
        priority: project.priority as any,
        assignedWorkerId: project.assignedWorker?.id || null
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        assignedWorkerId: null
      });
    }
    setFormErrors({});
  }, [project, isOpen]);

  const fetchWorkers = async () => {
    try {
      const response = await fetch('/api/workers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setWorkers(data.workers || []);
      }
    } catch (error) {
      console.error('获取工人列表失败:', error);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = '项目名称不能为空';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除对应字段的错误
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* 对话框 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl"
        >
          {/* 标题栏 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">
                {project ? '编辑项目' : '新建项目'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 表单内容 */}
          <div className="px-6 py-4">
            <form onSubmit={handleSubmit}>
              {/* 项目名称 */}
              <FormField label="项目名称" required error={formErrors.name}>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="请输入项目名称"
                  error={formErrors.name}
                />
              </FormField>

              {/* 项目描述 */}
              <FormField label="项目描述">
                <Input
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="请输入项目描述（可选）"
                />
              </FormField>

              {/* 状态和优先级 */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="项目状态">
                  <Select
                    value={formData.status}
                    onChange={(value) => handleInputChange('status', value)}
                    options={[
                      { value: 'pending', label: '待处理' },
                      { value: 'in_progress', label: '进行中' },
                      { value: 'completed', label: '已完成' }
                    ]}
                  />
                </FormField>

                <FormField label="优先级">
                  <Select
                    value={formData.priority}
                    onChange={(value) => handleInputChange('priority', value)}
                    options={[
                      { value: 'low', label: '低' },
                      { value: 'medium', label: '中' },
                      { value: 'high', label: '高' },
                      { value: 'urgent', label: '紧急' }
                    ]}
                  />
                </FormField>
              </div>

              {/* 分配工人 */}
              <FormField label="分配工人">
                <Select
                  value={formData.assignedWorkerId || ''}
                  onChange={(value) => handleInputChange('assignedWorkerId', value ? parseInt(value as string) : null)}
                  options={[
                    { value: '', label: '未分配' },
                    ...workers.map((worker) => ({
                      value: worker.id.toString(),
                      label: `${worker.name} - ${worker.department}`
                    }))
                  ]}
                  clearable
                />
              </FormField>
            </form>
          </div>

          {/* 底部按钮 */}
          <div className="px-6 py-4 border-t border-gray-200">
            <FormActions>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
              >
                取消
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                loading={loading}
                disabled={loading}
              >
                {project ? '保存修改' : '创建项目'}
              </Button>
            </FormActions>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};