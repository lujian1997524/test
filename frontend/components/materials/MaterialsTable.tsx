'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useMaterialStore, useProjectStore, type ProjectState } from '@/stores';
import { StatusToggle, DrawingHoverCard } from '@/components/ui';
import type { StatusType } from '@/components/ui';
import { ArchiveBoxIcon } from '@heroicons/react/24/outline';
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
}

interface MaterialsTableProps {
  selectedProjectId: number | null;
  onProjectSelect: (id: number | null) => void;
  viewType?: 'active' | 'completed';
  workerNameFilter?: string;
  thicknessFilter?: string;
  className?: string;
}

export const MaterialsTable = ({ 
  selectedProjectId, 
  onProjectSelect, 
  viewType = 'active',
  workerNameFilter = '',
  thicknessFilter = '',
  className = '' 
}: MaterialsTableProps) => {
  const [thicknessSpecs, setThicknessSpecs] = useState<ThicknessSpec[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingNotes, setEditingNotes] = useState<{projectId: number, thicknessSpecId: number} | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [movingToPast, setMovingToPast] = useState<number | null>(null);
  const [restoringFromPast, setRestoringFromPast] = useState<number | null>(null);
  
  // 添加hover预览相关状态
  const [hoverCard, setHoverCard] = useState<{
    isVisible: boolean;
    position: { x: number; y: number };
    drawings: Drawing[];
  }>({
    isVisible: false,
    position: { x: 0, y: 0 },
    drawings: []
  });
  
  const { token, user } = useAuth();
  const { updateMaterialStatus } = useMaterialStore();
  const { projects, completedProjects, pastProjects, updateProject, fetchProjects, moveToPastProject, restoreFromPastProject } = useProjectStore();

  // 根据视图类型获取对应的项目列表，并应用筛选
  const getProjectsList = (): ProjectState[] => {
    let projectList: ProjectState[];
    
    switch (viewType) {
      case 'completed':
        projectList = pastProjects; // 使用过往项目数据
        break;
      default:
        projectList = projects;
        break;
    }
    
    // 应用工人姓名筛选
    if (workerNameFilter) {
      projectList = projectList.filter(project => 
        project.assignedWorker?.name === workerNameFilter
      );
    }
    
    // 应用板材厚度筛选 - 只要项目包含指定厚度的板材就显示
    if (thicknessFilter) {
      projectList = projectList.filter(project => {
        // 检查项目是否有指定厚度的材料
        return project.materials?.some(material => 
          material.thicknessSpec?.thickness === thicknessFilter
        ) || false;
      });
    }
    
    return projectList;
  };

  // 如果还没有加载厚度规格，先加载
  useEffect(() => {
    if (thicknessSpecs.length === 0) {
      fetchThicknessSpecs();
    }
  }, []);

  // 监听材料更新事件，刷新项目数据
  useEffect(() => {
    const handleMaterialsUpdate = (event: CustomEvent) => {
      // 刷新项目数据以获取最新的材料状态
      fetchProjects();
    };

    window.addEventListener('materials-updated', handleMaterialsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('materials-updated', handleMaterialsUpdate as EventListener);
    };
  }, [fetchProjects]);

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

  // 更新材料状态 - 使用共享逻辑
  const updateMaterialStatusInTable = async (projectId: number, thicknessSpecId: number, newStatus: StatusType) => {
    const success = await updateMaterialStatusShared(projectId, thicknessSpecId, newStatus, {
      projects: getProjectsList() as any[],
      thicknessSpecs,
      user,
      updateProjectFn: updateProject,
      fetchProjectsFn: fetchProjects,
      setLoadingFn: setLoading,
    });
    
    if (!success) {
      console.error('材料状态更新失败');
    }
  };

  // 恢复项目从过往
  const handleRestoreFromPast = async (projectId: number) => {
    if (!confirm('确定要将此项目恢复到活跃状态吗？项目将重新回到活跃项目列表中。')) {
      return;
    }
    
    setRestoringFromPast(projectId);
    try {
      const success = await restoreFromPastProject(projectId);
      if (success) {
        // 恢复成功，刷新项目列表
        await fetchProjects();
      }
    } finally {
      setRestoringFromPast(null);
    }
  };

  // 移动项目到过往
  const handleMoveToPast = async (projectId: number) => {
    if (!confirm('确定要将此项目移动到过往项目吗？此操作将把项目从活跃状态移动到过往项目管理中。')) {
      return;
    }
    
    setMovingToPast(projectId);
    try {
      const success = await moveToPastProject(projectId);
      if (success) {
        // 移动成功，刷新项目列表
        await fetchProjects();
      }
    } finally {
      setMovingToPast(null);
    }
  };

  // 获取项目的材料状态（根据厚度规格ID）- 使用共享逻辑
  const getProjectMaterialStatusForTable = (projectId: number, thicknessSpecId: number) => {
    return getProjectMaterialStatus(getProjectsList() as any[], projectId, thicknessSpecId);
  };

  // 获取项目的材料信息
  const getProjectMaterial = (projectId: number, thicknessSpecId: number) => {
    const proj = getProjectsList().find(p => p.id === projectId);
    if (!proj || !proj.materials) return null;
    return proj.materials.find(m => m.thicknessSpecId === thicknessSpecId) || null;
  };

  // 处理图纸hover预览
  const handleDrawingHover = (event: React.MouseEvent, drawings: Drawing[]) => {
    if (drawings.length === 0) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverCard({
      isVisible: true,
      position: {
        x: rect.right + 10,
        y: rect.top
      },
      drawings
    });
  };

  // 关闭hover预览
  const handleCloseHover = () => {
    setHoverCard({
      isVisible: false,
      position: { x: 0, y: 0 },
      drawings: []
    });
  };

  // 处理打开图纸
  const handleOpenDrawing = async (drawing: Drawing) => {
    try {
      const fileName = drawing.originalFilename || drawing.filename;
      const cadCheck = await cadFileHandler.isCADFile(fileName);
      
      if (cadCheck.isCADFile) {
        // 使用CAD软件打开
        const result = await cadFileHandler.openCADFile(drawing.filePath);
        if (!result.success) {
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
      
      // 关闭预览卡片
      handleCloseHover();
    } catch (error) {
      console.error('打开图纸失败:', error);
      alert('打开图纸失败');
    }
  };

  // 显示项目列表（格式：序号-项目名-工人-2mm-3mm-4mm...-创建时间-开始时间-完成时间-图纸）
  const renderProjectsTable = () => {
    const projectsToShow = selectedProjectId ? getProjectsList().filter(p => p.id === selectedProjectId) : getProjectsList();
    
    return (
      <div className={`bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col ${className}`}>
        {/* 标题栏 */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-text-primary">
            {selectedProjectId ? `项目详情` : '全部项目'}
          </h3>
          <p className="text-text-secondary text-sm mt-1">
            {selectedProjectId ? '项目板材状态管理' : '项目总览和板材状态'}
          </p>
        </div>

        {/* 项目表格 */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 sticky top-0">
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">开始时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">完成时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">图纸</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projectsToShow.map((proj, index) => {
                // 获取项目开始时间：第一个进入in_progress状态的材料时间
                const getProjectStartTime = (project: ProjectState): string | null => {
                  if (!project.materials || project.materials.length === 0) return null;
                  
                  // 筛选出有startDate且状态为in_progress或completed的材料
                  const materialsWithStartDate = project.materials.filter(material => 
                    material.startDate && (material.status === 'in_progress' || material.status === 'completed')
                  );
                  
                  if (materialsWithStartDate.length === 0) return null;
                  
                  // 找到最早的startDate
                  const earliestStartDate = materialsWithStartDate.reduce((earliest, current) => {
                    if (!earliest.startDate) return current;
                    if (!current.startDate) return earliest;
                    return new Date(current.startDate) < new Date(earliest.startDate) ? current : earliest;
                  });
                  
                  return earliestStartDate.startDate || null;
                };

                const projectStartTime = getProjectStartTime(proj);
                
                // 获取项目完成时间：最后一个completed材料的时间，但如果有未完成任务则清空
                const getProjectCompletedTime = (project: ProjectState): string | null => {
                  if (!project.materials || project.materials.length === 0) return null;
                  
                  // 检查是否有未完成的材料（in_progress或pending状态）
                  const hasIncompleteTask = project.materials.some(material => 
                    material.status === 'in_progress' || material.status === 'pending'
                  );
                  
                  // 如果有未完成任务，返回null（显示-）
                  if (hasIncompleteTask) return null;
                  
                  // 获取所有已完成材料中有completedDate的材料
                  const completedMaterials = project.materials.filter(material => 
                    material.status === 'completed' && material.completedDate
                  );
                  
                  if (completedMaterials.length === 0) return null;
                  
                  // 找到最晚的completedDate
                  const latestCompletedDate = completedMaterials.reduce((latest, current) => {
                    if (!latest.completedDate) return current;
                    if (!current.completedDate) return latest;
                    return new Date(current.completedDate) > new Date(latest.completedDate) ? current : latest;
                  });
                  
                  return latestCompletedDate.completedDate || null;
                };

                const projectCompletedTime = getProjectCompletedTime(proj);
                
                return (
                  <motion.tr
                    key={proj.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {/* 序号 */}
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-text-primary">{index + 1}</div>
                    </td>
                    
                    {/* 项目名 */}
                    <td className="px-4 py-4">
                      <div className="font-medium text-text-primary">{proj.name}</div>
                      <div className="text-xs text-text-secondary">
                        {getStatusText(proj.status)}
                      </div>
                    </td>
                    
                    {/* 工人 */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-text-primary">
                        {proj.assignedWorker?.name || '未分配'}
                      </div>
                    </td>
                    
                    {/* 厚度状态列 */}
                    {thicknessSpecs.map(spec => {
                      const materialStatus = getProjectMaterialStatusForTable(proj.id, spec.id);
                      
                      return (
                        <td key={spec.id} className="px-3 py-4 text-center">
                          <StatusToggle
                            status={materialStatus as StatusType}
                            onChange={(newStatus) => {
                              updateMaterialStatusInTable(proj.id, spec.id, newStatus);
                            }}
                            size="md"
                            disabled={viewType === 'completed'} // 过往项目禁用编辑
                          />
                        </td>
                      );
                    })}
                    
                    {/* 创建时间 */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-text-primary">
                        {proj.createdAt ? new Date(proj.createdAt).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </div>
                    </td>
                    
                    {/* 开始时间 */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-text-primary">
                        {projectStartTime ? new Date(projectStartTime).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </div>
                    </td>
                    
                    {/* 完成时间 */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-text-primary">
                        {projectCompletedTime ? new Date(projectCompletedTime).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </div>
                    </td>
                    
                    {/* 图纸 */}
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-1">
                        {proj.drawings && proj.drawings.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            <span 
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded cursor-pointer hover:bg-blue-200 transition-colors"
                              onMouseEnter={(e) => handleDrawingHover(e, (proj.drawings as any[]).map(d => ({
                                id: d.id,
                                projectId: d.projectId,
                                filename: d.filename,
                                originalFilename: d.originalFilename,
                                filePath: d.filePath,
                                version: d.version,
                                createdAt: d.createdAt
                              })))}
                              onMouseLeave={handleCloseHover}
                              onClick={() => onProjectSelect(proj.id)}
                              title={`查看 ${proj.name} 的图纸详情`}
                            >
                              {proj.drawings.length}个
                            </span>
                            <button 
                              onClick={() => onProjectSelect(proj.id)}
                              className="text-xs text-green-600 hover:text-green-800 hover:bg-green-50 px-1 py-1 rounded transition-colors"
                              title={`为项目 ${proj.name} 添加更多图纸`}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => onProjectSelect(proj.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            title={`为项目 ${proj.name} 上传图纸`}
                          >
                            + 上传图纸
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 操作 */}
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        {/* 活跃项目视图：显示"移至过往"按钮 */}
                        {proj.status === 'completed' && viewType !== 'completed' && (
                          <button
                            onClick={() => handleMoveToPast(proj.id)}
                            disabled={movingToPast === proj.id}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                            title="移动到过往项目"
                          >
                            <ArchiveBoxIcon className="w-3 h-3 mr-1" />
                            {movingToPast === proj.id ? '移动中...' : '移至过往'}
                          </button>
                        )}
                        
                        {/* 过往项目视图：显示"恢复项目"按钮 */}
                        {viewType === 'completed' && (
                          <button
                            onClick={() => handleRestoreFromPast(proj.id)}
                            disabled={restoringFromPast === proj.id}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                            title="恢复到活跃项目"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {restoringFromPast === proj.id ? '恢复中...' : '恢复项目'}
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          
          {projectsToShow.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 text-lg">
                  {viewType === 'completed' ? '暂无过往项目' : '暂无活跃项目'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {viewType === 'active' ? '点击右上角"新建"按钮创建项目' : 
                   viewType === 'completed' ? '已完成的项目移动到过往后会显示在这里' :
                   ''}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* 图纸预览卡片 */}
        <DrawingHoverCard
          drawings={hoverCard.drawings}
          isVisible={hoverCard.isVisible}
          position={hoverCard.position}
          onClose={handleCloseHover}
          onOpenDrawing={handleOpenDrawing}
        />
      </div>
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待处理';
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  return renderProjectsTable();
};