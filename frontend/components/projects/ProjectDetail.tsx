'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectStore } from '@/stores';
import { StatusToggle } from '@/components/ui';
import type { StatusType } from '@/components/ui';
import cadFileHandler from '@/utils/cadFileHandler';
import { 
  updateMaterialStatusShared, 
  getProjectMaterialStatus 
} from '@/utils/materialStatusManager';

interface ThicknessSpec {
  id: number;
  thickness: string;
  unit: string;
  materialType: string;
  isActive: boolean;
  sortOrder: number;
}

interface Material {
  id: number;
  projectId: number;
  thicknessSpecId: number;
  status: 'pending' | 'in_progress' | 'completed';
  completedBy?: { id: number; name: string };
  startDate?: string;
  completedDate?: string;
  notes?: string;
  thicknessSpec: ThicknessSpec;
}

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

interface OperationHistory {
  id: number;
  projectId: number;
  operationType: 'material_update' | 'drawing_upload' | 'project_update' | 'project_create' | 'project_delete';
  operationDescription: string;
  details: {
    [key: string]: any;
  };
  operatedBy: number;
  created_at: string;
  operator: { id: number; name: string };
  project: { id: number; name: string };
}

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  priority: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  creator?: { id: number; name: string };
  assignedWorker?: { id: number; name: string };
  materials: Material[];
  drawings: Drawing[];
}

