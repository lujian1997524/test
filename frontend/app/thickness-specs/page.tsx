'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdminRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ThicknessSpec {
  id: number;
  thickness: number;
  unit: string;
  materialType?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

// 可拖拽的厚度规格项组件
function SortableThicknessSpec({ 
  spec, 
  actionLoading, 
  onToggleActive, 
  onEdit, 
  onDelete 
}: {
  spec: ThicknessSpec;
  actionLoading: number | null;
  onToggleActive: (spec: ThicknessSpec) => void;
  onEdit: (spec: ThicknessSpec) => void;
  onDelete: (spec: ThicknessSpec) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: spec.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 rounded-ios-lg bg-macos15-control"
    >
      <div className="flex items-center space-x-4">
        {/* 拖拽手柄 */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
        >
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </div>
        
        <div className="w-12 h-12 bg-ios18-blue rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">
            {spec.thickness}{spec.unit}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-text-primary">
              {spec.thickness}{spec.unit}
            </h3>
            {spec.materialType && (
              <span className="px-2 py-1 text-xs rounded-full bg-ios18-blue bg-opacity-20 text-ios18-blue">
                {spec.materialType}
              </span>
            )}
            <span className={`px-2 py-1 text-xs rounded-full ${
              spec.isActive 
                ? 'bg-status-success bg-opacity-20 text-status-success'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {spec.isActive ? '启用' : '禁用'}
            </span>
          </div>
          <div className="text-sm text-text-secondary">
            排序: {spec.sortOrder} | 创建时间: {new Date(spec.createdAt).toLocaleDateString('zh-CN')}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleActive(spec)}
          loading={actionLoading === spec.id}
          disabled={actionLoading === spec.id}
        >
          {spec.isActive ? '禁用' : '启用'}
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(spec)}
          disabled={actionLoading === spec.id}
        >
          编辑
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(spec)}
          loading={actionLoading === spec.id}
          disabled={actionLoading === spec.id}
        >
          删除
        </Button>
      </div>
    </div>
  );
}

export default function ThicknessSpecsPage() {
  const [thicknessSpecs, setThicknessSpecs] = useState<ThicknessSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSpec, setEditingSpec] = useState<ThicknessSpec | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [sortLoading, setSortLoading] = useState(false);
  
  // 表单状态
  const [formData, setFormData] = useState({
    thickness: '',
    unit: 'mm',
    materialType: '',
    isActive: true,
    sortOrder: '0'
  });
  
  const { token } = useAuth();

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 预设材料类型
  const materialTypes = [
    '不锈钢', '碳钢', '铝合金', '镀锌板', '铜板', '钛合金'
  ];

  // 处理拖拽结束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = thicknessSpecs.findIndex((spec) => spec.id === active.id);
      const newIndex = thicknessSpecs.findIndex((spec) => spec.id === over.id);

      const newSpecs = arrayMove(thicknessSpecs, oldIndex, newIndex);
      
      // 更新前端排序显示
      setThicknessSpecs(newSpecs);

      // 准备排序数据
      const sortData = newSpecs.map((spec, index) => ({
        id: spec.id,
        sortOrder: index
      }));

      // 发送到后端更新排序
      try {
        setSortLoading(true);
        const response = await fetch('/api/thickness-specs/batch/sort', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ sortData }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '更新排序失败');
        }

        // 重新获取最新数据
        await fetchThicknessSpecs();
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新排序失败');
        // 恢复原来的排序
        await fetchThicknessSpecs();
      } finally {
        setSortLoading(false);
      }
    }
  };

  // 获取厚度规格列表
  const fetchThicknessSpecs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/thickness-specs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取厚度规格列表失败');
      }

      const data = await response.json();
      setThicknessSpecs(data.thicknessSpecs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取厚度规格列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      thickness: '',
      unit: 'mm',
      materialType: '',
      isActive: true,
      sortOrder: '0'
    });
    setEditingSpec(null);
    setShowCreateForm(false);
  };

  // 创建或更新厚度规格
  const saveThicknessSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.thickness.trim()) {
      setError('厚度值不能为空');
      return;
    }

    const thickness = parseFloat(formData.thickness);
    if (isNaN(thickness) || thickness <= 0) {
      setError('厚度值必须为有效的正数');
      return;
    }

    try {
      setActionLoading(editingSpec ? editingSpec.id : -1);
      
      const payload = {
        thickness,
        unit: formData.unit,
        materialType: formData.materialType.trim() || undefined,
        isActive: formData.isActive,
        sortOrder: parseInt(formData.sortOrder) || 0
      };

      const url = editingSpec 
        ? `/api/thickness-specs/${editingSpec.id}`
        : '/api/thickness-specs';
      
      const method = editingSpec ? 'PUT' : 'POST';

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
        throw new Error(data.error || `${editingSpec ? '更新' : '创建'}厚度规格失败`);
      }

      // 重新获取规格列表
      await fetchThicknessSpecs();
      resetForm();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : `${editingSpec ? '更新' : '创建'}厚度规格失败`);
    } finally {
      setActionLoading(null);
    }
  };

  // 编辑厚度规格
  const editThicknessSpec = (spec: ThicknessSpec) => {
    setFormData({
      thickness: spec.thickness.toString(),
      unit: spec.unit,
      materialType: spec.materialType || '',
      isActive: spec.isActive,
      sortOrder: spec.sortOrder.toString()
    });
    setEditingSpec(spec);
    setShowCreateForm(true);
  };

  // 切换启用状态
  const toggleActive = async (spec: ThicknessSpec) => {
    try {
      setActionLoading(spec.id);
      const response = await fetch(`/api/thickness-specs/${spec.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !spec.isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新状态失败');
      }

      await fetchThicknessSpecs();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新状态失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 删除厚度规格
  const deleteThicknessSpec = async (spec: ThicknessSpec) => {
    const displayName = `${spec.thickness}${spec.unit}${spec.materialType ? ` (${spec.materialType})` : ''}`;
    
    if (!confirm(`确定要删除厚度规格 "${displayName}" 吗？此操作不可恢复。`)) {
      return;
    }

    try {
      setActionLoading(spec.id);
      const response = await fetch(`/api/thickness-specs/${spec.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '删除厚度规格失败');
      }

      await fetchThicknessSpecs();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除厚度规格失败');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchThicknessSpecs();
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
            <p className="text-text-secondary">正在加载厚度规格...</p>
          </motion.div>
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-5xl mx-auto">
          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              厚度规格配置
            </h1>
            <p className="text-text-secondary">
              管理板材厚度规格和材料类型配置（仅管理员）
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
              {showCreateForm ? '取消创建' : '+ 添加厚度规格'}
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
                    {editingSpec ? '编辑厚度规格' : '添加新厚度规格'}
                  </h2>
                  <form onSubmit={saveThicknessSpec} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="厚度值 *"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.thickness}
                        onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                        placeholder="请输入厚度值"
                        disabled={actionLoading !== null}
                      />

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          单位
                        </label>
                        <select
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          disabled={actionLoading !== null}
                          className="w-full px-4 py-3 rounded-ios-lg border border-macos15-separator focus:border-ios18-blue focus:outline-none focus:ring-2 focus:ring-ios18-blue focus:ring-opacity-50"
                        >
                          <option value="mm">毫米 (mm)</option>
                          <option value="cm">厘米 (cm)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          材料类型
                        </label>
                        <select
                          value={formData.materialType}
                          onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                          disabled={actionLoading !== null}
                          className="w-full px-4 py-3 rounded-ios-lg border border-macos15-separator focus:border-ios18-blue focus:outline-none focus:ring-2 focus:ring-ios18-blue focus:ring-opacity-50"
                        >
                          <option value="">通用（不限材料）</option>
                          {materialTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <Input
                        label="排序"
                        type="number"
                        min="0"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                        placeholder="排序顺序"
                        disabled={actionLoading !== null}
                      />

                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            disabled={actionLoading !== null}
                            className="mr-2 w-4 h-4 text-ios18-blue border-macos15-separator rounded focus:ring-ios18-blue"
                          />
                          <span className="text-sm font-medium text-text-primary">
                            启用此规格
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        type="submit"
                        loading={actionLoading === (editingSpec?.id || -1)}
                        disabled={actionLoading !== null}
                      >
                        {editingSpec ? '更新规格' : '创建规格'}
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

          {/* 厚度规格列表 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  厚度规格列表 ({thicknessSpecs.length})
                  {thicknessSpecs.length > 1 && (
                    <span className="ml-2 text-sm font-normal text-text-secondary">
                      拖拽调整排序
                    </span>
                  )}
                </h2>
                
                {thicknessSpecs.length === 0 ? (
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
                          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z"
                        />
                      </svg>
                    </div>
                    <p className="text-text-secondary">暂无厚度规格配置</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext 
                        items={thicknessSpecs.map(spec => spec.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {thicknessSpecs.map((spec) => (
                          <SortableThicknessSpec
                            key={spec.id}
                            spec={spec}
                            actionLoading={actionLoading}
                            onToggleActive={toggleActive}
                            onEdit={editThicknessSpec}
                            onDelete={deleteThicknessSpec}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                    
                    {/* 排序加载提示 */}
                    {sortLoading && (
                      <div className="text-center py-2">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-ios18-blue bg-opacity-10">
                          <motion.div
                            className="w-4 h-4 border-2 border-ios18-blue border-t-transparent rounded-full mr-2"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span className="text-ios18-blue text-sm">更新排序中...</span>
                        </div>
                      </div>
                    )}
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