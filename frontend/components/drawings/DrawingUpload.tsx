'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Button, Input, Dropdown, FileDropzone, Alert, ProgressBar } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export interface DrawingUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const DrawingUpload: React.FC<DrawingUploadProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState<'DXF'>('DXF'); // 只支持DXF
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { token } = useAuth();

  // 处理文件选择
  const handleFilesSelected = (selectedFiles: File[]) => {
    const newFiles: UploadFile[] = selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  // 移除文件
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // 检测文件类型 - 只支持DXF
  const detectFileType = (filename: string): 'DXF' => {
    return 'DXF'; // 只支持DXF文件，直接返回
  };

  // 上传单个文件
  const uploadFile = async (uploadFile: UploadFile): Promise<boolean> => {
    const formData = new FormData();
    formData.append('file', uploadFile.file);
    formData.append('description', description);
    formData.append('fileType', detectFileType(uploadFile.file.name));
    formData.append('tags', tags);

    try {
      // 更新文件状态为上传中
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading' as const } 
          : f
      ));

      const response = await fetch('/api/drawings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        // 模拟进度更新
        for (let progress = 0; progress <= 100; progress += 10) {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, progress } 
              : f
          ));
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'success' as const, progress: 100 } 
            : f
        ));
        
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '上传失败');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error' as const, 
              error: error instanceof Error ? error.message : '上传失败' 
            } 
          : f
      ));
      return false;
    }
  };

  // 开始上传
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('请选择要上传的文件');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 并发上传所有文件
      const uploadPromises = files
        .filter(f => f.status === 'pending')
        .map(file => uploadFile(file));
      
      const results = await Promise.all(uploadPromises);
      const successCount = results.filter(Boolean).length;
      
      if (successCount > 0) {
        onSuccess();
        
        // 如果全部成功，关闭对话框
        if (successCount === files.filter(f => f.status === 'pending').length) {
          setTimeout(() => {
            onClose();
            resetForm();
          }, 1000);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setFiles([]);
    setDescription('');
    setTags('');
    setError(null);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 获取状态图标
  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'uploading':
        return (
          <motion.svg 
            className="w-5 h-5 text-blue-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </motion.svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="上传图纸"
      size="lg"
    >
      <div className="space-y-6">
        {/* 文件拖放区域 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择文件
          </label>
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            accept=".dxf" // 只支持DXF文件
            maxSize={50 * 1024 * 1024} // 50MB
            multiple
          />
          <p className="text-xs text-gray-500 mt-1">
            仅支持 DXF文件(.dxf)，单个文件最大50MB
          </p>
        </div>

        {/* 文件列表 */}
        {files.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              待上传文件 ({files.length})
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <AnimatePresence>
                {files.map((uploadFile) => (
                  <motion.div
                    key={uploadFile.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getStatusIcon(uploadFile.status)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {uploadFile.file.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(uploadFile.file.size)} • {detectFileType(uploadFile.file.name)}
                        </div>
                        {uploadFile.status === 'uploading' && (
                          <div className="mt-1">
                            <ProgressBar 
                              progress={uploadFile.progress} 
                              size="sm"
                              className="w-full"
                            />
                          </div>
                        )}
                        {uploadFile.status === 'error' && uploadFile.error && (
                          <div className="text-xs text-red-600 mt-1">
                            {uploadFile.error}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {uploadFile.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* 描述信息 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            描述信息
          </label>
          <Input
            placeholder="输入图纸描述信息..."
            value={description}
            onChange={setDescription}
            multiline
            rows={3}
          />
        </div>

        {/* 标签 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            标签
          </label>
          <Input
            placeholder="输入标签，用逗号分隔..."
            value={tags}
            onChange={setTags}
          />
          <p className="text-xs text-gray-500 mt-1">
            例如：机械图纸,v2.0,重要
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* 按钮组 */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={uploading}
          >
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            loading={uploading}
            disabled={files.length === 0 || uploading}
          >
            {uploading ? '上传中...' : `上传 ${files.length} 个文件`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};