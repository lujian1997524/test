'use client'

import React, { useState } from 'react'
import { Button, Card, Input, StatusIndicator, StatusToggle, Switch, Badge, Alert, Avatar, Skeleton, SkeletonCard, SkeletonList, ProgressBar, ProgressWithSteps, Modal, ConfirmModal, Dropdown, TabBar, Tabs, Slider, RangeSlider, Toast, ToastContainer, useToast, Tooltip, Popover, DatePicker, SearchBar, Empty, EmptyData, EmptySearch, Loading, LoadingSpinner, LoadingDots, LoadingOverlay, Stepper, Breadcrumb, Tree, Rating, Timeline, Pagination } from '../../components/ui'
import { SearchBox } from '../../components/ui/SearchBox'
import type { SearchType, SearchResult } from '../../components/ui/SearchBox'
import { MainLayout } from '../../components/layout'
import type { StatusType, DropdownOption, TabItem, SearchSuggestion, StepperStep, BreadcrumbItem, TreeNode, TimelineItem } from '../../components/ui'

export default function DesignSystemPage() {
  const [inputValue, setInputValue] = useState('')
  const [statusDemo, setStatusDemo] = useState<StatusType>('pending')
  const [loading, setLoading] = useState(false)
  const [switchDemo, setSwitchDemo] = useState(false)
  const [alertVisible, setAlertVisible] = useState(true)
  const [progressValue, setProgressValue] = useState(65)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [dropdownValue, setDropdownValue] = useState<string | number>('')
  const [activeTab, setActiveTab] = useState('tab1')
  const [sliderValue, setSliderValue] = useState(50)
  const [rangeValue, setRangeValue] = useState<[number, number]>([20, 80])
  const { toasts, addToast, removeToast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [showLoading, setShowLoading] = useState(false)

  // 新组件状态
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTreeKeys, setSelectedTreeKeys] = useState<string[]>([])
  const [ratingValue, setRatingValue] = useState(0)
  const [paginationCurrent, setPaginationCurrent] = useState(1)

  // 搜索框组件状态
  const [searchBoxType, setSearchBoxType] = useState<SearchType>('all')
  const [searchBoxResults, setSearchBoxResults] = useState<SearchResult[]>([])
  const [searchBoxLoading, setSearchBoxLoading] = useState(false)

  // 搜索建议数据
  const searchSuggestions: SearchSuggestion[] = [
    { id: '1', label: '用户管理', value: 'user management', category: '功能', icon: '👥' },
    { id: '2', label: '系统设置', value: 'system settings', category: '配置', icon: '⚙️' },
    { id: '3', label: '数据报表', value: 'data reports', category: '报表', icon: '📊' },
    { id: '4', label: '权限控制', value: 'permission control', category: '安全', icon: '🔒' }
  ]

  // 搜索框模拟数据
  const mockSearchResults: SearchResult[] = [
    {
      id: '1',
      type: 'projects',
      title: '激光切割项目A',
      subtitle: '进行中',
      description: '负责人：张三 | 预计完成：2024-02-15'
    },
    {
      id: '2',
      type: 'workers',
      title: '张三',
      subtitle: '高级工程师',
      description: '电话：138****1234 | 部门：生产部'
    },
    {
      id: '3',
      type: 'drawings',
      title: '设计图纸_V2.3.dwg',
      subtitle: 'CAD图纸',
      description: '更新时间：2024-01-20 | 大小：2.5MB'
    },
    {
      id: '4',
      type: 'materials',
      title: '3mm碳钢板',
      subtitle: '板材规格',
      description: '材质：碳钢 | 厚度：3mm | 状态：可用'
    }
  ]

  // 处理搜索框搜索
  const handleSearchBoxSearch = (query: string, type: SearchType) => {
    setSearchBoxLoading(true)
    
    // 模拟搜索延迟
    setTimeout(() => {
      const filtered = mockSearchResults.filter(result => {
        const matchesType = type === 'all' || result.type === type
        const matchesQuery = result.title.toLowerCase().includes(query.toLowerCase()) ||
                           result.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
                           result.description?.toLowerCase().includes(query.toLowerCase())
        return matchesType && matchesQuery
      })
      
      setSearchBoxResults(filtered)
      setSearchBoxLoading(false)
    }, 500)
  }

  // 处理搜索结果选择
  const handleSearchResultSelect = (result: SearchResult) => {
    console.log('选择搜索结果:', result)
    addToast({ 
      message: `选择了：${result.title}`, 
      type: 'info' 
    })
  }

  // Stepper 数据
  const stepperSteps: StepperStep[] = [
    { id: '1', title: '基础信息', description: '填写基本信息', completed: currentStep > 1 },
    { id: '2', title: '详细配置', description: '进行详细配置', completed: currentStep > 2, current: currentStep === 2 },
    { id: '3', title: '审核确认', description: '等待审核确认', completed: currentStep > 3, current: currentStep === 3 },
    { id: '4', title: '完成', description: '流程已完成', completed: currentStep > 4, current: currentStep === 4 }
  ]

  // Breadcrumb 数据
  const breadcrumbItems: BreadcrumbItem[] = [
    { id: '1', label: '首页', icon: '🏠' },
    { id: '2', label: '产品管理', icon: '📦' },
    { id: '3', label: '商品列表', icon: '📝' },
    { id: '4', label: '编辑商品' }
  ]

  // Tree 数据
  const treeData: TreeNode[] = [
    {
      id: '1',
      label: '根目录',
      icon: '📁',
      selectable: true,
      children: [
        {
          id: '1-1',
          label: '文档',
          icon: '📄',
          selectable: true,
          children: [
            { id: '1-1-1', label: '用户手册.pdf', icon: '📑', selectable: true },
            { id: '1-1-2', label: '开发指南.md', icon: '📋', selectable: true }
          ]
        },
        {
          id: '1-2',
          label: '图片',
          icon: '🖼️',
          selectable: true,
          children: [
            { id: '1-2-1', label: 'logo.png', icon: '🖼️', selectable: true },
            { id: '1-2-2', label: 'banner.jpg', icon: '🖼️', selectable: true }
          ]
        }
      ]
    },
    {
      id: '2',
      label: '项目文件',
      icon: '📁',
      selectable: true,
      children: [
        { id: '2-1', label: 'package.json', icon: '📦', selectable: true },
        { id: '2-2', label: 'README.md', icon: '📖', selectable: true }
      ]
    }
  ]

  // Timeline 数据
  const timelineItems: TimelineItem[] = [
    {
      id: '1',
      title: '项目启动',
      description: '项目正式启动，团队成员到位',
      timestamp: new Date('2024-01-15T09:00:00'),
      status: 'success'
    },
    {
      id: '2',
      title: '需求分析完成',
      description: '完成了详细的需求分析和技术方案设计',
      timestamp: new Date('2024-01-20T14:30:00'),
      status: 'success'
    },
    {
      id: '3',
      title: '开发阶段',
      description: '进入核心功能开发阶段，预计2周完成',
      timestamp: new Date('2024-01-25T10:00:00'),
      status: 'info',
      content: (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-700">开发进度: 60%</p>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{width: '60%'}}></div>
          </div>
        </div>
      )
    },
    {
      id: '4',
      title: '测试阶段',
      description: '即将进入测试阶段',
      timestamp: new Date('2024-02-01T09:00:00'),
      status: 'pending'
    }
  ]

  const handleLoadingDemo = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  // 下拉选择选项
  const dropdownOptions: DropdownOption[] = [
    { label: '选项1', value: 'option1', icon: '🎯' },
    { label: '选项2', value: 'option2', icon: '⭐' },
    { label: '选项3', value: 'option3', icon: '🚀', description: '这是一个描述' },
    { label: '禁用选项', value: 'disabled', disabled: true }
  ]

  // 标签页数据
  const tabItems: TabItem[] = [
    { id: 'tab1', label: '首页', icon: '🏠', content: <div className="p-4 text-center">首页内容</div> },
    { id: 'tab2', label: '设置', icon: '⚙️', badge: 3, content: <div className="p-4 text-center">设置内容</div> },
    { id: 'tab3', label: '帮助', icon: '❓', content: <div className="p-4 text-center">帮助内容</div> }
  ]

  // 快捷导航项目
  const quickNavItems = [
    { id: 'colors', label: '颜色系统', icon: '🎨' },
    { id: 'buttons', label: '按钮', icon: '🔘' },
    { id: 'inputs', label: '输入框', icon: '📝' },
    { id: 'status', label: '状态指示器', icon: '🚦' },
    { id: 'cards', label: '卡片', icon: '🃏' },
    { id: 'typography', label: '字体系统', icon: '🔤' },
    { id: 'switches', label: '开关', icon: '🎛️' },
    { id: 'badges', label: '徽章', icon: '🏷️' },
    { id: 'alerts', label: '警告框', icon: '⚠️' },
    { id: 'avatars', label: '头像', icon: '👤' },
    { id: 'progress', label: '进度条', icon: '📊' },
    { id: 'skeleton', label: '骨架屏', icon: '💀' },
    { id: 'toast', label: '消息提示', icon: '🍞' },
    { id: 'modal', label: '模态框', icon: '🪟' },
    { id: 'dropdown', label: '下拉选择', icon: '📋' },
    { id: 'tabs', label: '标签页', icon: '📑' },
    { id: 'slider', label: '滑块', icon: '🎚️' },
    { id: 'tooltip', label: '工具提示', icon: '💬' },
    { id: 'popover', label: '弹出框', icon: '💭' },
    { id: 'datepicker', label: '日期选择', icon: '📅' },
    { id: 'searchbar', label: '搜索框', icon: '🔍' },
    { id: 'searchbox', label: '全局搜索框', icon: '🔎' },
    { id: 'empty', label: '空状态', icon: '📭' },
    { id: 'loading', label: '加载动画', icon: '⏳' },
    { id: 'stepper', label: '步骤条', icon: '👣' },
    { id: 'breadcrumb', label: '面包屑导航', icon: '🍞' },
    { id: 'tree', label: '树形组件', icon: '🌳' },
    { id: 'rating', label: '评分组件', icon: '⭐' },
    { id: 'timeline', label: '时间轴', icon: '⏰' },
    { id: 'pagination', label: '分页组件', icon: '📄' }
  ]

  // 快捷导航滚动函数
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      })
    }
  }

  // 为了兼容原有的侧边栏结构，保留原来的格式但简化
  const sidebarItems = quickNavItems.map(item => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    onClick: () => scrollToSection(item.id)
  }))

  return (
    <MainLayout
      headerTitle="设计系统展示"
      headerSubtitle="iOS 18 & macOS 15 风格组件库"
      sidebarItems={sidebarItems}
      headerActions={
        <Button variant="secondary" size="sm">
          查看源码
        </Button>
      }
    >
      <div className="space-y-8">
        {/* 颜色系统 */}
        <div id="colors">
          <Card>
            <h2 className="text-xl font-bold text-text-primary mb-4">iOS 18 颜色系统</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { name: '蓝色', class: 'bg-ios18-blue', hex: '#0A84FF' },
                { name: '靛蓝', class: 'bg-ios18-indigo', hex: '#5E5CE6' },
                { name: '紫色', class: 'bg-ios18-purple', hex: '#AF52DE' },
                { name: '青色', class: 'bg-ios18-teal', hex: '#30D158' },
                { name: '薄荷', class: 'bg-ios18-mint', hex: '#00C7BE' },
                { name: '棕色', class: 'bg-ios18-brown', hex: '#AC8E68' }
              ].map(color => (
                <div key={color.name} className="text-center">
                  <div className={`w-full h-16 ${color.class} rounded-ios-lg mb-2`}></div>
                  <p className="text-sm font-medium text-text-primary">{color.name}</p>
                  <p className="text-xs text-text-secondary">{color.hex}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 按钮组件 */}
        <div id="buttons">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">按钮组件</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">主要按钮</Button>
              <Button variant="secondary">次要按钮</Button>
              <Button variant="danger">危险按钮</Button>
              <Button variant="ghost">幽灵按钮</Button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button size="sm">小按钮</Button>
              <Button size="md">中等按钮</Button>
              <Button size="lg">大按钮</Button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button disabled>禁用按钮</Button>
              <Button loading={loading} onClick={handleLoadingDemo}>
                {loading ? '加载中...' : '点击加载'}
              </Button>
            </div>
          </div>
          </Card>
        </div>

        {/* 输入框组件 */}
        <div id="inputs">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">输入框组件</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="默认样式"
                placeholder="请输入内容"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              
              <Input
                label="填充样式"
                variant="filled"
                placeholder="请输入内容"
                hint="这是一个提示信息"
              />
              
              <Input
                label="玻璃样式"
                variant="glass"
                placeholder="请输入内容"
              />
            </div>
            
            <div className="space-y-4">
              <Input
                label="带左图标"
                placeholder="搜索..."
                leftIcon={<span>🔍</span>}
              />
              
              <Input
                label="带右图标"
                placeholder="输入密码"
                type="password"
                rightIcon={<span>👁</span>}
              />
              
              <Input
                label="错误状态"
                placeholder="请输入内容"
                error="这是一个错误信息"
              />
            </div>
          </div>
          </Card>
        </div>

        {/* 状态指示器组件 */}
        <div id="status">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">状态指示器</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">基础状态</h3>
              <div className="flex items-center space-x-6">
                <StatusIndicator status="pending" showLabel />
                <StatusIndicator status="in_progress" showLabel />
                <StatusIndicator status="completed" showLabel />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">不同尺寸</h3>
              <div className="flex items-center space-x-4">
                <StatusIndicator status="completed" size="sm" />
                <StatusIndicator status="completed" size="md" />
                <StatusIndicator status="completed" size="lg" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">交互式状态切换</h3>
              <div className="flex items-center space-x-4">
                <StatusToggle
                  status={statusDemo}
                  onChange={setStatusDemo}
                />
                <span className="text-text-secondary">
                  当前状态: {statusDemo} (点击切换)
                </span>
              </div>
            </div>
          </div>
          </Card>
        </div>

        {/* 卡片组件 */}
        <div id="cards">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">卡片组件</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card padding="md" glass={true}>
              <h3 className="font-semibold text-text-primary mb-2">毛玻璃卡片</h3>
              <p className="text-text-secondary text-sm">
                这是一个带有毛玻璃效果的卡片组件
              </p>
            </Card>
            
            <Card padding="md" glass={false}>
              <h3 className="font-semibold text-text-primary mb-2">普通卡片</h3>
              <p className="text-text-secondary text-sm">
                这是一个普通的白色背景卡片
              </p>
            </Card>
            
            <Card padding="md" hoverable={true}>
              <h3 className="font-semibold text-text-primary mb-2">可悬停卡片</h3>
              <p className="text-text-secondary text-sm">
                鼠标悬停时会有动画效果
              </p>
            </Card>
          </div>
          </Card>
        </div>

        {/* Typography */}
        <div id="typography">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">字体系统</h2>
          <div className="space-y-4">
            <div className="text-4xl font-bold text-text-primary">大标题 (34px)</div>
            <div className="text-3xl font-bold text-text-primary">标题1 (28px)</div>
            <div className="text-2xl font-bold text-text-primary">标题2 (22px)</div>
            <div className="text-xl font-bold text-text-primary">标题3 (20px)</div>
            <div className="text-lg text-text-primary">标题文字 (17px)</div>
            <div className="text-base text-text-primary">正文文字 (17px)</div>
            <div className="text-sm text-text-secondary">次要文字 (15px)</div>
            <div className="text-xs text-text-tertiary">辅助文字 (13px)</div>
          </div>
          </Card>
        </div>

        {/* Switch组件 */}
        <div id="switches">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">开关组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">基础开关</h3>
              <div className="flex items-center space-x-6">
                <Switch />
                <Switch checked />
                <Switch disabled />
                <Switch checked disabled />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">不同尺寸</h3>
              <div className="flex items-center space-x-4">
                <Switch size="sm" />
                <Switch size="md" checked />
                <Switch size="lg" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">带标签的开关</h3>
              <div className="space-y-3">
                <Switch 
                  label="接收通知" 
                  checked={switchDemo} 
                  onChange={setSwitchDemo} 
                />
                <Switch label="深色模式" />
                <Switch label="自动保存" checked />
              </div>
            </div>
          </div>
          </Card>
        </div>

        {/* Badge组件 */}
        <div id="badges">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">徽章组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">基础徽章</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Badge>默认</Badge>
                <Badge variant="primary">主要</Badge>
                <Badge variant="secondary">次要</Badge>
                <Badge variant="success">成功</Badge>
                <Badge variant="warning">警告</Badge>
                <Badge variant="danger">危险</Badge>
                <Badge variant="info">信息</Badge>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">不同尺寸</h3>
              <div className="flex items-center space-x-3">
                <Badge size="sm">小</Badge>
                <Badge size="md">中</Badge>
                <Badge size="lg">大</Badge>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">数字徽章</h3>
              <div className="flex items-center space-x-6">
                <Badge count={5}>
                  <Button>消息</Button>
                </Badge>
                <Badge count={99}>
                  <Button>通知</Button>
                </Badge>
                <Badge count={999} maxCount={99}>
                  <Button>邮件</Button>
                </Badge>
                <Badge dot variant="success">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                </Badge>
              </div>
            </div>
          </div>
          </Card>
        </div>

        {/* Alert组件 */}
        <div id="alerts">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">警告框组件</h2>
          <div className="space-y-4">
            {alertVisible && (
              <Alert 
                title="可关闭的警告" 
                variant="info" 
                closable 
                onClose={() => setAlertVisible(false)}
              >
                这是一个可以关闭的信息提示框。
              </Alert>
            )}
            
            <Alert variant="success" title="操作成功">
              您的操作已经成功完成，数据已保存到服务器。
            </Alert>
            
            <Alert variant="warning" title="注意">
              请注意，此操作将影响所有相关的数据记录。
            </Alert>
            
            <Alert variant="danger" title="错误">
              操作失败，请检查您的网络连接后重试。
            </Alert>
            
            <Alert variant="info">
              这是一个没有标题的简单提示信息。
            </Alert>
          </div>
          </Card>
        </div>

        {/* Avatar组件 */}
        <div id="avatars">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">头像组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">不同尺寸</h3>
              <div className="flex items-center space-x-4">
                <Avatar size="xs" name="张三" />
                <Avatar size="sm" name="李四" />
                <Avatar size="md" name="王五" />
                <Avatar size="lg" name="赵六" />
                <Avatar size="xl" name="孙七" />
                <Avatar size="2xl" name="周八" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">不同形状</h3>
              <div className="flex items-center space-x-4">
                <Avatar name="圆形" shape="circle" />
                <Avatar name="方形" shape="square" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">状态指示</h3>
              <div className="flex items-center space-x-4">
                <Avatar name="在线" status="online" />
                <Avatar name="离开" status="away" />
                <Avatar name="忙碌" status="busy" />
                <Avatar name="离线" status="offline" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">带徽章</h3>
              <div className="flex items-center space-x-4">
                <Avatar 
                  name="用户" 
                  badge={<Badge count={5} size="sm" />} 
                />
                <Avatar 
                  name="管理" 
                  badge={<Badge dot variant="success" />} 
                />
              </div>
            </div>
          </div>
          </Card>
        </div>

        {/* Progress组件 */}
        <div id="progress">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">进度条组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">线性进度条</h3>
              <div className="space-y-4">
                <ProgressBar value={progressValue} showLabel />
                <ProgressBar value={30} color="success" showLabel label="成功进度" />
                <ProgressBar value={70} color="warning" showLabel striped />
                <ProgressBar value={85} color="danger" showLabel animated />
              </div>
              <div className="mt-4">
                <Button 
                  size="sm" 
                  onClick={() => setProgressValue(Math.random() * 100)}
                >
                  随机进度
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">环形进度条</h3>
              <div className="flex items-center space-x-6">
                <ProgressBar variant="circular" value={75} size="sm" showLabel />
                <ProgressBar variant="circular" value={60} size="md" showLabel color="success" />
                <ProgressBar variant="circular" value={40} size="lg" showLabel color="warning" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">步骤进度</h3>
              <ProgressWithSteps
                steps={[
                  { label: '准备', completed: true },
                  { label: '执行', completed: true },
                  { label: '验证', completed: false },
                  { label: '完成', completed: false }
                ]}
                currentStep={1}
              />
            </div>
          </div>
          </Card>
        </div>

        {/* Skeleton组件 */}
        <div id="skeleton">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">骨架屏组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">基础骨架屏</h3>
              <div className="space-y-3">
                <Skeleton height="20px" />
                <Skeleton height="16px" width="80%" />
                <Skeleton height="16px" width="60%" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">不同形状</h3>
              <div className="flex items-center space-x-4">
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="rectangular" width={100} height={60} />
                <Skeleton variant="rounded" width={120} height={80} />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">多行文本</h3>
              <Skeleton lines={3} />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">头像骨架屏</h3>
              <Skeleton avatar />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">卡片骨架屏</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">列表骨架屏</h3>
              <SkeletonList items={3} />
            </div>
          </div>
          </Card>
        </div>

        {/* Toast组件 */}
        <div id="toast">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">消息提示组件</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => addToast({ message: '操作成功！', type: 'success' })}>
                成功消息
              </Button>
              <Button onClick={() => addToast({ message: '发生错误！', type: 'error' })}>
                错误消息
              </Button>
              <Button onClick={() => addToast({ message: '请注意！', type: 'warning' })}>
                警告消息
              </Button>
              <Button onClick={() => addToast({ message: '提示信息', type: 'info' })}>
                信息消息
              </Button>
            </div>
            <p className="text-sm text-gray-600">点击按钮查看不同类型的消息提示</p>
          </div>
          </Card>
        </div>

        {/* Modal组件 */}
        <div id="modal">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">模态框组件</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setModalOpen(true)}>
                打开模态框
              </Button>
              <Button onClick={() => setConfirmModalOpen(true)} variant="danger">
                确认对话框
              </Button>
            </div>
            
            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="示例模态框"
              footer={
                <>
                  <Button variant="secondary" onClick={() => setModalOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={() => setModalOpen(false)}>
                    确认
                  </Button>
                </>
              }
            >
              <p className="text-gray-700">
                这是一个示例模态框，展示了基本的模态框功能。支持标题、内容区域和底部操作按钮。
              </p>
            </Modal>
            
            <ConfirmModal
              isOpen={confirmModalOpen}
              onClose={() => setConfirmModalOpen(false)}
              onConfirm={() => console.log('确认操作')}
              title="确认操作"
              message="您确定要执行此操作吗？此操作不可撤销。"
              type="warning"
            />
          </div>
          </Card>
        </div>

        {/* Dropdown组件 */}
        <div id="dropdown">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">下拉选择组件</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">基础下拉</label>
                <Dropdown
                  options={dropdownOptions}
                  value={dropdownValue}
                  onChange={(value) => {
                    if (typeof value === 'string' || typeof value === 'number') {
                      setDropdownValue(value)
                    }
                  }}
                  placeholder="请选择选项"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">可搜索</label>
                <Dropdown
                  options={dropdownOptions}
                  searchable
                  placeholder="搜索并选择"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">多选模式</label>
                <Dropdown
                  options={dropdownOptions}
                  multiple
                  placeholder="多选选项"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">可清空</label>
                <Dropdown
                  options={dropdownOptions}
                  clearable
                  placeholder="可清空选项"
                />
              </div>
            </div>
          </div>
          </Card>
        </div>

        {/* TabBar组件 */}
        <div id="tabs">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">标签页组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">默认样式</h3>
              <Tabs
                tabs={tabItems}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">药丸样式</h3>
              <TabBar
                tabs={tabItems}
                activeTab={activeTab}
                onChange={setActiveTab}
                variant="pills"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">卡片样式</h3>
              <TabBar
                tabs={tabItems}
                activeTab={activeTab}
                onChange={setActiveTab}
                variant="cards"
              />
            </div>
          </div>
          </Card>
        </div>

        {/* Slider组件 */}
        <div id="slider">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">滑块组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">基础滑块</h3>
              <div className="space-y-4">
                <Slider
                  value={sliderValue}
                  onChange={setSliderValue}
                  showValue
                />
                <div className="grid grid-cols-2 gap-4">
                  <Slider
                    value={30}
                    color="success"
                    showValue
                    size="sm"
                  />
                  <Slider
                    value={70}
                    color="warning"
                    showValue
                    size="lg"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">带标记的滑块</h3>
              <Slider
                value={50}
                showTicks
                marks={{
                  0: '0%',
                  25: '25%',
                  50: '50%',
                  75: '75%',
                  100: '100%'
                }}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">范围滑块</h3>
              <RangeSlider
                value={rangeValue}
                onChange={setRangeValue}
                showValue
              />
            </div>
          </div>
          </Card>
        </div>

        {/* Tooltip组件 */}
        <div id="tooltip">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">工具提示组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">基础提示</h3>
              <div className="flex flex-wrap gap-4">
                <Tooltip content="这是一个顶部提示" placement="top">
                  <Button>顶部提示</Button>
                </Tooltip>
                <Tooltip content="这是一个底部提示" placement="bottom">
                  <Button>底部提示</Button>
                </Tooltip>
                <Tooltip content="这是一个左侧提示" placement="left">
                  <Button>左侧提示</Button>
                </Tooltip>
                <Tooltip content="这是一个右侧提示" placement="right">
                  <Button>右侧提示</Button>
                </Tooltip>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">触发方式</h3>
              <div className="flex flex-wrap gap-4">
                <Tooltip content="鼠标悬停触发" trigger="hover">
                  <Button variant="secondary">悬停触发</Button>
                </Tooltip>
                <Tooltip content="点击触发" trigger="click">
                  <Button variant="secondary">点击触发</Button>
                </Tooltip>
                <Tooltip content="焦点触发" trigger="focus">
                  <Button variant="secondary">焦点触发</Button>
                </Tooltip>
              </div>
            </div>
          </div>
          </Card>
        </div>

        {/* Popover组件 */}
        <div id="popover">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">弹出框组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">基础弹出框</h3>
              <div className="flex flex-wrap gap-4">
                <Popover
                  title="用户信息"
                  content={
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Avatar name="张三" size="md" />
                        <div>
                          <div className="font-medium">张三</div>
                          <div className="text-sm text-gray-500">产品经理</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        这是一个用户信息弹出框，展示了用户的基本信息和操作选项。
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm">查看详情</Button>
                        <Button size="sm" variant="secondary">发送消息</Button>
                      </div>
                    </div>
                  }
                  width={280}
                >
                  <Button>用户信息</Button>
                </Popover>
                
                <Popover
                  content={
                    <div className="text-center py-2">
                      <p className="text-gray-600 mb-3">确定要删除此项目吗？</p>
                      <div className="flex space-x-2 justify-center">
                        <Button size="sm" variant="danger">删除</Button>
                        <Button size="sm" variant="secondary">取消</Button>
                      </div>
                    </div>
                  }
                  trigger="click"
                  placement="top"
                >
                  <Button variant="danger">删除操作</Button>
                </Popover>
                
                <Popover
                  content={
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <span>📝</span>
                        <span>编辑</span>
                      </div>
                      <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <span>📋</span>
                        <span>复制</span>
                      </div>
                      <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <span>🗑️</span>
                        <span>删除</span>
                      </div>
                    </div>
                  }
                  trigger="click"
                  arrow={false}
                >
                  <Button variant="secondary">操作菜单</Button>
                </Popover>
              </div>
            </div>
          </div>
          </Card>
        </div>

        {/* DatePicker组件 */}
        <div id="datepicker">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">日期选择器组件</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">基础日期选择</label>
                <DatePicker
                  value={selectedDate || undefined}
                  onChange={setSelectedDate}
                  placeholder="选择日期"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">带限制的日期选择</label>
                <DatePicker
                  minDate={new Date()}
                  maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                  placeholder="选择未来30天内的日期"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">禁用特定日期</label>
                <DatePicker
                  disabledDates={(date) => date.getDay() === 0 || date.getDay() === 6}
                  placeholder="禁用周末"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">不同尺寸</label>
                <div className="space-y-2">
                  <DatePicker size="sm" placeholder="小尺寸" />
                  <DatePicker size="lg" placeholder="大尺寸" />
                </div>
              </div>
            </div>
          </div>
          </Card>
        </div>

        {/* SearchBar组件 */}
        <div id="searchbar">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">搜索框组件</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">基础搜索</label>
                <SearchBar
                  value={searchValue}
                  onChange={setSearchValue}
                  placeholder="搜索功能、用户、设置..."
                  onSearch={(value) => console.log('搜索:', value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">带建议的搜索</label>
                <SearchBar
                  suggestions={searchSuggestions}
                  placeholder="输入关键词查看建议"
                  onSuggestionSelect={(suggestion) => console.log('选择建议:', suggestion)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">带历史记录</label>
                <SearchBar
                  recentSearches={['用户管理', '系统配置', '数据导出']}
                  showHistory
                  placeholder="查看搜索历史"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">不同尺寸</label>
                <div className="space-y-2">
                  <SearchBar size="sm" placeholder="小尺寸搜索" />
                  <SearchBar size="lg" placeholder="大尺寸搜索" />
                </div>
              </div>
            </div>
          </div>
          </Card>
        </div>

        {/* 新版SearchBox组件 - 全局搜索框 */}
        <div id="searchbox">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">全局搜索框组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">基础样式</h3>
              <div className="space-y-4">
                <SearchBox
                  placeholder="搜索项目、工人、图纸..."
                  searchType={searchBoxType}
                  onSearchTypeChange={setSearchBoxType}
                  onSearch={handleSearchBoxSearch}
                  onResultSelect={handleSearchResultSelect}
                  results={searchBoxResults}
                  loading={searchBoxLoading}
                />
                
                <div className="text-sm text-gray-600">
                  <p>• 支持类型选择：全部内容、活跃项目、工人、图纸、板材规格</p>
                  <p>• 实时搜索：输入2个字符后开始搜索</p>
                  <p>• 键盘导航：支持上下箭头选择，Enter确认，Escape关闭</p>
                  <p>• 点击外部区域自动关闭下拉菜单</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">不同宽度展示</h3>
              <div className="space-y-4">
                <div className="max-w-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">小宽度 (max-w-sm)</label>
                  <SearchBox
                    placeholder="搜索..."
                    className="w-full"
                  />
                </div>
                
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">中等宽度 (max-w-md)</label>
                  <SearchBox
                    placeholder="搜索项目、工人、图纸..."
                    className="w-full"
                  />
                </div>
                
                <div className="max-w-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">大宽度 (max-w-lg)</label>
                  <SearchBox
                    placeholder="搜索项目、工人、图纸、板材规格..."
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">功能特性演示</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">🔍 搜索功能</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• 输入"项目"搜索项目</li>
                      <li>• 输入"张三"搜索工人</li>
                      <li>• 输入"图纸"搜索图纸</li>
                      <li>• 输入"3mm"搜索板材</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">⌨️ 键盘操作</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• ↑↓ 选择结果</li>
                      <li>• Enter 确认选择</li>
                      <li>• Escape 关闭面板</li>
                      <li>• Tab 切换焦点</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </Card>
        </div>

        {/* Empty组件 */}
        <div id="empty">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">空状态组件</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-ios-lg p-4">
                <EmptyData
                  description="暂时没有数据，请稍后再试"
                  action={<Button size="sm">刷新数据</Button>}
                />
              </div>
              
              <div className="border border-gray-200 rounded-ios-lg p-4">
                <EmptySearch
                  action={<Button size="sm" variant="secondary">清除筛选</Button>}
                />
              </div>
              
              <div className="border border-gray-200 rounded-ios-lg p-4">
                <Empty
                  image="noFiles"
                  title="暂无文件"
                  description="点击下方按钮上传您的第一个文件"
                  action={<Button size="sm">上传文件</Button>}
                  size="sm"
                />
              </div>
              
              <div className="border border-gray-200 rounded-ios-lg p-4">
                <Empty
                  image="network"
                  title="连接失败"
                  description="网络连接异常，请检查网络设置"
                  action={<Button size="sm">重试连接</Button>}
                  size="sm"
                />
              </div>
            </div>
          </div>
          </Card>
        </div>

        {/* Loading组件 */}
        <div id="loading">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">加载动画组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">不同类型</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border border-gray-200 rounded-ios-lg">
                  <LoadingSpinner size="lg" />
                  <p className="text-sm text-gray-500 mt-2">旋转加载</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-ios-lg">
                  <LoadingDots size="lg" />
                  <p className="text-sm text-gray-500 mt-2">点状加载</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-ios-lg">
                  <Loading type="pulse" size="lg" />
                  <p className="text-sm text-gray-500 mt-2">脉冲加载</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-ios-lg">
                  <Loading type="bars" size="lg" />
                  <p className="text-sm text-gray-500 mt-2">条状加载</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-ios-lg">
                  <Loading type="ring" size="lg" />
                  <p className="text-sm text-gray-500 mt-2">环形加载</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-ios-lg">
                  <Loading type="wave" size="lg" />
                  <p className="text-sm text-gray-500 mt-2">波浪加载</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">带文字的加载</h3>
              <div className="flex justify-center p-6 border border-gray-200 rounded-ios-lg">
                <Loading type="spinner" size="md" text="正在加载数据..." />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">全屏加载</h3>
              <div className="flex space-x-4">
                <Button 
                  onClick={() => setShowLoading(true)}
                  disabled={showLoading}
                >
                  显示全屏加载
                </Button>
                {showLoading && (
                  <Button 
                    variant="secondary"
                    onClick={() => setShowLoading(false)}
                  >
                    关闭加载
                  </Button>
                )}
              </div>
            </div>
          </div>
          </Card>
        </div>

        {/* Stepper组件 */}
        <div id="stepper">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">步骤条组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">水平步骤条</h3>
              <Stepper
                steps={stepperSteps}
                orientation="horizontal"
                clickeable
                onStepClick={(_, index) => setCurrentStep(index + 1)}
              />
              <div className="mt-4 flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep <= 1}
                >
                  上一步
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                  disabled={currentStep >= 4}
                >
                  下一步
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">垂直步骤条</h3>
              <div className="max-w-md">
                <Stepper
                  steps={stepperSteps.slice(0, 3)}
                  orientation="vertical"
                  size="sm"
                />
              </div>
            </div>
          </div>
          </Card>
        </div>

        {/* Breadcrumb组件 */}
        <div id="breadcrumb">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">面包屑导航组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">基础导航</h3>
              <Breadcrumb
                items={breadcrumbItems}
                onClick={(item, index) => console.log('点击面包屑:', item, index)}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">不同分隔符</h3>
              <div className="space-y-3">
                <Breadcrumb
                  items={breadcrumbItems.slice(0, 3)}
                  separator=">"
                />
                <Breadcrumb
                  items={breadcrumbItems.slice(0, 3)}
                  separator="•"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">最大显示项数</h3>
              <Breadcrumb
                items={[
                  ...breadcrumbItems,
                  { id: '5', label: '详细信息' },
                  { id: '6', label: '编辑页面' }
                ]}
                maxItems={4}
              />
            </div>
          </div>
          </Card>
        </div>

        {/* Tree组件 */}
        <div id="tree">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">树形组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">基础树形</h3>
              <div className="max-w-md border border-gray-200 rounded-ios-lg p-4">
                <Tree
                  data={treeData}
                  selectable
                  onSelect={(keys, node) => {
                    setSelectedTreeKeys(keys)
                    console.log('选择节点:', node)
                  }}
                />
              </div>
              {selectedTreeKeys.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  已选择: {selectedTreeKeys.join(', ')}
                </p>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">可勾选树形</h3>
              <div className="max-w-md border border-gray-200 rounded-ios-lg p-4">
                <Tree
                  data={treeData.slice(0, 1)}
                  checkable
                  showLine
                  size="sm"
                  onCheck={(keys, node) => console.log('勾选节点:', keys, node)}
                />
              </div>
            </div>
          </div>
          </Card>
        </div>

        {/* Rating组件 */}
        <div id="rating">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">评分组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">基础评分</h3>
              <div className="space-y-4">
                <Rating
                  value={ratingValue}
                  onChange={setRatingValue}
                  allowHalf
                />
                <Rating
                  value={4.5}
                  readonly
                  allowHalf
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">不同尺寸</h3>
              <div className="flex items-center space-x-6">
                <Rating size="sm" value={3} readonly />
                <Rating size="md" value={4} readonly />
                <Rating size="lg" value={5} readonly />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">自定义字符</h3>
              <div className="space-y-3">
                <Rating character="♥" color="#ef4444" count={5} value={3} readonly />
                <Rating character="👍" count={3} value={2} readonly />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">带提示</h3>
              <Rating
                value={3}
                tooltips={['很差', '较差', '一般', '良好', '优秀']}
                readonly
              />
            </div>
          </div>
          </Card>
        </div>

        {/* Timeline组件 */}
        <div id="timeline">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">时间轴组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">基础时间轴</h3>
              <Timeline
                items={timelineItems}
                mode="left"
                pending="更多功能开发中..."
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">交替布局</h3>
              <Timeline
                items={timelineItems.slice(0, 3)}
                mode="alternate"
                size="sm"
              />
            </div>
          </div>
          </Card>
        </div>

        {/* Pagination组件 */}
        <div id="pagination">
          <Card>
          <h2 className="text-xl font-bold text-text-primary mb-4">分页组件</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">基础分页</h3>
              <Pagination
                current={paginationCurrent}
                total={500}
                pageSize={10}
                showTotal
                onChange={(page) => setPaginationCurrent(page)}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">带页面大小选择</h3>
              <Pagination
                current={1}
                total={200}
                pageSize={20}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条数据`}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">简单分页</h3>
              <Pagination
                current={2}
                total={100}
                pageSize={10}
                simple
                showTotal
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">迷你分页</h3>
              <Pagination
                current={1}
                total={50}
                pageSize={10}
                size="sm"
              />
            </div>
          </div>
          </Card>
        </div>
      </div>
      
      {/* Toast容器 */}
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
        position="top-right"
      />
      
      {/* 全屏加载 */}
      {showLoading && (
        <LoadingOverlay 
          type="spinner" 
          size="lg" 
          text="正在处理，请稍候..."
        />
      )}
    </MainLayout>
  )
}