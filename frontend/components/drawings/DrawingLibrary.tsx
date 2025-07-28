'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, SearchBar, Dropdown, Alert, Loading, EmptyData, Modal, Input } from '@/components/ui';
import { DrawingGrid } from './DrawingGrid';
import { DrawingList } from './DrawingList';
import { DrawingUpload } from './DrawingUpload';
import { DrawingSearch } from './DrawingSearch';
import { DxfPreviewModal } from '@/components/ui/DxfPreviewModal';
import { useAuth } from '@/contexts/AuthContext';
import { cadFileHandler } from '@/utils/cadFileHandler';

export interface Drawing {
  id: number;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  fileType: 'DXF'; // 只支持DXF文件
  version: string;
  status: '可用' | '已废弃' | '已归档';
  description?: string;
  uploadedBy: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  isCommonPart?: boolean;
  tags?: string[];
  projectIds?: number[];
  project?: {
    id: number;
    name: string;
    status: string;
  };
  uploader?: {
    id: number;
    name: string;
  };
}

export interface DrawingLibraryProps {
  className?: string;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

type ViewMode = 'grid' | 'list';
type SortMode = 'name' | 'date' | 'size' | 'type';

export const DrawingLibrary: React.FC<DrawingLibraryProps> = ({
  className = '',
  selectedCategory = 'all',
  onCategoryChange
}) => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrawings, setSelectedDrawings] = useState<number[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDrawing, setPreviewDrawing] = useState<Drawing | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDrawing, setEditingDrawing] = useState<Drawing | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'可用' | '已废弃' | '已归档'>('可用');
  const [editFilename, setEditFilename] = useState('');

  const { token } = useAuth();

  // 获取图纸列表
  const fetchDrawings = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        category: selectedCategory || 'all',
        sortBy: sortMode,
        sortOrder: 'DESC'
      });
      
      const response = await fetch(`/api/drawings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDrawings(data.drawings || data);
        setError(null);
      } else {
        throw new Error('获取图纸列表失败');
      }
    } catch (error) {
      console.error('获取图纸列表失败:', error);
      setError('获取图纸列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理预览
  const handlePreview = (drawing: Drawing) => {
    // 转换Drawing为DxfPreviewModal所需格式
    const dxfDrawing = {
      id: drawing.id,
      projectId: 0, // 图纸库中的图纸没有关联项目
      filename: drawing.filename,
      originalFilename: drawing.originalName,
      filePath: drawing.filePath,
      version: drawing.version,
      createdAt: drawing.createdAt,
      uploader: drawing.uploadedBy ? { id: drawing.uploadedBy, name: '未知用户' } : undefined
    };
    setPreviewDrawing(dxfDrawing as any);
    setShowPreview(true);
  };

  // 处理编辑
  const handleEdit = (drawing: Drawing) => {
    setEditingDrawing(drawing);
    setEditDescription(drawing.description || '');
    setEditStatus(drawing.status);
    setEditFilename(drawing.originalName || drawing.filename);
    setShowEditModal(true);
  };

  // 处理图纸打开
  const handleOpen = async (drawing: Drawing) => {
    try {
      const fileName = drawing.originalName || drawing.filename;
      const cadCheck = await cadFileHandler.isCADFile(fileName);
      
      if (cadCheck.isCADFile) {
        // 使用CAD软件打开
        const result = await cadFileHandler.openCADFile(drawing.filePath);
        if (result.success) {
          console.log(`图纸 ${fileName} 已使用 ${result.software} 打开`);
        } else {
          console.error('打开图纸失败:', result.error);
          setError(`打开图纸失败: ${result.error}`);
        }
      } else {
        // 如果不是CAD文件或检测失败，提供下载
        window.open(`/api/drawings/${drawing.id}/download`, '_blank');
      }
    } catch (error) {
      console.error('处理图纸打开失败:', error);
      setError('打开图纸失败，请重试');
    }
  };
  const handleDelete = async (drawing: Drawing) => {
    if (!confirm(`确定要删除图纸 "${drawing.originalName}" 吗？此操作不可撤销。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/drawings/${drawing.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchDrawings(); // 重新获取列表
        setError(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除失败');
      }
    } catch (error) {
      console.error('删除图纸失败:', error);
      setError(error instanceof Error ? error.message : '删除图纸失败，请重试');
    }
  };

  // 提交编辑
  const handleEditSubmit = async () => {
    if (!editingDrawing) return;

    // 验证文件名
    if (!editFilename.trim()) {
      setError('文件名不能为空');
      return;
    }

    // 检查文件名格式
    if (!editFilename.toLowerCase().endsWith('.dxf')) {
      setError('文件名必须以 .dxf 结尾');
      return;
    }

    // 检查非法字符
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(editFilename)) {
      setError('文件名不能包含以下字符: < > : " / \\ | ? *');
      return;
    }

    try {
      const response = await fetch(`/api/drawings/${editingDrawing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: editDescription,
          status: editStatus,
          originalFilename: editFilename
        })
      });

      if (response.ok) {
        await fetchDrawings(); // 重新获取列表
        setShowEditModal(false);
        setEditingDrawing(null);
        setError(null);
        // 触发图纸更新事件
        window.dispatchEvent(new CustomEvent('drawing-updated'));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新失败');
      }
    } catch (error) {
      console.error('更新图纸失败:', error);
      setError(error instanceof Error ? error.message : '更新图纸失败，请重试');
    }
  };

  useEffect(() => {
    fetchDrawings();
  }, [token, selectedCategory, sortMode]);

  // 当分类改变时，通知父组件
  useEffect(() => {
    if (onCategoryChange && selectedCategory !== 'all') {
      // 只在非默认分类时调用回调
    }
  }, [selectedCategory, onCategoryChange]);

  // 筛选和排序图纸（主要处理搜索，分类由后端处理）
  const filteredDrawings = React.useMemo(() => {
    let filtered = [...drawings];

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(drawing => 
        drawing.filename.toLowerCase().includes(query) ||
        drawing.originalName.toLowerCase().includes(query) ||
        drawing.description?.toLowerCase().includes(query) ||
        drawing.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [drawings, searchQuery]);

  // 按月份分组归档图纸
  const groupArchivedDrawingsByMonth = (drawings: Drawing[]) => {
    const archivedDrawings = drawings.filter(d => d.status === '已归档' && d.archivedAt);
    
    const grouped = archivedDrawings.reduce((groups, drawing) => {
      const archivedDate = new Date(drawing.archivedAt!);
      const monthKey = `${archivedDate.getFullYear()}-${String(archivedDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${archivedDate.getFullYear()}年${archivedDate.getMonth() + 1}月`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = {
          label: monthLabel,
          drawings: []
        };
      }
      
      groups[monthKey].drawings.push(drawing);
      return groups;
    }, {} as Record<string, { label: string; drawings: Drawing[] }>);
    
    // 按月份倒序排列
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, value]) => ({ key, ...value }));
  };

  const archivedGroups = groupArchivedDrawingsByMonth(drawings);

  // 处理图纸上传成功
  const handleUploadSuccess = () => {
    fetchDrawings();
    setShowUpload(false);
    // 触发图纸更新事件
    window.dispatchEvent(new CustomEvent('drawing-updated'));
  };

  // 处理图纸删除
  const handleDeleteDrawing = async (drawingId: number) => {
    if (!confirm('确定要删除这个图纸吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await fetch(`/api/drawings/${drawingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchDrawings();
        // 触发图纸更新事件
        window.dispatchEvent(new CustomEvent('drawing-updated'));
      } else {
        throw new Error('删除图纸失败');
      }
    } catch (error) {
      console.error('删除图纸失败:', error);
      alert('删除图纸失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <Loading text="加载图纸库..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="error">
          {error}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchDrawings}
            className="ml-2"
          >
            重试
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 工具栏 */}
      <Card padding="sm" className="mb-4 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* 视图切换 */}
            <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                网格
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                列表
              </Button>
            </div>

            {/* 排序 */}
            <Dropdown
              options={[
                { label: '按名称排序', value: 'name' },
                { label: '按时间排序', value: 'date' },
                { label: '按大小排序', value: 'size' },
                { label: '按类型排序', value: 'type' }
              ]}
              value={sortMode}
              onChange={(value) => setSortMode(value as SortMode)}
              className="w-32"
            />
          </div>

          {/* 搜索栏 */}
          <div className="flex-1 max-w-md">
            <SearchBar
              placeholder="搜索图纸..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-full"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              高级筛选
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              上传图纸
            </Button>
          </div>
        </div>

        {/* 高级搜索面板 */}
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <DrawingSearch
              onSearch={(filters) => {
                // 处理高级搜索筛选
                console.log('高级搜索筛选:', filters);
              }}
              onReset={() => {
                setSearchQuery('');
              }}
            />
          </motion.div>
        )}
      </Card>

      {/* 批量操作工具栏 */}
      {selectedDrawings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Card padding="sm" className="bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                已选择 {selectedDrawings.length} 个图纸
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">批量关联</Button>
                <Button variant="ghost" size="sm">修改状态</Button>
                <Button variant="ghost" size="sm">添加标签</Button>
                <Button variant="ghost" size="sm" className="text-red-600">
                  批量删除
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {selectedCategory === 'archived' && archivedGroups.length > 0 ? (
          // 归档图纸按月份分组显示
          <div className="h-full overflow-auto">
            {archivedGroups.map((group) => (
              <div key={group.key} className="mb-6">
                {/* 月份标题 */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 py-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {group.label}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({group.drawings.length} 个图纸)
                    </span>
                  </h3>
                </div>
                
                {/* 该月份的图纸 */}
                {viewMode === 'grid' ? (
                  <DrawingGrid
                    drawings={group.drawings}
                    selectedDrawings={selectedDrawings}
                    onSelectionChange={setSelectedDrawings}
                    onPreview={handlePreview}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onOpen={handleOpen}
                    className="px-4"
                  />
                ) : (
                  <DrawingList
                    drawings={group.drawings}
                    selectedDrawings={selectedDrawings}
                    onSelectionChange={setSelectedDrawings}
                    onPreview={handlePreview}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onOpen={handleOpen}
                    className="px-4"
                  />
                )}
              </div>
            ))}
          </div>
        ) : filteredDrawings.length === 0 ? (
          <EmptyData
            title="暂无图纸"
            description={searchQuery ? "没有找到匹配的图纸" : "还没有上传任何图纸"}
            action={
              !searchQuery ? (
                <Button variant="primary" onClick={() => setShowUpload(true)}>
                  上传第一个图纸
                </Button>
              ) : undefined
            }
          />
        ) : viewMode === 'grid' ? (
          <DrawingGrid
            drawings={filteredDrawings}
            selectedDrawings={selectedDrawings}
            onSelectionChange={setSelectedDrawings}
            onPreview={handlePreview}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpen={handleOpen}
            className="h-full"
          />
        ) : (
          <DrawingList
            drawings={filteredDrawings}
            selectedDrawings={selectedDrawings}
            onSelectionChange={setSelectedDrawings}
            onPreview={handlePreview}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpen={handleOpen}
            className="h-full"
          />
        )}
      </div>

      {/* 上传对话框 */}
      {showUpload && (
        <DrawingUpload
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* DXF预览模态框 */}
      <DxfPreviewModal
        drawing={previewDrawing as any}
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewDrawing(null);
        }}
      />

      {/* 编辑图纸模态框 */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingDrawing(null);
          setEditFilename('');
          setEditDescription('');
          setEditStatus('可用');
        }}
        title="编辑图纸信息"
        size="md"
      >
        <div className="space-y-4">
          {/* 文件名（可编辑） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文件名
            </label>
            <Input
              value={editFilename}
              onChange={(e) => setEditFilename(e.target.value)}
              placeholder="输入文件名（必须以.dxf结尾）"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              文件名不能包含: &lt; &gt; : " / \ | ? *
            </p>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述信息
            </label>
            <Input
              placeholder="输入图纸描述..."
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              multiline
              rows={3}
            />
          </div>

          {/* 状态 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              状态
            </label>
            <Dropdown
              options={[
                { label: '可用', value: '可用' },
                { label: '已废弃', value: '已废弃' },
                { label: '已归档', value: '已归档' }
              ]}
              value={editStatus}
              onChange={(value) => setEditStatus(value as '可用' | '已废弃' | '已归档')}
              className="w-full"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={() => {
                setShowEditModal(false);
                setEditingDrawing(null);
                setEditFilename('');
                setEditDescription('');
                setEditStatus('可用');
              }}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleEditSubmit}
            >
              保存修改
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};