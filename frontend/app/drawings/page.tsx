'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { useAuth } from '@/contexts/AuthContext';

// 图纸类型定义
interface Drawing {
  id: number;
  projectId: number;
  filename: string;
  originalFilename: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  version: number;
  uploadTime: string;
  isCurrentVersion: boolean;
  description?: string;
  uploader?: {
    id: number;
    name: string;
  };
}

interface Project {
  id: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export default function DrawingsPage() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState<{[key: string]: boolean}>({});
  const [versionHistory, setVersionHistory] = useState<{[key: string]: Drawing[]}>({});

  const { token, user } = useAuth();
  const router = useRouter();

  // 配置侧边栏导航
  const sidebarItems = [
    {
      id: 'drawings-management',
      label: '图纸管理',
      active: true,
      children: [
        { 
          id: 'drawing-list', 
          label: '图纸列表',
          active: true
        },
        { 
          id: 'upload-drawing', 
          label: '上传图纸',
          onClick: () => setShowUploadForm(true)
        }
      ]
    },
    {
      id: 'navigation',
      label: '快速导航',
      children: [
        { 
          id: 'all-projects', 
          label: '📋 项目管理',
          onClick: () => router.push('/projects')
        },
        { 
          id: 'project-materials', 
          label: '📊 板材状态',
          onClick: () => router.push('/materials')
        },
        { 
          id: 'workers', 
          label: '👥 工人管理',
          onClick: () => router.push('/workers')
        }
      ]
    }
  ];

