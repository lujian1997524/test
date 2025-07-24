'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useMaterialStore, useProjectStore } from '@/stores';
import { StatusToggle } from '@/components/ui';
import type { StatusType } from '@/components/ui';

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
  version: string;
  createdAt: string;
}

interface Project {
  id: number;
  name: string;
  status: string;
  priority: string;
  createdAt: string;
  creator?: { id: number; name: string };
  assignedWorker?: { id: number; name: string };
  materials: Material[];
  drawings: Drawing[];
}

interface MaterialsTableProps {
  selectedProjectId: number | null;
  onProjectSelect: (id: number | null) => void;
  className?: string;
}

export const MaterialsTable = ({ 
  selectedProjectId, 
  onProjectSelect, 
  className = '' 
}: MaterialsTableProps) => {
  const [thicknessSpecs, setThicknessSpecs] = useState<ThicknessSpec[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingNotes, setEditingNotes] = useState<{projectId: number, thicknessSpecId: number} | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const { token, user } = useAuth();
  const { updateMaterialStatus } = useMaterialStore();
  const { projects, updateProject } = useProjectStore();

  // 如果还没有加载厚度规格，先加载
  useEffect(() => {
    if (thicknessSpecs.length === 0) {
      fetchThicknessSpecs();
    }
  }, []);

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

  // 计算项目应该的状态（基于当前已知的状态变更）
  const calculateProjectStatusRealtime = (projectId: number, changedThicknessSpecId?: number, newMaterialStatus?: StatusType): string => {
    const currentProject = projects.find(p => p.id === projectId);
    
    // 获取所有厚度规格的状态（包括即将变更的状态）
    const allThicknessStatuses: string[] = [];
    
    thicknessSpecs.forEach(spec => {
      if (spec.id === changedThicknessSpecId) {
        // 这是正在变更的厚度规格，使用新状态
        if (newMaterialStatus === 'empty') {
          allThicknessStatuses.push('empty');
        } else {
          allThicknessStatuses.push(newMaterialStatus || 'empty');
        }
      } else {
        // 其他厚度规格，查找现有材料记录
        const material = currentProject?.materials?.find(m => m.thicknessSpecId === spec.id);
        if (material) {
          allThicknessStatuses.push(material.status);
        } else {
          allThicknessStatuses.push('empty');
        }
      }
    });

    // 检查各种状态是否存在
    const hasEmpty = allThicknessStatuses.some(status => status === 'empty');
    const hasPending = allThicknessStatuses.some(status => status === 'pending');
    const hasInProgress = allThicknessStatuses.some(status => status === 'in_progress');
    const hasCompleted = allThicknessStatuses.some(status => status === 'completed');

    // 调试信息
    console.log(`项目 ${projectId} 实时状态分析:`, {
      allThicknessStatuses,
      hasEmpty,
      hasPending,
      hasInProgress,
      hasCompleted,
      changedSpec: changedThicknessSpecId,
      newStatus: newMaterialStatus
    });

    // 规则1: 有任何一个进行中状态时，项目为进行中状态
    if (hasInProgress) {
      console.log(`项目 ${projectId} -> in_progress (规则1: 有进行中状态)`);
      return 'in_progress';
    }

    // 规则2: 当待处理状态和已完成状态同时存在时，项目为进行中状态
    if (hasPending && hasCompleted) {
      console.log(`项目 ${projectId} -> in_progress (规则2: 待处理+已完成)`);
      return 'in_progress';
    }

    // 规则3: 当只有空白状态和已完成状态时，项目为已完成状态
    if (hasCompleted && !hasPending && !hasInProgress) {
      console.log(`项目 ${projectId} -> completed (规则3: 只有空白+已完成)`);
      return 'completed';
    }

    // 规则4: 当只有空白状态和待处理状态时，项目为待处理状态
    console.log(`项目 ${projectId} -> pending (规则4: 默认)`);
    return 'pending';
  };

  // 更新项目状态（实时）
  const updateProjectStatusRealtime = async (projectId: number, changedThicknessSpecId: number, newMaterialStatus: StatusType) => {
    console.log(`🔥 实时更新项目状态，项目ID: ${projectId}, 变更规格: ${changedThicknessSpecId}, 新状态: ${newMaterialStatus}`);
    
    const newStatus = calculateProjectStatusRealtime(projectId, changedThicknessSpecId, newMaterialStatus);
    const currentProject = projects.find(p => p.id === projectId);
    
    if (currentProject && currentProject.status !== newStatus) {
      console.log(`项目 ${projectId} 状态变更: ${currentProject.status} → ${newStatus}`);
      
      try {
        await updateProject(projectId, { status: newStatus as 'pending' | 'in_progress' | 'completed' | 'cancelled' });
        console.log(`项目 ${projectId} 状态更新成功`);
      } catch (error) {
        console.error('更新项目状态失败:', error);
      }
    } else {
      console.log(`项目 ${projectId} 状态无需变更，当前状态: ${currentProject?.status}`);
    }
  };

  // 更新材料状态
  const updateMaterialStatusInTable = async (projectId: number, thicknessSpecId: number, newStatus: StatusType) => {
    console.log(`🎯 材料状态更新开始: 项目${projectId}, 厚度规格${thicknessSpecId}, 新状态${newStatus}`);
    
    try {
      setLoading(true);
      
      // 从projects数组中找到对应项目
      const currentProject = projects.find(p => p.id === projectId);
      if (!currentProject) {
        console.error('项目不存在');
        return;
      }
      
      const existingMaterial = currentProject.materials?.find(m => m.thicknessSpecId === thicknessSpecId);
      
      if (newStatus === 'empty') {
        // 如果切换到空白状态，删除现有材料记录
        if (existingMaterial) {
          const deleteResponse = await fetch(`/api/materials/${existingMaterial.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json();
            alert('删除材料记录失败: ' + (errorData.error || '服务器错误'));
            return;
          }
        }
        // 成功删除或本来就没有记录，立即更新项目状态
        window.dispatchEvent(new CustomEvent('materials-updated'));
        await updateProjectStatusRealtime(projectId, thicknessSpecId, 'empty');
        return;
      }
      
      if (existingMaterial) {
        // 更新现有材料
        const updateData: any = { 
          status: newStatus
        };

        if (newStatus === 'in_progress' && !existingMaterial.startDate) {
          updateData.startDate = new Date().toISOString().split('T')[0];
        }

        if (newStatus === 'completed') {
          updateData.completedDate = new Date().toISOString().split('T')[0];
          updateData.completedBy = user?.id;
        }

        const result = await updateMaterialStatus(existingMaterial.id, newStatus, updateData);
        
        if (!result) {
          alert('更新材料状态失败，请重试');
        }
      } else {
        // 创建新材料记录
        const createData: any = {
          projectId: projectId,
          thicknessSpecId: thicknessSpecId,
          status: newStatus
        };

        if (newStatus === 'in_progress') {
          createData.startDate = new Date().toISOString().split('T')[0];
        } else if (newStatus === 'completed') {
          createData.completedDate = new Date().toISOString().split('T')[0];
          createData.completedBy = user?.id;
        }

        const createResponse = await fetch('/api/materials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(createData),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          alert('创建材料记录失败: ' + (errorData.error || '服务器错误'));
          return;
        }
      }
      
      // 成功更新或创建后，立即更新项目状态
      window.dispatchEvent(new CustomEvent('materials-updated'));
      await updateProjectStatusRealtime(projectId, thicknessSpecId, newStatus);
      
    } catch (error) {
      console.error('更新材料状态失败:', error);
      alert('更新材料状态失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取项目的材料状态（根据厚度规格ID）
  const getProjectMaterialStatus = (projectId: number, thicknessSpecId: number) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj || !proj.materials) return 'empty';
    const material = proj.materials.find(m => m.thicknessSpecId === thicknessSpecId);
    return (material?.status || 'empty') as StatusType;
  };

  // 获取项目的材料信息
  const getProjectMaterial = (projectId: number, thicknessSpecId: number) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj || !proj.materials) return null;
    return proj.materials.find(m => m.thicknessSpecId === thicknessSpecId) || null;
  };

  // 显示项目列表（格式：序号-项目名-工人-2mm-3mm-4mm...-备注-开始时间-完成时间-图纸）
  const renderProjectsTable = () => {
    const projectsToShow = selectedProjectId ? projects.filter(p => p.id === selectedProjectId) : projects;
    
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">开始时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">完成时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">图纸</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projectsToShow.map((proj, index) => {
                // 获取该项目的第一个材料的时间信息（作为项目级别的时间显示）
                const firstMaterial = proj.materials && proj.materials.length > 0 ? proj.materials[0] : null;
                
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
                      const materialStatus = getProjectMaterialStatus(proj.id, spec.id);
                      
                      return (
                        <td key={spec.id} className="px-3 py-4 text-center">
                          <StatusToggle
                            status={materialStatus as StatusType}
                            onChange={(newStatus) => {
                              updateMaterialStatusInTable(proj.id, spec.id, newStatus);
                            }}
                            size="md"
                          />
                        </td>
                      );
                    })}
                    
                    {/* 备注 */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-text-primary max-w-32 truncate">
                        {firstMaterial?.notes || '-'}
                      </div>
                    </td>
                    
                    {/* 开始时间 */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-text-primary">
                        {firstMaterial?.startDate || '-'}
                      </div>
                    </td>
                    
                    {/* 完成时间 */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-text-primary">
                        {firstMaterial?.completedDate || '-'}
                      </div>
                    </td>
                    
                    {/* 图纸 */}
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-1">
                        {proj.drawings && proj.drawings.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {proj.drawings.length}个
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-text-secondary">无</span>
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
                <p className="text-gray-500 text-lg">暂无项目</p>
                <p className="text-gray-400 text-sm mt-2">点击右上角"新建"按钮创建项目</p>
              </div>
            </div>
          )}
        </div>
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