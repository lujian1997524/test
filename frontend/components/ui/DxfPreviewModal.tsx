'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Drawing {
  id: number;
  projectId: number;
  filename: string;
  originalFilename?: string;
  filePath: string;
  version: string;
  createdAt: string;
  uploader?: { id: number; name: string };
}

interface DxfPreviewModalProps {
  drawing: Drawing | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DxfPreviewModal: React.FC<DxfPreviewModalProps> = ({
  drawing,
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerInstance, setViewerInstance] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);
  const { token } = useAuth();

  // 等待DOM挂载
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // 键盘事件监听
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen && mounted) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, mounted]);

  // DXF加载逻辑
  useEffect(() => {
    // 重置初始化标记
    initRef.current = false;
    
    if (!isOpen || !drawing || !mounted || !token) {
      setLoading(true);
      setError(null);
      return;
    }

    // 延迟加载，确保DOM完全准备就绪
    const timer = setTimeout(() => {
      if (!initRef.current) {
        initRef.current = true;
        loadDxfViewer();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanupViewer();
    };
  }, [isOpen, drawing, mounted, token]);

  const loadDxfViewer = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎯 开始加载DXF预览', { 
        drawingId: drawing?.id,
        hasToken: !!token,
        containerExists: !!containerRef.current
      });

      // 检查容器是否存在
      if (!containerRef.current) {
        console.log('⚠️ 容器不存在，等待DOM准备');
        // 再次尝试等待
        await new Promise(resolve => setTimeout(resolve, 200));
        if (!containerRef.current) {
          throw new Error('预览容器初始化失败');
        }
      }

      // 动态导入dxf-viewer
      const { DxfViewer } = await import('dxf-viewer');
      
      // 清理容器
      containerRef.current.innerHTML = '';

      // 创建查看器
      console.log('🔧 创建DXF查看器...');
      const viewer = new DxfViewer(containerRef.current, {
        autoResize: true,
        colorCorrection: true,
        // 启用文字显示并使用默认字体
        canvasOptions: {
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: false
        }
      });

      setViewerInstance(viewer);
      console.log('✅ DXF查看器创建成功');

      // 获取DXF内容
      console.log('📡 获取DXF内容，图纸ID:', drawing?.id);
      const response = await fetch(`/api/drawings/${drawing?.id}/content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 API响应状态:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('认证失败，请重新登录');
        }
        throw new Error(`获取图纸内容失败: ${response.status}`);
      }

      const dxfContent = await response.text();
      console.log('📄 DXF内容获取成功，长度:', dxfContent.length);

      // 加载到查看器
      console.log('🎨 加载DXF到查看器...');
      await viewer.Load({
        url: `data:application/dxf;charset=utf-8,${encodeURIComponent(dxfContent)}`,
        // 使用简化的字体配置 - 只使用URL数组格式
        fonts: [
          '/fonts/NotoSansSC-Thin.ttf'
        ],
        progressCbk: (phase: string, receivedBytes: number, totalBytes: number) => {
          console.log(`📊 加载进度: ${phase} - ${receivedBytes}/${totalBytes}`);
        },
        workerFactory: undefined
      } as any);

      console.log('✅ DXF加载完成');
      setLoading(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载DXF失败';
      console.error('❌ DXF加载失败:', errorMessage, err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const cleanupViewer = () => {
    if (viewerInstance && viewerInstance.Dispose) {
      try {
        viewerInstance.Dispose();
        setViewerInstance(null);
        console.log('🧹 DXF查看器已清理');
      } catch (error) {
        console.error('清理查看器失败:', error);
      }
    }
  };

  const handleClose = () => {
    cleanupViewer();
    onClose();
  };

  // 工具栏
  const renderToolbar = () => {
    if (!viewerInstance || loading || error) return null;
    
    return (
      <div className="absolute top-4 left-4 flex space-x-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 z-20">
        <button
          onClick={() => viewerInstance.Zoom(1.2)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
          title="放大"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>
        <button
          onClick={() => viewerInstance.Zoom(0.8)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="缩小"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>
        <button
          onClick={() => viewerInstance.ZoomToFit()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="适合窗口"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button
          onClick={() => viewerInstance.Reset()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="重置视图"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    );
  };

  if (!mounted || !drawing) return null;

  const fileName = drawing.originalFilename || drawing.filename;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl w-full h-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col"
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{fileName}</h2>
                  <p className="text-xs text-gray-500">
                    版本 {drawing.version} • {drawing.uploader?.name || '未知'} • {new Date(drawing.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                title="关闭预览 (ESC)"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500 group-hover:text-gray-700" />
              </button>
            </div>

            {/* 预览内容 */}
            <div className="flex-1 relative overflow-hidden bg-gray-50">
              {renderToolbar()}
              
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-500"></div>
                    <span className="text-lg text-gray-600">加载DXF预览中...</span>
                    <span className="text-sm text-gray-400">支持缩放、平移和旋转</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                  <div className="text-center">
                    <div className="text-red-500 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <p className="text-lg text-red-600 mb-4">{error}</p>
                    <button
                      onClick={() => {
                        setError(null);
                        if (!initRef.current) {
                          initRef.current = true;
                          loadDxfViewer();
                        }
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      重试
                    </button>
                  </div>
                </div>
              )}

              <div 
                ref={containerRef} 
                className="w-full h-full dxf-viewer-container"
                style={{ background: '#ffffff' }}
              />
            </div>

            {/* 底部操作栏 */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-medium text-gray-700">
                    专业DXF图纸预览
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      支持缩放
                    </span>
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                      </svg>
                      支持平移
                    </span>
                    <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      3D查看
                    </span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => window.open(`/api/drawings/${drawing.id}/download`, '_blank')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>下载文件</span>
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    关闭预览
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};