  // 获取项目列表
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取项目列表失败');
      }

      const data = await response.json();
      setProjects(data.projects || []);
      
      // 默认选择第一个项目
      if (data.projects && data.projects.length > 0) {
        setSelectedProject(data.projects[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取项目列表失败');
    }
  };

  // 获取图纸列表
  const fetchDrawings = async (projectId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/drawings/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取图纸列表失败');
      }

      const data = await response.json();
      setDrawings(data.drawings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取图纸列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 上传图纸
  const handleUpload = async () => {
    if (!selectedProject || !selectedFile) {
      setError('请选择项目和文件');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('drawing', selectedFile);
      if (uploadDescription) {
        formData.append('description', uploadDescription);
      }

      const response = await fetch(`/api/drawings/project/${selectedProject.id}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '上传失败');
      }

      // 重新获取图纸列表
      await fetchDrawings(selectedProject.id);
      
      // 重置表单
      setShowUploadForm(false);
      setSelectedFile(null);
      setUploadDescription('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 下载图纸
  const handleDownload = async (drawing: Drawing) => {
    try {
      setActionLoading(drawing.id);
      const response = await fetch(`/api/drawings/${drawing.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('下载失败');
      }

      // 创建下载链接
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = drawing.originalFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : '下载失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 删除图纸
  const handleDelete = async (drawing: Drawing) => {
    if (!confirm(`确定要删除图纸 \"${drawing.originalFilename}\" 吗？`)) {
      return;
    }

    try {
      setActionLoading(drawing.id);
      const response = await fetch(`/api/drawings/${drawing.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '删除失败');
      }

      // 重新获取图纸列表
      if (selectedProject) {
        await fetchDrawings(selectedProject.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 获取图纸版本历史
  const fetchVersionHistory = async (drawing: Drawing) => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/drawings/${drawing.originalFilename}/versions/${selectedProject.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取版本历史失败');
      }

      const data = await response.json();
      setVersionHistory(prev => ({
        ...prev,
        [drawing.originalFilename]: data.versions || []
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取版本历史失败');
    }
  };

  // 切换版本历史显示
  const toggleVersionHistory = async (drawing: Drawing) => {
    const key = drawing.originalFilename;
    const isShowing = showVersionHistory[key];
    
    if (!isShowing) {
      await fetchVersionHistory(drawing);
    }
    
    setShowVersionHistory(prev => ({
      ...prev,
      [key]: !isShowing
    }));
  };

  // 设置当前版本
  const setCurrentVersion = async (drawing: Drawing) => {
    if (drawing.isCurrentVersion) return;

    try {
      setActionLoading(drawing.id);
      const response = await fetch(`/api/drawings/${drawing.id}/set-current`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '设置当前版本失败');
      }

      // 重新获取图纸列表
      if (selectedProject) {
        await fetchDrawings(selectedProject.id);
        // 如果版本历史是打开的，也要刷新
        if (showVersionHistory[drawing.originalFilename]) {
          await fetchVersionHistory(drawing);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '设置当前版本失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 文件大小格式化
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取文件图标
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('dwg') || fileType.includes('dxf')) return '📐';
    return '📁';
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  useEffect(() => {
    if (selectedProject) {
      fetchDrawings(selectedProject.id);
    }
  }, [selectedProject, token]);

  return (
    <MainLayout
      headerTitle="图纸管理"
      headerSubtitle="管理和上传项目图纸文件"
      sidebarItems={sidebarItems}
      headerActions={
        <Button
          onClick={() => setShowUploadForm(true)}
          disabled={!selectedProject}
          className="bg-gradient-to-r from-blue-500 to-blue-600"
        >
          📤 上传图纸
        </Button>
      }
    >
      <div className="container mx-auto px-4 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* 项目选择 */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">选择项目</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedProject?.id === project.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  <h3 className="font-medium text-text-primary">{project.name}</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    状态: {project.status === 'pending' ? '待处理' : 
                           project.status === 'in_progress' ? '进行中' : '已完成'}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        {/* 图纸列表 */}
        {selectedProject && (
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                {selectedProject.name} - 图纸文件
              </h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-text-secondary">加载中...</p>
                </div>
              ) : drawings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📁</div>
                  <p className="text-text-secondary mb-4">该项目暂无图纸文件</p>
                  <Button
                    onClick={() => setShowUploadForm(true)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600"
                  >
                    上传第一个图纸
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {drawings.map((drawing) => (
                    <motion.div
                      key={drawing.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="text-2xl">{getFileIcon(drawing.fileType)}</div>
                          <div className="flex-1">
                            <h3 className="font-medium text-text-primary flex items-center">
                              {drawing.originalFilename}
                              {drawing.isCurrentVersion && (
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  当前版本
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-text-secondary">
                              <span>版本 {drawing.version}</span>
                              <span>{formatFileSize(drawing.fileSize)}</span>
                              <span>上传者: {drawing.uploader?.name}</span>
                              <span>{new Date(drawing.uploadTime).toLocaleString()}</span>
                            </div>
                            {drawing.description && (
                              <p className="text-sm text-text-secondary mt-2">{drawing.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(drawing)}
                            disabled={actionLoading === drawing.id}
                          >
                            {actionLoading === drawing.id ? '下载中...' : '📥 下载'}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleVersionHistory(drawing)}
                            className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                          >
                            📋 版本历史
                          </Button>
                          
                          {(user?.role === 'admin' || user?.id === drawing.uploader?.id) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(drawing)}
                              disabled={actionLoading === drawing.id}
                              className="text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              {actionLoading === drawing.id ? '删除中...' : '🗑️ 删除'}
                            </Button>
                          )}
                        </div>
                        
                        {/* 版本历史展示 */}
                        <AnimatePresence>
                          {showVersionHistory[drawing.originalFilename] && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-gray-200"
                            >
                              <h4 className="text-sm font-medium text-text-primary mb-3">版本历史</h4>
                              {versionHistory[drawing.originalFilename] && versionHistory[drawing.originalFilename].length > 0 ? (
                                <div className="space-y-2">
                                  {versionHistory[drawing.originalFilename].map((version) => (
                                    <div
                                      key={version.id}
                                      className={`flex items-center justify-between p-3 rounded-lg border ${
                                        version.isCurrentVersion 
                                          ? 'border-green-200 bg-green-50' 
                                          : 'border-gray-200 bg-gray-50'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div className="text-lg">{getFileIcon(version.fileType)}</div>
                                        <div>
                                          <div className="flex items-center space-x-2">
                                            <span className="font-medium text-sm">版本 {version.version}</span>
                                            {version.isCurrentVersion && (
                                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                当前版本
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center space-x-3 mt-1 text-xs text-text-secondary">
                                            <span>{formatFileSize(version.fileSize)}</span>
                                            <span>上传者: {version.uploader?.name}</span>
                                            <span>{new Date(version.uploadTime).toLocaleString()}</span>
                                          </div>
                                          {version.description && (
                                            <p className="text-xs text-text-secondary mt-1">{version.description}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDownload(version)}
                                          disabled={actionLoading === version.id}
                                          className="text-xs"
                                        >
                                          {actionLoading === version.id ? '下载中...' : '📥'}
                                        </Button>
                                        {!version.isCurrentVersion && (user?.role === 'admin' || user?.id === version.uploader?.id) && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentVersion(version)}
                                            disabled={actionLoading === version.id}
                                            className="text-xs text-blue-600 hover:text-blue-700"
                                          >
                                            设为当前
                                          </Button>
                                        )}
                                        {(user?.role === 'admin' || user?.id === version.uploader?.id) && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(version)}
                                            disabled={actionLoading === version.id}
                                            className="text-xs text-red-600 hover:text-red-700"
                                          >
                                            {actionLoading === version.id ? '删除中...' : '🗑️'}
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-text-secondary">
                                  <div className="text-2xl mb-2">📚</div>
                                  <p className="text-sm">暂无版本历史</p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 上传表单模态框 */}
        <AnimatePresence>
          {showUploadForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowUploadForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  上传图纸到: {selectedProject?.name}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      选择文件
                    </label>
                    <FileDropzone
                      onFileSelect={(file) => setSelectedFile(file)}
                      accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf"
                      maxSize={10 * 1024 * 1024} // 10MB
                    />
                    {selectedFile && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center text-green-800">
                          <span className="text-lg mr-2">✅</span>
                          <div>
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-sm">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      描述 (可选)
                    </label>
                    <Input
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="输入图纸描述..."
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadForm(false)}
                    disabled={uploading}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="bg-gradient-to-r from-blue-500 to-blue-600"
                  >
                    {uploading ? '上传中...' : '上传'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}