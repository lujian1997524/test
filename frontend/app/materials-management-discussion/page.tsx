'use client'

import React, { useState } from 'react'
import { Card, Button, Input, Badge, StatusIndicator, Alert, Empty, Avatar, Switch, Dropdown, TabBar } from '@/components/ui'
import type { DropdownOption, TabItem, StatusType } from '@/components/ui'
import { 
  ViewColumnsIcon, 
  FolderIcon, 
  ChartBarIcon, 
  ArchiveBoxIcon,
  CogIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BoltIcon
} from '@heroicons/react/24/outline'

export default function MaterialsManagementDiscussion() {
  const [selectedDemo, setSelectedDemo] = useState<string>('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <ArchiveBoxIcon className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              板材库存管理功能讨论页面
            </h1>
          </div>
          <p className="text-gray-600">
            精简版设计方案讨论，聚焦核心功能和实施策略
          </p>
        </div>

        {/* 导航标签 */}
        <div className="mb-6">
          <TabBar
            tabs={[
              { id: 'overview', label: '总体设计' },
              { id: 'main-table', label: '主页面表格设计' },
              { id: 'inventory', label: '库存管理' },
              { id: 'auxiliary', label: '辅助功能' },
              { id: 'integration', label: '功能整合策略' }
            ]}
            activeTab={selectedDemo}
            onChange={setSelectedDemo}
            variant="pills"
            className="overflow-x-auto"
          />
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 左侧：讨论要点 */}
          <div className="lg:col-span-4">
            <Card className="h-fit sticky top-6">
              <div className="flex items-center mb-4">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold">讨论要点</h3>
              </div>
              
              <div className="space-y-4 text-sm">
                <Alert variant="info" title="已确定">
                  <div className="flex items-start mb-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">已确定方案</span>
                  </div>
                  <ul className="space-y-1">
                    <li>• 采用侧边栏+主显示区域布局</li>
                    <li>• 保持MaterialsTable现有逻辑</li>
                    <li>• 支持拼板切割（切割号概念）</li>
                    <li>• 主表格简化编码：M=锰板、T=碳板、B=不锈钢</li>
                    <li>• 库存管理使用完整材质名称</li>
                    <li>• 渐进式功能整合，不影响现有操作</li>
                  </ul>
                </Alert>

                <Alert variant="success" title="核心目标">
                  <div className="flex items-start mb-2">
                    <BoltIcon className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">核心目标</span>
                  </div>
                  <ul className="space-y-1">
                    <li>• 最小改动现有系统</li>
                    <li>• 解决实际生产需求</li>
                    <li>• 操作简单直观</li>
                    <li>• 支持渐进式实施</li>
                  </ul>
                </Alert>
              </div>
            </Card>
          </div>

          {/* 右侧：示例展示 */}
          <div className="lg:col-span-8">
            <Card>
              {selectedDemo === 'overview' && <OverviewDemo />}
              {selectedDemo === 'main-table' && <MainTableDesignDemo />}
              {selectedDemo === 'inventory' && <InventoryDemo />}
              {selectedDemo === 'auxiliary' && <AuxiliaryDemo />}
              {selectedDemo === 'integration' && <IntegrationDemo />}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// 总体设计演示
function OverviewDemo() {
  return (
    <div>
      <div className="flex items-center mb-4">
        <ViewColumnsIcon className="w-6 h-6 text-blue-600 mr-2" />
        <h3 className="text-xl font-semibold">总体布局设计</h3>
      </div>
      
      <Card className="bg-white">
        <div className="text-center text-gray-500 mb-4 border-b pb-2">
          板材管理页面（类似图纸库布局）
        </div>
        
        <div className="flex h-96 border rounded">
          {/* 左侧边栏模拟 */}
          <div className="w-1/3 bg-gray-50 border-r p-3">
            <div className="flex items-center text-sm font-medium text-gray-700 mb-3">
              <FolderIcon className="w-4 h-4 mr-1" />
              侧边栏导航
            </div>
            <div className="space-y-2 text-sm">
              <Card className="p-2 bg-blue-100 text-blue-800" hoverable>
                <div className="flex items-center">
                  <ArchiveBoxIcon className="w-4 h-4 mr-1" />
                  锰板 (45张)
                </div>
              </Card>
              <Card className="p-2 bg-gray-100 text-gray-600" hoverable>
                <div className="flex items-center">
                  <ArchiveBoxIcon className="w-4 h-4 mr-1" />
                  碳板 (32张)
                </div>
              </Card>
              <Card className="p-2 bg-gray-100 text-gray-600" hoverable>
                <div className="flex items-center">
                  <ArchiveBoxIcon className="w-4 h-4 mr-1" />
                  不锈钢 (28张)
                </div>
              </Card>
              <div className="border-t pt-2 mt-3">
                <Card className="p-2 bg-gray-100 text-gray-600" hoverable>
                  <div className="flex items-center">
                    <ChartBarIcon className="w-4 h-4 mr-1" />
                    统计信息
                  </div>
                </Card>
                <Card className="p-2 bg-gray-100 text-gray-600" hoverable>
                  <div className="flex items-center">
                    <ArrowPathIcon className="w-4 h-4 mr-1" />
                    借用管理
                  </div>
                </Card>
              </div>
            </div>
          </div>
          
          {/* 主显示区域模拟 */}
          <div className="flex-1 p-3">
            <div className="flex items-center text-sm font-medium text-gray-700 mb-3">
              <ViewColumnsIcon className="w-4 h-4 mr-1" />
              主显示区域
            </div>
            <Card className="bg-blue-50 p-4 text-center text-blue-700">
              根据左侧选择显示对应内容
              <br />
              <span className="text-sm">当前显示：锰板库存详情</span>
            </Card>
            
            <div className="mt-4 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>厚度规格</span>
                <span>归属人</span>
                <span>库存/已用</span>
                <span>操作</span>
              </div>
              <div className="flex justify-between p-2 border rounded">
                <span>3mm</span>
                <span>张三</span>
                <span>15/5张</span>
                <Button size="xs" variant="ghost">[详情]</Button>
              </div>
              <div className="flex justify-between p-2 border rounded">
                <span>4mm</span>
                <span>李四</span>
                <span>8/2张</span>
                <Button size="xs" variant="ghost">[详情]</Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// 主页面表格设计演示
function MainTableDesignDemo() {
  const [tableMode, setTableMode] = useState<'enhanced'>('enhanced')
  
  // 项目示例（使用简化编码）
  const mockProjects = [
    { 
      id: 1, 
      name: '项目A', 
      worker: '张三', 
      materials: ['M3×1'], 
      cuttingNo: 'C1215-001', 
      hasRemainder: true 
    },
    { 
      id: 2, 
      name: '项目B', 
      worker: '李四', 
      materials: [], 
      cuttingNo: '', 
      hasRemainder: false 
    }
  ]
  
  return (
    <div>
      <div className="flex items-center mb-4">
        <ViewColumnsIcon className="w-6 h-6 text-blue-600 mr-2" />
        <h3 className="text-xl font-semibold">主页面表格设计（MaterialsTable）</h3>
      </div>
      
      <div className="space-y-6">
        <Alert variant="info" title="简化编码说明">
          <div className="flex items-center space-x-4 text-sm">
            <span><strong>材质编码：</strong></span>
            <span>M=锰板</span>
            <span>T=碳板</span>
            <span>B=不锈钢</span>
            <span>数字=厚度(mm)</span>
            <span>✓=有余料</span>
          </div>
        </Alert>

        <div>
          <h4 className="font-medium mb-3">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
              紧凑设计 - 新增列示例
            </div>
          </h4>
          
          <Card className="bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-left">项目名</th>
                  <th className="p-3 text-left">工人</th>
                  <th className="p-3 text-left">M3</th>
                  <th className="p-3 text-left">T4</th>
                  <th className="p-3 text-left">B5</th>
                  <th className="p-3 text-left">备注</th>
                  <th className="p-3 text-left">📦用料</th>
                  <th className="p-3 text-left">切割号</th>
                  <th className="p-3 text-left">时间</th>
                  <th className="p-3 text-left">图纸</th>
                </tr>
              </thead>
              <tbody>
                {mockProjects.map((project) => (
                  <tr key={project.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{project.name}</td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <Avatar name={project.worker} size="xs" className="mr-2" />
                        {project.worker}
                      </div>
                    </td>
                    <td className="p-3">
                      <StatusIndicator status={project.id === 1 ? "in_progress" : "pending"} size="sm" />
                    </td>
                    <td className="p-3">
                      <StatusIndicator status="empty" size="sm" />
                    </td>
                    <td className="p-3">
                      <StatusIndicator status="empty" size="sm" />
                    </td>
                    <td className="p-3">客户{project.name.slice(-1)}订单</td>
                    <td className="p-3">
                      {project.materials.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {project.materials.map((material, index) => (
                            <Badge key={index} variant="success" size="sm">
                              {material}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Button size="xs" variant="ghost" className="text-blue-600">
                          选择用料
                        </Button>
                      )}
                    </td>
                    <td className="p-3">
                      {project.cuttingNo ? (
                        <div className="flex items-center">
                          <Badge variant="primary" size="sm">{project.cuttingNo}</Badge>
                          {project.hasRemainder && (
                            <span className="ml-1 w-2 h-2 bg-green-400 rounded-full" title="有余料"></span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-gray-600">12-15 09:30</td>
                    <td className="p-3">
                      <Button size="xs" variant="ghost">
                        <FolderIcon className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          
          <Alert variant="success" className="mt-4" title="主要优势">
            <ul className="space-y-1 text-sm">
              <li>• 表格宽度固定，不会随项目增加而变宽</li>
              <li>• 简化编码节省空间，提高可读性</li>
              <li>• 新增"用料"和"切割号"列，信息更完整</li>
              <li>• 支持复杂厚度组合，不限种类数量</li>
            </ul>
          </Alert>
        </div>
      </div>
    </div>
  )
}

// 库存管理演示（合并侧边栏设计和库存管理）
function InventoryDemo() {
  const [viewMode, setViewMode] = useState<'sidebar' | 'summary' | 'detailed'>('sidebar')
  const [selectedCategory, setSelectedCategory] = useState('锰板')
  
  return (
    <div>
      <div className="flex items-center mb-4">
        <ArchiveBoxIcon className="w-6 h-6 text-blue-600 mr-2" />
        <h3 className="text-xl font-semibold">库存管理系统</h3>
      </div>
      
      <Alert variant="warning" className="mb-4" title="编码使用说明">
        <p className="text-sm">
          库存管理页面使用<strong>完整材质名称</strong>（锰板、碳板、不锈钢），
          只有在主页面表格和项目详情中才使用简化编码（M/T/B）。
        </p>
      </Alert>
      
      <div className="space-y-6">
        {/* 视图切换 */}
        <div>
          <TabBar
            tabs={[
              { id: 'sidebar', label: '侧边栏分类' },
              { id: 'summary', label: '汇总视图' },
              { id: 'detailed', label: '详细视图' }
            ]}
            activeTab={viewMode}
            onChange={(tab) => setViewMode(tab as 'sidebar' | 'summary' | 'detailed')}
            variant="pills"
            className="mb-4"
          />
        </div>

        {viewMode === 'sidebar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 侧边栏结构 */}
            <div>
              <h4 className="font-medium mb-3">分类结构</h4>
              <Card className="bg-gray-50">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center font-medium text-gray-700 mb-2">
                    <FolderIcon className="w-4 h-4 mr-1" />
                    材质库存
                  </div>
                  
                  <div className="space-y-1">
                    <Button
                      variant={selectedCategory === '锰板' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedCategory('锰板')}
                      className="w-full justify-start"
                    >
                      <ArchiveBoxIcon className="w-4 h-4 mr-2" />
                      锰板 (45张)
                    </Button>
                    
                    <Button
                      variant={selectedCategory === '碳板' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedCategory('碳板')}
                      className="w-full justify-start"
                    >
                      <ArchiveBoxIcon className="w-4 h-4 mr-2" />
                      碳板 (32张)
                    </Button>
                    
                    <Button
                      variant={selectedCategory === '不锈钢' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedCategory('不锈钢')}
                      className="w-full justify-start"
                    >
                      <ArchiveBoxIcon className="w-4 h-4 mr-2" />
                      不锈钢 (28张)
                    </Button>
                  </div>

                  {/* 其他功能 */}
                  <div className="border-t pt-2 mt-3">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <ChartBarIcon className="w-4 h-4 mr-2" />
                      库存总览
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <ArrowPathIcon className="w-4 h-4 mr-2" />
                      借用管理
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* 对应显示内容 */}
            <div>
              <h4 className="font-medium mb-3">选中"{selectedCategory}"时显示</h4>
              <Card className="bg-white">
                <div className="text-sm font-medium mb-3">{selectedCategory}库存详情</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 bg-gray-50 rounded font-medium">
                    <span>规格</span>
                    <span>归属</span>
                    <span>库存</span>
                  </div>
                  <div className="flex justify-between p-2 border rounded">
                    <span>3mm(1220×2440)</span>
                    <span>张三</span>
                    <span>15/5张</span>
                  </div>
                  <div className="flex justify-between p-2 border rounded">
                    <span>4mm(1220×2440)</span>
                    <span>李四</span>
                    <span>8/2张</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {viewMode === 'summary' && (
          <div>
            <h4 className="font-medium mb-3">汇总视图 - 锰板库存总览</h4>
            <Card className="bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 text-left">材质类型</th>
                    <th className="p-3 text-left">厚度规格</th>
                    <th className="p-3 text-left">总库存</th>
                    <th className="p-3 text-left">已使用</th>
                    <th className="p-3 text-left">剩余量</th>
                    <th className="p-3 text-left">余料数</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">锰板</td>
                    <td className="p-3">3mm (1220×2440)</td>
                    <td className="p-3 font-medium">35张</td>
                    <td className="p-3 text-red-600">12张</td>
                    <td className="p-3 text-green-600 font-medium">23张</td>
                    <td className="p-3">
                      <Badge variant="info" size="sm">5块余料</Badge>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">锰板</td>
                    <td className="p-3">4mm (1220×2440)</td>
                    <td className="p-3 font-medium">28张</td>
                    <td className="p-3 text-red-600">8张</td>
                    <td className="p-3 text-green-600 font-medium">20张</td>
                    <td className="p-3">
                      <Badge variant="info" size="sm">2块余料</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {viewMode === 'detailed' && (
          <div>
            <h4 className="font-medium mb-3">详细视图 - 锰板3mm明细</h4>
            <Card className="bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 text-left">序号</th>
                    <th className="p-3 text-left">尺寸规格</th>
                    <th className="p-3 text-left">归属人</th>
                    <th className="p-3 text-left">库存数量</th>
                    <th className="p-3 text-left">已用数量</th>
                    <th className="p-3 text-left">使用率</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">#001</td>
                    <td className="p-3">1220×2440</td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <Avatar name="张三" size="xs" className="mr-2" />
                        张三
                      </div>
                    </td>
                    <td className="p-3 font-medium">20张</td>
                    <td className="p-3 text-red-600">5张</td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{width: '25%'}}></div>
                        </div>
                        <span className="text-xs text-gray-600">25%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// 辅助功能演示（合并切割管理和借用管理）
function AuxiliaryDemo() {
  const [auxMode, setAuxMode] = useState<'cutting' | 'borrow'>('cutting')
  
  return (
    <div>
      <div className="flex items-center mb-4">
        <BoltIcon className="w-6 h-6 text-blue-600 mr-2" />
        <h3 className="text-xl font-semibold">辅助功能</h3>
      </div>
      
      <div className="space-y-6">
        {/* 功能切换 */}
        <div>
          <TabBar
            tabs={[
              { id: 'cutting', label: '切割管理' },
              { id: 'borrow', label: '借用管理' }
            ]}
            activeTab={auxMode}
            onChange={(tab) => setAuxMode(tab as 'cutting' | 'borrow')}
            variant="pills"
            className="mb-4"
          />
        </div>

        {auxMode === 'cutting' && (
          <div>
            <h4 className="font-medium mb-3">切割管理流程</h4>
            
            {/* 拼板切割 */}
            <Card className="bg-green-50">
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">拼板切割流程：</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Card className="p-2 bg-white text-center">
                    <div className="flex items-center justify-center mb-1">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 mr-1" />
                      <span className="font-medium">项目A</span>
                    </div>
                    <Badge variant="info" size="sm">需要3mm锰板</Badge>
                  </Card>
                  <Card className="p-2 bg-white text-center">
                    <div className="flex items-center justify-center mb-1">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 mr-1" />
                      <span className="font-medium">项目B</span>
                    </div>
                    <Badge variant="info" size="sm">需要3mm锰板</Badge>
                  </Card>
                  <Card className="p-2 bg-white text-center">
                    <div className="flex items-center justify-center mb-1">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 mr-1" />
                      <span className="font-medium">项目C</span>
                    </div>
                    <Badge variant="info" size="sm">需要3mm锰板</Badge>
                  </Card>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <Card className="flex-1 text-center p-3 bg-white">
                  <div className="font-medium">选择材料</div>
                  <Badge variant="success" size="sm" className="mt-1">张三的3mm锰板 1张</Badge>
                </Card>
                <div className="text-green-600 font-bold">→</div>
                <Card className="flex-1 text-center p-3 bg-white">
                  <div className="font-medium">生成切割号</div>
                  <Badge variant="primary" size="sm" className="mt-1">C20241215-002</Badge>
                </Card>
                <div className="text-green-600 font-bold">→</div>
                <Card className="flex-1 text-center p-3 bg-white">
                  <div className="font-medium">批量更新状态</div>
                  <div className="flex items-center justify-center mt-1">
                    <StatusIndicator status="in_progress" size="sm" />
                    <span className="ml-1 text-xs">3个项目</span>
                  </div>
                </Card>
              </div>
            </Card>

            {/* 切割记录 */}
            <div className="mt-4">
              <h5 className="font-medium mb-3">切割记录</h5>
              <Card>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left border-b">切割号</th>
                      <th className="p-3 text-left border-b">时间</th>
                      <th className="p-3 text-left border-b">材料规格</th>
                      <th className="p-3 text-left border-b">项目数</th>
                      <th className="p-3 text-left border-b">余料</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">
                        <Badge variant="primary" size="sm">C20241215-001</Badge>
                      </td>
                      <td className="p-3">09:30</td>
                      <td className="p-3">3mm锰板</td>
                      <td className="p-3">2个项目</td>
                      <td className="p-3">
                        <StatusIndicator status="completed" size="sm" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            </div>
          </div>
        )}

        {auxMode === 'borrow' && (
          <div>
            <h4 className="font-medium mb-3">借用管理</h4>
            
            {/* 待归还借用 */}
            <Card>
              <div className="flex items-center mb-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                <h5 className="font-medium">待归还借用</h5>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-red-50">
                  <tr>
                    <th className="p-3 text-left border-b">借用时间</th>
                    <th className="p-3 text-left border-b">借用人</th>
                    <th className="p-3 text-left border-b">被借用人</th>
                    <th className="p-3 text-left border-b">材质规格</th>
                    <th className="p-3 text-left border-b">数量</th>
                    <th className="p-3 text-left border-b">借用天数</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">2024-12-15 09:30</td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <Avatar name="张三" size="xs" className="mr-2" />
                        张三
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <Avatar name="李四" size="xs" className="mr-2" />
                        李四
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="info" size="sm">碳板4mm</Badge>
                    </td>
                    <td className="p-3">2张</td>
                    <td className="p-3">
                      <Badge variant="danger" size="sm">3天</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>

            {/* 借用统计 */}
            <div className="mt-4">
              <h5 className="font-medium mb-3">借用统计</h5>
              <div className="grid grid-cols-3 gap-4">
                <Card className="text-center p-4 bg-red-50">
                  <div className="text-2xl font-bold text-red-600">3</div>
                  <div className="text-sm text-red-700">待归还</div>
                </Card>
                <Card className="text-center p-4 bg-green-50">
                  <div className="text-2xl font-bold text-green-600">15</div>
                  <div className="text-sm text-green-700">本周已归还</div>
                </Card>
                <Card className="text-center p-4 bg-blue-50">
                  <div className="text-2xl font-bold text-blue-600">28</div>
                  <div className="text-sm text-blue-700">总借用次数</div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 功能整合策略演示  
function IntegrationDemo() {
  const [integrationTab, setIntegrationTab] = useState<'current-features' | 'new-features' | 'implementation'>('current-features')
  
  return (
    <div>
      <div className="flex items-center mb-4">
        <BoltIcon className="w-6 h-6 text-blue-600 mr-2" />
        <h3 className="text-xl font-semibold">功能整合策略</h3>
      </div>
      
      <div className="space-y-6">
        {/* 策略选择 */}
        <div>
          <h4 className="font-medium mb-3">整合方案</h4>
          <TabBar
            tabs={[
              { id: 'current-features', label: '现有功能保持' },
              { id: 'new-features', label: '新功能集成' },
              { id: 'implementation', label: '实施策略' }
            ]}
            activeTab={integrationTab}
            onChange={(tab) => setIntegrationTab(tab as 'current-features' | 'new-features' | 'implementation')}
            variant="pills"
            className="mb-4"
          />
        </div>

        {integrationTab === 'current-features' && (
          <div>
            <h4 className="font-medium mb-3">现有功能完全保持</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 状态实时变更 */}
              <Alert variant="success" title="状态实时变更 - 保持不变">
                <div className="flex items-start mb-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">完全保持现有逻辑</span>
                </div>
                <ul className="space-y-1 text-sm">
                  <li>• StatusToggle 四状态切换保持不变</li>
                  <li>• Zustand + 事件驱动机制保持</li>
                  <li>• materials 表操作逻辑保持</li>
                  <li>• SSE 通知机制保持</li>
                </ul>
              </Alert>

              {/* 其他功能保持 */}
              <Alert variant="success" title="其他功能 - 扩展增强">
                <div className="flex items-start mb-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">保持现有 + 库存扩展</span>
                </div>
                <ul className="space-y-1 text-sm">
                  <li>• 弹窗通知：新增库存提醒</li>
                  <li>• 移至过往：新增用料历史</li>
                  <li>• 时间管理：新增库存时间</li>
                  <li>• 项目详情：新增库存信息</li>
                </ul>
              </Alert>
            </div>
          </div>
        )}

        {integrationTab === 'new-features' && (
          <div>
            <h4 className="font-medium mb-3">新功能无缝集成</h4>
            
            {/* MaterialsTable 集成展示 */}
            <div className="mb-6">
              <h5 className="font-medium mb-3">MaterialsTable 新增列（使用简化编码）</h5>
              <Card className="bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left border-b">项目名</th>
                      <th className="p-3 text-left border-b">工人</th>
                      <th className="p-3 text-left border-b">M3</th>
                      <th className="p-3 text-left border-b">T4</th>
                      <th className="p-3 text-left border-b">备注</th>
                      <th className="p-3 text-left border-b">📦用料</th>
                      <th className="p-3 text-left border-b">切割号</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">项目A</td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <Avatar name="张三" size="xs" className="mr-2" />
                          张三
                        </div>
                      </td>
                      <td className="p-3">
                        <StatusIndicator status="in_progress" size="sm" />
                      </td>
                      <td className="p-3">
                        <StatusIndicator status="empty" size="sm" />
                      </td>
                      <td className="p-3">客户A订单</td>
                      <td className="p-3">
                        <Badge variant="success" size="sm">M3×1</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="primary" size="sm">C1215-001✓</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <div className="flex items-center space-x-4">
                    <span><strong>编码说明：</strong></span>
                    <span>M=锰板</span>
                    <span>T=碳板</span>
                    <span>B=不锈钢</span>
                    <span>数字=厚度(mm)</span>
                    <span>✓=有余料</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* ProjectDetail 集成 */}
            <div>
              <h5 className="font-medium mb-3">ProjectDetail 组件新增库存信息</h5>
              <Card className="bg-gray-50">
                <Card className="bg-white">
                  <div className="text-sm font-medium mb-2">📦 用料信息</div>
                  
                  <div className="mb-3">
                    <div className="text-xs text-gray-600 mb-1">已选材料</div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="success" size="sm">M3×1 来自张三</Badge>
                      <Badge variant="success" size="sm">T4×2 来自李四</Badge>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-xs text-gray-600 mb-1">切割信息</div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="primary" size="sm">C20241215-001</Badge>
                      <Badge variant="info" size="sm">有余料</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-600 mb-1">库存变更历史</div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>12-15 09:35 - 选择材料：张三的M3板材</div>
                      <div>12-15 10:00 - 开始切割：切割号C20241215-001</div>
                      <div>12-15 15:20 - 切割完成：产生余料0.3张</div>
                    </div>
                  </div>
                </Card>
              </Card>
            </div>
          </div>
        )}

        {integrationTab === 'implementation' && (
          <div>
            <h4 className="font-medium mb-3">渐进式实施策略</h4>
            
            <div className="space-y-4">
              {/* 实施阶段 */}
              <Alert variant="info" title="第一阶段：保持现有功能完整">
                <ul className="space-y-1 text-sm">
                  <li>✅ 所有现有功能正常工作</li>
                  <li>✅ 不修改现有数据库表结构</li>
                  <li>✅ 用户操作习惯完全保持</li>
                </ul>
              </Alert>

              <Alert variant="warning" title="第二阶段：并行运行新功能">
                <ul className="space-y-1 text-sm">
                  <li>🔄 在侧边栏增加"库存管理"菜单项</li>
                  <li>🔄 创建独立的库存管理页面</li>
                  <li>🔄 与现有系统并行运行</li>
                </ul>
              </Alert>

              <Alert variant="success" title="第三阶段：无缝功能融合">
                <ul className="space-y-1 text-sm">
                  <li>🔄 MaterialsTable 增加"用料"和"切割号"列</li>
                  <li>🔄 ProjectDetail 增加库存信息区域</li>
                  <li>🔄 状态变更触发库存更新</li>
                </ul>
              </Alert>

              <Alert variant="primary" title="第四阶段：完整业务流程">
                <ul className="space-y-1 text-sm">
                  <li>🚀 切割管理与项目状态联动</li>
                  <li>🚀 完整的借用管理流程</li>
                  <li>🚀 余料自动管理</li>
                </ul>
              </Alert>
            </div>

            {/* 技术架构保证 */}
            <div className="mt-6">
              <h5 className="font-medium mb-3">技术架构保证</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 p-3">
                  <div className="text-sm font-medium mb-2">数据层兼容</div>
                  <ul className="text-xs space-y-1">
                    <li>• 保持现有表结构</li>
                    <li>• 新增库存相关表</li>
                    <li>• 数据完整性保证</li>
                  </ul>
                </Card>
                
                <Card className="bg-green-50 p-3">
                  <div className="text-sm font-medium mb-2">组件层扩展</div>
                  <ul className="text-xs space-y-1">
                    <li>• 保持现有组件结构</li>
                    <li>• 通过 props 扩展功能</li>
                    <li>• 渐进式功能集成</li>
                  </ul>
                </Card>
                
                <Card className="bg-purple-50 p-3">
                  <div className="text-sm font-medium mb-2">状态管理同步</div>
                  <ul className="text-xs space-y-1">
                    <li>• 保持现有 Zustand store</li>
                    <li>• 新增库存专用 store</li>
                    <li>• 实时状态更新</li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      <Alert variant="warning" className="mt-6" title="讨论点">
        <div className="flex items-start mb-2">
          <InformationCircleIcon className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
          <span className="font-medium">需要讨论的要点</span>
        </div>
        <ul className="space-y-1">
          <li>1. 渐进式实施的阶段划分是否合理？</li>
          <li>2. 现有功能保持策略是否满足需求？</li>
          <li>3. 简化编码的使用范围是否合适？</li>
          <li>4. 还需要哪些兼容性保证措施？</li>
        </ul>
      </Alert>
    </div>
  )
}