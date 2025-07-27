'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableProjectRow } from './SortableProjectRow';
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
  
  // 拖拽排序相关状态
  const [projectOrder, setProjectOrder] = useState<ProjectState[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  
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

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // 同步项目排序状态
  useEffect(() => {
    const projectsList = getProjectsList();
    if (JSON.stringify(projectOrder) !== JSON.stringify(projectsList)) {
      setProjectOrder(projectsList);
    }
  }, [projects, pastProjects, workerNameFilter, thicknessFilter, viewType]);

  // 处理拖拽结束
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = projectOrder.findIndex(project => project.id === active.id);
      const newIndex = projectOrder.findIndex(project => project.id === over.id);
      
      const newOrder = arrayMove(projectOrder, oldIndex, newIndex);
      setProjectOrder(newOrder);

      // 发送排序更新到后端
      try {
        setIsReordering(true);
        const projectIds = newOrder.map(project => project.id);
        
        const response = await fetch('/api/projects/reorder', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ projectIds }),
        });

        if (!response.ok) {
          throw new Error('更新项目排序失败');
        }

        // 刷新项目数据
        await fetchProjects();
      } catch (error) {
        console.error('更新项目排序失败:', error);
        // 恢复原来的顺序
        setProjectOrder(getProjectsList());
      } finally {
        setIsReordering(false);
      }
    }
  };

  // 如果还没有加载厚度规格，先加载
  useEffect(() => {
    if (token && thicknessSpecs.length === 0) {
      fetchThicknessSpecs();
    }
  }, [token]);

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
    if (!token) {
      console.log('Token not available, skipping thickness specs fetch');
      return;
    }
    
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
    const projectsToShow = selectedProjectId ? projectOrder.filter(p => p.id === selectedProjectId) : projectOrder;
    
    return (
      <div className={`bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col ${className}`}>
        {/* 标题栏 */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-text-primary">
            {selectedProjectId ? `项目详情` : '全部项目'}
          </h3>
          <p className="text-text-secondary text-sm mt-1">
            {selectedProjectId ? '项目板材状态管理' : '项目总览和板材状态（支持拖拽排序）'}
          </p>
          {isReordering && (
            <div className="mt-2 text-xs text-blue-600 flex items-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-2"></div>
              正在保存排序...
            </div>
          )}
        </div>

        {/* 项目表格 */}
        <div className="flex-1 overflow-auto">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full">
              <thead className="bg-gray-50/50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">序号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目名</th>
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
              <SortableContext 
                items={projectsToShow.map(p => p.id)} 
                strategy={verticalListSortingStrategy}
              >
                <tbody className="divide-y divide-gray-200">
                  {projectsToShow.map((proj, index) => (
                    <SortableProjectRow
                      key={proj.id}
                      project={proj}
                      index={index}
                      thicknessSpecs={thicknessSpecs}
                      viewType={viewType}
                      movingToPast={movingToPast}
                      restoringFromPast={restoringFromPast}
                      getProjectMaterialStatusForTable={getProjectMaterialStatusForTable}
                      updateMaterialStatusInTable={updateMaterialStatusInTable}
                      handleDrawingHover={handleDrawingHover}
                      handleCloseHover={handleCloseHover}
                      onProjectSelect={onProjectSelect}
                      handleMoveToPast={handleMoveToPast}
                      handleRestoreFromPast={handleRestoreFromPast}
                      getStatusText={getStatusText}
                      getPriorityColorBadge={getPriorityColorBadge}
                      getPriorityText={getPriorityText}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
          
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

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-700 bg-red-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'low': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getPriorityColorBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return renderProjectsTable();
};