interface ProjectDetailProps {
  projectId: number;
  onBack: () => void;
  className?: string;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  projectId,
  onBack,
  className = ''
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [operationHistory, setOperationHistory] = useState<OperationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDrawing, setUploadingDrawing] = useState(false);
  const [cadSoftwareInfo, setCADSoftwareInfo] = useState<string>('');
  const [thicknessSpecs, setThicknessSpecs] = useState<ThicknessSpec[]>([]);
  const { token, user } = useAuth();
  const { projects, updateProject, fetchProjects } = useProjectStore();

  // 处理操作历史详情文本显示
  const getOperationDetailsText = (record: OperationHistory): string => {
    try {
      const details = record.details;
      
      switch (record.operationType) {
        case 'material_update':
          return `材料ID: ${details.materialId}, 厚度: ${details.thickness}${details.unit}`;
          
        case 'drawing_upload':
          return `文件: ${details.originalFilename}, 版本: ${details.version}`;
          
        case 'project_update':
          if (details.changes) {
            const changeTexts = [];
            if (details.changes.status) {
              changeTexts.push(`状态: ${details.changes.oldStatus} → ${details.changes.status}`);
            }
            if (details.changes.priority) {
              changeTexts.push(`优先级: ${details.changes.oldPriority} → ${details.changes.priority}`);
            }
            if (details.changes.name) {
              changeTexts.push(`名称: ${details.changes.oldName} → ${details.changes.name}`);
            }
            if (details.changes.assignedWorkerId !== undefined) {
              changeTexts.push(`工人: ${details.changes.oldWorkerName || '无'} → ${details.changes.newWorkerName || '无'}`);
            }
            return changeTexts.join(', ');
          }
          return '项目信息已更新';
          
        case 'project_create':
          return `项目状态: ${details.status}, 优先级: ${details.priority}`;
          
        case 'project_delete':
          return `项目已删除: ${details.projectName}`;
          
        default:
          return '操作详情';
      }
    } catch (error) {
      console.warn('处理操作历史详情时出错:', error);
      return '操作详情';
    }
  };

  // 获取项目详情
  const fetchProjectDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      } else {
        console.error('获取项目详情失败');
      }
    } catch (error) {
      console.error('获取项目详情错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取操作历史
  const fetchOperationHistory = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOperationHistory(data.history || []);
      }
    } catch (error) {
      console.error('获取操作历史错误:', error);
    }
  };

  useEffect(() => {
    fetchProjectDetail();
    fetchOperationHistory();
    fetchThicknessSpecs();
    initializeCADDetection();
  }, [projectId]);

  // 监听材料更新事件，保持与主页面同步
  useEffect(() => {
    const handleMaterialsUpdate = (event: CustomEvent) => {
      console.log('📋 ProjectDetail 收到材料更新事件:', event.detail);
      // 刷新项目数据以获取最新的材料状态
      fetchProjectDetail();
      fetchProjects();
    };

    window.addEventListener('materials-updated', handleMaterialsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('materials-updated', handleMaterialsUpdate as EventListener);
    };
  }, []);

  // 获取厚度规格
  const fetchThicknessSpecs = async () => {
    try {
      const response = await fetch('/api/thickness-specs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setThicknessSpecs(data.thicknessSpecs || []);
      }
    } catch (error) {
      console.error('获取厚度规格失败:', error);
    }
  };

  // 初始化CAD检测
  const initializeCADDetection = async () => {
    try {
      if (cadFileHandler.isElectronEnvironment()) {
        const result = await cadFileHandler.detectCADSoftware();
        if (result.success) {
          setCADSoftwareInfo(cadFileHandler.formatSoftwareInfo());
        } else {
          setCADSoftwareInfo('CAD软件检测失败');
        }
      } else {
        setCADSoftwareInfo('网页版：支持下载图纸到本地');
      }
    } catch (error) {
      console.error('CAD检测初始化失败:', error);
      setCADSoftwareInfo('CAD软件检测失败');
    }
  };

  // 更新材料状态 - 使用共享逻辑
  const updateMaterialStatus = async (thicknessSpecId: number, newStatus: StatusType) => {
    return await updateMaterialStatusShared(projectId, thicknessSpecId, newStatus, {
      projects,
      thicknessSpecs,
      user,
      updateProjectFn: updateProject,
      fetchProjectsFn: fetchProjects,
      setLoadingFn: setLoading,
    });
  };

  // 获取项目的材料状态（根据厚度规格ID）- 使用共享逻辑
  const getProjectMaterialStatusForUI = (thicknessSpecId: number): StatusType => {
    return getProjectMaterialStatus(projects, projectId, thicknessSpecId);
  };

  // 上传图纸
  const handleDrawingUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingDrawing(true);
    try {
      const formData = new FormData();
      formData.append('drawing', file);

      const response = await fetch(`/api/drawings/project/${projectId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        // 重新获取项目详情
        fetchProjectDetail();
        // 清空文件输入
        event.target.value = '';
      } else {
        const errorData = await response.json();
        alert('图纸上传失败: ' + (errorData.error || '服务器错误'));
      }
    } catch (error) {
      console.error('上传图纸错误:', error);
      alert('图纸上传失败');
    } finally {
      setUploadingDrawing(false);
    }
  };

  // 打开图纸
  const openDrawing = async (drawing: Drawing) => {
    try {
      const fileName = drawing.originalFilename || drawing.filename;
      // 首先检查是否为CAD文件
      const cadCheck = await cadFileHandler.isCADFile(fileName);
      
      if (cadCheck.isCADFile) {
        // 使用CAD软件打开
        const result = await cadFileHandler.openCADFile(drawing.filePath);
        if (result.success) {
          console.log(`图纸已用 ${result.software} 打开`);
        } else {
          alert(`打开图纸失败: ${result.error}`);
        }
      } else {
        // 非CAD文件，使用默认方式打开
        if (cadFileHandler.isElectronEnvironment() && window.electronAPI && window.electronAPI.openFile) {
          await window.electronAPI.openFile(drawing.filePath);
        } else {
          // 网页环境下载文件
          window.open(`/api/drawings/${drawing.id}/download`, '_blank');
        }
      }
    } catch (error) {
      console.error('打开图纸失败:', error);
      alert('打开图纸失败');
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'pending': return '待处理';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 获取优先级文本
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">加载项目详情中...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={`bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg ${className}`}>
        <div className="p-8 text-center">
          <p className="text-gray-500">项目不存在</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg flex flex-col h-full ${className}`}>
      {/* 标题栏 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="返回列表"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(project.priority)}`}>
                  {getPriorityText(project.priority)}优先级
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 - 单页面显示所有信息，添加滚动 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="p-6 pb-8">
          <div className="space-y-8">
            {/* 基本信息部分 */}
            <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">基本信息</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">项目名称</label>
                  <p className="text-lg font-medium text-gray-900">{project.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">分配工人</label>
                  <p className="text-lg font-medium text-gray-900">{project.assignedWorker?.name || '未分配'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">创建者</label>
                  <p className="text-lg font-medium text-gray-900">{project.creator?.name || '未知'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">创建时间</label>
                  <p className="text-lg font-medium text-gray-900">{new Date(project.createdAt).toLocaleString('zh-CN')}</p>
                </div>
                {project.startDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">开始时间</label>
                    <p className="text-lg font-medium text-gray-900">{new Date(project.startDate).toLocaleDateString('zh-CN')}</p>
                  </div>
                )}
                {project.endDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">计划完成时间</label>
                    <p className="text-lg font-medium text-gray-900">{new Date(project.endDate).toLocaleDateString('zh-CN')}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* 快速统计 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-blue-600">{thicknessSpecs.length}</div>
                    <div className="text-xs text-gray-600">材料类型</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-green-600">
                      {project.materials.filter(m => m.status === 'completed').length}
                    </div>
                    <div className="text-xs text-gray-600">已完成</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-orange-600">
                      {project.materials.filter(m => m.status === 'in_progress').length}
                    </div>
                    <div className="text-xs text-gray-600">进行中</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-gray-600">{project.drawings.length}</div>
                    <div className="text-xs text-gray-600">图纸数量</div>
                  </div>
                </div>
              </div>
            </div>
            
            {project.description && (
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-500">项目描述</label>
                <p className="mt-2 text-gray-900">{project.description}</p>
              </div>
            )}
          </div>

          {/* 材料状态表格 - 使用与主页面相同的样式 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">材料状态管理</h3>
              <p className="text-sm text-gray-600 mt-1">点击状态指示器可以切换材料完成状态</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">序号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工人</th>
                    {/* 厚度列 */}
                    {thicknessSpecs.map(spec => (
                      <th key={spec.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {spec.thickness}{spec.unit}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">开始时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">完成时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">图纸</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    {/* 序号 */}
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">1</div>
                    </td>
                    
                    {/* 项目名 */}
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{project.name}</div>
                      <div className="text-xs text-gray-500">
                        {getStatusText(project.status)}
                      </div>
                    </td>
                    
                    {/* 工人 */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {project.assignedWorker?.name || '未分配'}
                      </div>
                    </td>
                    
                    {/* 厚度状态列 */}
                    {thicknessSpecs.map(spec => {
                      const materialStatus = getProjectMaterialStatusForUI(spec.id);
                      
                      return (
                        <td key={spec.id} className="px-3 py-4 text-center">
                          <StatusToggle
                            status={materialStatus}
                            onChange={(newStatus) => {
                              updateMaterialStatus(spec.id, newStatus);
                            }}
                            size="md"
                          />
                        </td>
                      );
                    })}
                    
                    {/* 备注 */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 max-w-32 truncate">
                        {project.materials.length > 0 ? (project.materials[0]?.notes || '-') : '-'}
                      </div>
                    </td>
                    
                    {/* 开始时间 */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {project.materials.length > 0 ? (project.materials[0]?.startDate || '-') : '-'}
                      </div>
                    </td>
                    
                    {/* 完成时间 */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {project.materials.length > 0 ? (project.materials[0]?.completedDate || '-') : '-'}
                      </div>
                    </td>
                    
                    {/* 图纸 */}
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-1">
                        {project.drawings && project.drawings.length > 0 ? (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {project.drawings.length}个
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">无</span>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 图纸管理部分 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">图纸管理</h3>
                  <p className="text-sm text-gray-600 mt-1">{cadSoftwareInfo}</p>
                </div>
                <div>
                  <input
                    type="file"
                    id="drawing-upload"
                    className="hidden"
                    accept=".dwg,.dxf,.pdf,.png,.jpg,.jpeg"
                    onChange={handleDrawingUpload}
                    disabled={uploadingDrawing}
                  />
                  <label
                    htmlFor="drawing-upload"
                    className={`px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer text-sm ${
                      uploadingDrawing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploadingDrawing ? '上传中...' : '上传图纸'}
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {project.drawings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg">暂无图纸文件</p>
                    <p className="text-sm text-gray-400 mt-1">点击上方"上传图纸"按钮添加图纸</p>
                  </div>
                ) : (
                  project.drawings.map(drawing => {
                    const fileName = drawing.originalFilename || drawing.filename;
                    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                    const isCADFile = ['.dwg', '.dxf'].includes(`.${fileExtension}`);
                    
                    return (
                      <div key={drawing.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                {isCADFile ? (
                                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                ) : (
                                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                )}
                                {isCADFile && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">CAD</span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{fileName}</div>
                                <div className="text-sm text-gray-600">
                                  版本 {drawing.version} • {drawing.uploader?.name || '未知'} • {new Date(drawing.createdAt).toLocaleDateString('zh-CN')}
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => openDrawing(drawing)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                          >
                            {isCADFile && cadFileHandler.isElectronEnvironment() ? '用CAD打开' : '打开'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 操作历史部分 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">操作历史</h3>
              <p className="text-sm text-gray-600 mt-1">项目相关的所有操作记录</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {operationHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg">暂无操作历史</p>
                    <p className="text-sm text-gray-400 mt-1">项目的操作记录会显示在这里</p>
                  </div>
                ) : (
                  operationHistory.map(record => (
                    <div key={record.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{record.operationDescription}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {getOperationDetailsText(record)}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {record.operator.name} • {new Date(record.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};