import { defineComponent, ref } from 'vue'
import { Button, Card, Input, StatusIndicator, StatusToggle, Switch, Badge, Avatar, Skeleton, SkeletonCard, SkeletonList, Modal, ConfirmModal, Dropdown, Tooltip, Empty, EmptyData, EmptySearch, Loading, LoadingSpinner, LoadingDots, LoadingOverlay, Select, Table, TableHeader, TableBody, TableRow, TableCell, TableContainer } from '@/components/ui'
import { MainLayout } from '@/components/layout'
import type { StatusType, DropdownOption } from '@/components/ui'

export default defineComponent({
  name: 'DesignSystemPage',
  setup() {
    const inputValue = ref('')
    const statusDemo = ref<StatusType>('pending')
    const loading = ref(false)
    const switchDemo = ref(false)
    const modalOpen = ref(false)
    const confirmModalOpen = ref(false)
    const dropdownValue = ref<string | number>('')
    const showLoading = ref(false)

    const handleLoadingDemo = () => {
      loading.value = true
      setTimeout(() => loading.value = false, 2000)
    }

    // 下拉选择选项
    const dropdownOptions: DropdownOption[] = [
      { label: '选项1', value: 'option1', icon: '🎯' },
      { label: '选项2', value: 'option2', icon: '⭐' },
      { label: '选项3', value: 'option3', icon: '🚀', description: '这是一个描述' },
      { label: '禁用选项', value: 'disabled', disabled: true }
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
      { id: 'avatars', label: '头像', icon: '👤' },
      { id: 'skeleton', label: '骨架屏', icon: '💀' },
      { id: 'modal', label: '模态框', icon: '🪟' },
      { id: 'dropdown', label: '下拉选择', icon: '📋' },
      { id: 'tooltip', label: '工具提示', icon: '💬' },
      { id: 'empty', label: '空状态', icon: '📭' },
      { id: 'loading', label: '加载动画', icon: '⏳' },
      { id: 'table', label: '表格组件', icon: '📋' },
      { id: 'select', label: '选择器', icon: '🎯' }
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

    return () => (
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
        <div class="space-y-8">
          {/* 颜色系统 */}
          <div id="colors">
            <Card>
              <h2 class="text-xl font-bold text-text-primary mb-4">iOS 18 颜色系统</h2>
              <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                  { name: '蓝色', class: 'bg-ios18-blue', hex: '#0A84FF' },
                  { name: '靛蓝', class: 'bg-ios18-indigo', hex: '#5E5CE6' },
                  { name: '紫色', class: 'bg-ios18-purple', hex: '#AF52DE' },
                  { name: '青色', class: 'bg-ios18-teal', hex: '#30D158' },
                  { name: '薄荷', class: 'bg-ios18-mint', hex: '#00C7BE' },
                  { name: '棕色', class: 'bg-ios18-brown', hex: '#AC8E68' }
                ].map(color => (
                  <div key={color.name} class="text-center">
                    <div class={`w-full h-16 ${color.class} rounded-ios-lg mb-2`}></div>
                    <p class="text-sm font-medium text-text-primary">{color.name}</p>
                    <p class="text-xs text-text-secondary">{color.hex}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 按钮组件 */}
          <div id="buttons">
            <Card>
              <h2 class="text-xl font-bold text-text-primary mb-4">按钮组件</h2>
              <div class="space-y-4">
                <div class="flex flex-wrap gap-4">
                  <Button variant="primary">主要按钮</Button>
                  <Button variant="secondary">次要按钮</Button>
                  <Button variant="danger">危险按钮</Button>
                  <Button variant="ghost">幽灵按钮</Button>
                </div>
                
                <div class="flex flex-wrap gap-4">
                  <Button size="sm">小按钮</Button>
                  <Button size="md">中等按钮</Button>
                  <Button size="lg">大按钮</Button>
                </div>
                
                <div class="flex flex-wrap gap-4">
                  <Button disabled>禁用按钮</Button>
                  <Button loading={loading.value} onClick={handleLoadingDemo}>
                    {loading.value ? '加载中...' : '点击加载'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* 输入框组件 */}
          <div id="inputs">
            <Card>
              <h2 class="text-xl font-bold text-text-primary mb-4">输入框组件</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <Input
                    label="默认样式"
                    placeholder="请输入内容"
                    value={inputValue.value}
                    onInput={(e) => inputValue.value = (e.target as HTMLInputElement).value}
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
                
                <div class="space-y-4">
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
              <h2 class="text-xl font-bold text-text-primary mb-4">状态指示器</h2>
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">基础状态</h3>
                  <div class="flex items-center space-x-6">
                    <StatusIndicator status="pending" showLabel />
                    <StatusIndicator status="in_progress" showLabel />
                    <StatusIndicator status="completed" showLabel />
                  </div>
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">不同尺寸</h3>
                  <div class="flex items-center space-x-4">
                    <StatusIndicator status="completed" size="sm" />
                    <StatusIndicator status="completed" size="md" />
                    <StatusIndicator status="completed" size="lg" />
                  </div>
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">交互式状态切换</h3>
                  <div class="flex items-center space-x-4">
                    <StatusToggle
                      status={statusDemo.value}
                      onChange={(status) => statusDemo.value = status}
                    />
                    <span class="text-text-secondary">
                      当前状态: {statusDemo.value} (点击切换)
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 卡片组件 */}
          <div id="cards">
            <Card>
              <h2 class="text-xl font-bold text-text-primary mb-4">卡片组件</h2>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card padding="md" glass={true}>
                  <h3 class="font-semibold text-text-primary mb-2">毛玻璃卡片</h3>
                  <p class="text-text-secondary text-sm">
                    这是一个带有毛玻璃效果的卡片组件
                  </p>
                </Card>
                
                <Card padding="md" glass={false}>
                  <h3 class="font-semibold text-text-primary mb-2">普通卡片</h3>
                  <p class="text-text-secondary text-sm">
                    这是一个普通的白色背景卡片
                  </p>
                </Card>
                
                <Card padding="md" hoverable={true}>
                  <h3 class="font-semibold text-text-primary mb-2">可悬停卡片</h3>
                  <p class="text-text-secondary text-sm">
                    鼠标悬停时会有动画效果
                  </p>
                </Card>
              </div>
            </Card>
          </div>

          {/* Typography */}
          <div id="typography">
            <Card>
              <h2 class="text-xl font-bold text-text-primary mb-4">字体系统</h2>
              <div class="space-y-4">
                <div class="text-4xl font-bold text-text-primary">大标题 (34px)</div>
                <div class="text-3xl font-bold text-text-primary">标题1 (28px)</div>
                <div class="text-2xl font-bold text-text-primary">标题2 (22px)</div>
                <div class="text-xl font-bold text-text-primary">标题3 (20px)</div>
                <div class="text-lg text-text-primary">标题文字 (17px)</div>
                <div class="text-base text-text-primary">正文文字 (17px)</div>
                <div class="text-sm text-text-secondary">次要文字 (15px)</div>
                <div class="text-xs text-text-tertiary">辅助文字 (13px)</div>
              </div>
            </Card>
          </div>

          {/* Switch组件 */}
          <div id="switches">
            <Card>
              <h2 class="text-xl font-bold text-text-primary mb-4">开关组件</h2>
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">基础开关</h3>
                  <div class="flex items-center space-x-6">
                    <Switch />
                    <Switch checked />
                    <Switch disabled />
                    <Switch checked disabled />
                  </div>
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">不同尺寸</h3>
                  <div class="flex items-center space-x-4">
                    <Switch size="sm" />
                    <Switch size="md" checked />
                    <Switch size="lg" />
                  </div>
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">带标签的开关</h3>
                  <div class="space-y-3">
                    <Switch 
                      label="接收通知" 
                      checked={switchDemo.value} 
                      onChange={(checked) => switchDemo.value = checked} 
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
              <h2 class="text-xl font-bold text-text-primary mb-4">徽章组件</h2>
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">基础徽章</h3>
                  <div class="flex flex-wrap items-center gap-3">
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
                  <h3 class="text-lg font-medium text-text-primary mb-3">不同尺寸</h3>
                  <div class="flex items-center space-x-3">
                    <Badge size="sm">小</Badge>
                    <Badge size="md">中</Badge>
                    <Badge size="lg">大</Badge>
                  </div>
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">数字徽章</h3>
                  <div class="flex items-center space-x-6">
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
                      <div class="w-8 h-8 bg-gray-200 rounded-lg"></div>
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Avatar组件 */}
          <div id="avatars">
            <Card>
              <h2 class="text-xl font-bold text-text-primary mb-4">头像组件</h2>
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">不同尺寸</h3>
                  <div class="flex items-center space-x-4">
                    <Avatar size="xs" name="张三" />
                    <Avatar size="sm" name="李四" />
                    <Avatar size="md" name="王五" />
                    <Avatar size="lg" name="赵六" />
                    <Avatar size="xl" name="孙七" />
                    <Avatar size="2xl" name="周八" />
                  </div>
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">不同形状</h3>
                  <div class="flex items-center space-x-4">
                    <Avatar name="圆形" shape="circle" />
                    <Avatar name="方形" shape="square" />
                  </div>
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">状态指示</h3>
                  <div class="flex items-center space-x-4">
                    <Avatar name="在线" status="online" />
                    <Avatar name="离开" status="away" />
                    <Avatar name="忙碌" status="busy" />
                    <Avatar name="离线" status="offline" />
                  </div>
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">带徽章</h3>
                  <div class="flex items-center space-x-4">
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

          {/* Skeleton组件 */}
          <div id="skeleton">
            <Card>
              <h2 class="text-xl font-bold text-text-primary mb-4">骨架屏组件</h2>
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">基础骨架屏</h3>
                  <div class="space-y-3">
                    <Skeleton height="20px" />
                    <Skeleton height="16px" width="80%" />
                    <Skeleton height="16px" width="60%" />
                  </div>
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">不同形状</h3>
                  <div class="flex items-center space-x-4">
                    <Skeleton variant="circular" width={40} height={40} />
                    <Skeleton variant="rectangular" width={100} height={60} />
                    <Skeleton variant="rounded" width={120} height={80} />
                  </div>
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">多行文本</h3>
                  <Skeleton lines={3} />
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">头像骨架屏</h3>
                  <Skeleton avatar />
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">卡片骨架屏</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">列表骨架屏</h3>
                  <SkeletonList items={3} />
                </div>
              </div>
            </Card>
          </div>

          {/* Modal组件 */}
          <div id="modal">
            <Card>
              <h2 class="text-xl font-bold text-text-primary mb-4">模态框组件</h2>
              <div class="space-y-4">
                <div class="flex flex-wrap gap-3">
                  <Button onClick={() => modalOpen.value = true}>
                    打开模态框
                  </Button>
                  <Button onClick={() => confirmModalOpen.value = true} variant="danger">
                    确认对话框
                  </Button>
                </div>
                
                <Modal
                  isOpen={modalOpen.value}
                  onClose={() => modalOpen.value = false}
                  title="示例模态框"
                  footer={
                    <>
                      <Button variant="secondary" onClick={() => modalOpen.value = false}>
                        取消
                      </Button>
                      <Button onClick={() => modalOpen.value = false}>
                        确认
                      </Button>
                    </>
                  }
                >
                  <p class="text-gray-700">
                    这是一个示例模态框，展示了基本的模态框功能。支持标题、内容区域和底部操作按钮。
                  </p>
                </Modal>
                
                <ConfirmModal
                  isOpen={confirmModalOpen.value}
                  onClose={() => confirmModalOpen.value = false}
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
              <h2 class="text-xl font-bold text-text-primary mb-4">下拉选择组件</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">基础下拉</label>
                    <Dropdown
                      options={dropdownOptions}
                      value={dropdownValue.value}
                      onChange={(value) => {
                        if (typeof value === 'string' || typeof value === 'number') {
                          dropdownValue.value = value
                        }
                      }}
                      placeholder="请选择选项"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">可搜索</label>
                    <Dropdown
                      options={dropdownOptions}
                      searchable
                      placeholder="搜索并选择"
                    />
                  </div>
                </div>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">多选模式</label>
                    <Dropdown
                      options={dropdownOptions}
                      multiple
                      placeholder="多选选项"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">可清空</label>
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

          {/* Tooltip组件 */}
          <div id="tooltip">
            <Card>
              <h2 class="text-xl font-bold text-text-primary mb-4">工具提示组件</h2>
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">基础提示</h3>
                  <div class="flex flex-wrap gap-4">
                    <Tooltip content="这是一个顶部提示" placement="top" delay={0}>
                      <Button>顶部提示</Button>
                    </Tooltip>
                    <Tooltip content="这是一个底部提示" placement="bottom" delay={0}>
                      <Button>底部提示</Button>
                    </Tooltip>
                    <Tooltip content="这是一个左侧提示" placement="left" delay={0}>
                      <Button>左侧提示</Button>
                    </Tooltip>
                    <Tooltip content="这是一个右侧提示" placement="right" delay={0}>
                      <Button>右侧提示</Button>
                    </Tooltip>
                  </div>
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">触发方式</h3>
                  <div class="flex flex-wrap gap-4">
                    <Tooltip content="鼠标悬停触发" trigger="hover" delay={0}>
                      <Button variant="secondary">悬停触发</Button>
                    </Tooltip>
                    <Tooltip content="点击触发" trigger="click" delay={0}>
                      <Button variant="secondary">点击触发</Button>
                    </Tooltip>
                    <Tooltip content="焦点触发" trigger="focus" delay={0}>
                      <Button variant="secondary">焦点触发</Button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Empty组件 */}
          <div id="empty">
            <Card>
              <h2 class="text-xl font-bold text-text-primary mb-4">空状态组件</h2>
              <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="border border-gray-200 rounded-ios-lg p-4">
                    <EmptyData
                      description="暂时没有数据，请稍后再试"
                      action={<Button size="sm">刷新数据</Button>}
                    />
                  </div>
                  
                  <div class="border border-gray-200 rounded-ios-lg p-4">
                    <EmptySearch
                      action={<Button size="sm" variant="secondary">清除筛选</Button>}
                    />
                  </div>
                  
                  <div class="border border-gray-200 rounded-ios-lg p-4">
                    <Empty
                      image="noFiles"
                      title="暂无文件"
                      description="点击下方按钮上传您的第一个文件"
                      action={<Button size="sm">上传文件</Button>}
                      size="sm"
                    />
                  </div>
                  
                  <div class="border border-gray-200 rounded-ios-lg p-4">
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
              <h2 class="text-xl font-bold text-text-primary mb-4">加载动画组件</h2>
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">不同类型</h3>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div class="text-center p-4 border border-gray-200 rounded-ios-lg">
                      <LoadingSpinner size="lg" />
                      <p class="text-sm text-gray-500 mt-2">旋转加载</p>
                    </div>
                    <div class="text-center p-4 border border-gray-200 rounded-ios-lg">
                      <LoadingDots size="lg" />
                      <p class="text-sm text-gray-500 mt-2">点状加载</p>
                    </div>
                    <div class="text-center p-4 border border-gray-200 rounded-ios-lg">
                      <Loading type="pulse" size="lg" />
                      <p class="text-sm text-gray-500 mt-2">脉冲加载</p>
                    </div>
                    <div class="text-center p-4 border border-gray-200 rounded-ios-lg">
                      <Loading type="bars" size="lg" />
                      <p class="text-sm text-gray-500 mt-2">条状加载</p>
                    </div>
                    <div class="text-center p-4 border border-gray-200 rounded-ios-lg">
                      <Loading type="ring" size="lg" />
                      <p class="text-sm text-gray-500 mt-2">环形加载</p>
                    </div>
                    <div class="text-center p-4 border border-gray-200 rounded-ios-lg">
                      <Loading type="wave" size="lg" />
                      <p class="text-sm text-gray-500 mt-2">波浪加载</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">带文字的加载</h3>
                  <div class="flex justify-center p-6 border border-gray-200 rounded-ios-lg">
                    <Loading type="spinner" size="md" text="正在加载数据..." />
                  </div>
                </div>
                
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">全屏加载</h3>
                  <div class="flex space-x-4">
                    <Button 
                      onClick={() => showLoading.value = true}
                      disabled={showLoading.value}
                    >
                      显示全屏加载
                    </Button>
                    {showLoading.value && (
                      <Button 
                        variant="secondary"
                        onClick={() => showLoading.value = false}
                      >
                        关闭加载
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Table组件 */}
          <div id="table">
            <Card>
              <h2 class="text-xl font-bold text-text-primary mb-4">表格组件</h2>
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">基础表格</h3>
                  <TableContainer 
                    title="用户列表" 
                    description="显示系统中的所有用户信息"
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableCell type="header">姓名</TableCell>
                          <TableCell type="header">邮箱</TableCell>
                          <TableCell type="header">角色</TableCell>
                          <TableCell type="header" align="center">状态</TableCell>
                          <TableCell type="header" align="right">操作</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>高春强</TableCell>
                          <TableCell>gao@example.com</TableCell>
                          <TableCell>管理员</TableCell>
                          <TableCell align="center">
                            <Badge variant="success">活跃</Badge>
                          </TableCell>
                          <TableCell align="right">
                            <Button size="sm" variant="ghost">编辑</Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>杨伟</TableCell>
                          <TableCell>yang@example.com</TableCell>
                          <TableCell>操作员</TableCell>
                          <TableCell align="center">
                            <Badge variant="warning">离线</Badge>
                          </TableCell>
                          <TableCell align="right">
                            <Button size="sm" variant="ghost">编辑</Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>

                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">空状态表格</h3>
                  <TableContainer 
                    title="空数据表格" 
                    description="演示表格空状态显示"
                    showEmptyState
                    emptyState={{
                      title: "暂无数据",
                      description: "还没有任何记录，点击上方按钮创建第一条记录"
                    }}
                  />
                </div>

                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">加载状态表格</h3>
                  <TableContainer 
                    title="加载中的表格" 
                    description="演示表格加载状态"
                  >
                    <Table loading loadingText="正在加载数据...">
                      <TableHeader>
                        <TableRow>
                          <TableCell type="header">名称</TableCell>
                          <TableCell type="header">状态</TableCell>
                          <TableCell type="header">创建时间</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell><Skeleton width="80px" /></TableCell>
                          <TableCell><Skeleton width="60px" /></TableCell>
                          <TableCell><Skeleton width="120px" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><Skeleton width="90px" /></TableCell>
                          <TableCell><Skeleton width="60px" /></TableCell>
                          <TableCell><Skeleton width="120px" /></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
              </div>
            </Card>
          </div>

          {/* Select组件 */}
          <div id="select">
            <Card>
              <h2 class="text-xl font-bold text-text-primary mb-4">选择器组件</h2>
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">基础选择器</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      placeholder="请选择城市"
                      options={[
                        { value: 'beijing', label: '北京' },
                        { value: 'shanghai', label: '上海' },
                        { value: 'guangzhou', label: '广州' },
                        { value: 'shenzhen', label: '深圳' }
                      ]}
                    />
                    <Select
                      placeholder="请选择语言"
                      clearable
                      options={[
                        { value: 'zh', label: '中文', description: '简体中文' },
                        { value: 'en', label: 'English', description: 'English Language' },
                        { value: 'ja', label: '日本語', description: 'Japanese Language' }
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">多选选择器</h3>
                  <Select
                    placeholder="请选择技能"
                    multiple
                    clearable
                    options={[
                      { value: 'js', label: 'JavaScript' },
                      { value: 'ts', label: 'TypeScript' },
                      { value: 'react', label: 'React' },
                      { value: 'vue', label: 'Vue.js' },
                      { value: 'node', label: 'Node.js' },
                      { value: 'python', label: 'Python' }
                    ]}
                  />
                </div>

                <div>
                  <h3 class="text-lg font-medium text-text-primary mb-3">可搜索选择器</h3>
                  <Select
                    placeholder="搜索用户"
                    searchable
                    clearable
                    options={[
                      { value: 'user1', label: '高春强', description: '管理员' },
                      { value: 'user2', label: '杨伟', description: '操作员' },
                      { value: 'user3', label: '李明', description: '技术员' },
                      { value: 'user4', label: '王芳', description: '设计师' }
                    ]}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* 全屏加载 */}
        {showLoading.value && (
          <LoadingOverlay 
            type="spinner" 
            size="lg" 
            text="正在处理，请稍候..."
          />
        )}
      </MainLayout>
    )
  }
})