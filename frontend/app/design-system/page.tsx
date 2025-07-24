'use client'

import React, { useState } from 'react'
import { Button, Card, Input, StatusIndicator, StatusToggle } from '../../components/ui'
import { MainLayout } from '../../components/layout'
import type { StatusType } from '../../components/ui'

export default function DesignSystemPage() {
  const [inputValue, setInputValue] = useState('')
  const [statusDemo, setStatusDemo] = useState<StatusType>('pending')
  const [loading, setLoading] = useState(false)

  const handleLoadingDemo = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  const sidebarItems = [
    {
      id: 'design-system',
      label: '设计系统',
      active: true,
      children: [
        { id: 'colors', label: '颜色系统' },
        { id: 'typography', label: '字体系统' },
        { id: 'components', label: '组件库' }
      ]
    },
    {
      id: 'components-demo',
      label: '组件演示',
      children: [
        { id: 'buttons', label: '按钮' },
        { id: 'forms', label: '表单' },
        { id: 'cards', label: '卡片' },
        { id: 'status', label: '状态指示器' }
      ]
    }
  ]

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

        {/* 按钮组件 */}
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

        {/* 输入框组件 */}
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

        {/* 状态指示器组件 */}
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

        {/* 卡片组件 */}
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

        {/* Typography */}
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
    </MainLayout>
  )
}