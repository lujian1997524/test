'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ActivityBar } from './ActivityBar';
import { useResponsive } from '@/hooks/useResponsive';
import { MobileDrawer, BottomSheet } from '@/components/ui/ResponsiveLayout';

interface VSCodeLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  activeView: 'active' | 'completed' | 'drawings' | 'workers' | 'dashboard' | 'settings';
  onViewChange: (view: 'active' | 'completed' | 'drawings' | 'workers' | 'dashboard' | 'settings') => void;
  onSearchClick?: () => void;
  onSystemSettingsClick?: () => void;
  onProfileClick?: () => void;
  className?: string;
}

export const VSCodeLayout: React.FC<VSCodeLayoutProps> = ({
  children,
  sidebar,
  activeView,
  onViewChange,
  onSearchClick,
  onSystemSettingsClick,
  onProfileClick,
  className = ''
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [showMobileSidebar, setShowMobileSidebar] = React.useState(false);

  // 桌面端布局 - VS Code风格
  if (isDesktop) {
    return (
      <div className={`min-h-screen bg-gray-50 flex ${className}`}>
        {/* 活动栏 */}
        <ActivityBar
          activeView={activeView}
          onViewChange={onViewChange}
          onSearchClick={onSearchClick}
          onSystemSettingsClick={onSystemSettingsClick}
          onProfileClick={onProfileClick}
        />
        
        {/* 侧边栏 */}
        {sidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            className="w-55 bg-white/80 backdrop-blur-xl border-r border-gray-200 flex-shrink-0"
            style={{ width: '220px' }}
          >
            {sidebar}
          </motion.div>
        )}
        
        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // 平板端布局
  if (isTablet) {
    return (
      <div className={`min-h-screen bg-gray-50 flex ${className}`}>
        {/* 简化活动栏 */}
        <div className="w-16 bg-gray-100/80 backdrop-blur-xl border-r border-gray-200 flex-shrink-0">
          <div className="p-2 space-y-2">
            {['active', 'completed', 'drawings', 'workers'].map((view) => (
              <button
                key={view}
                onClick={() => onViewChange(view as any)}
                className={`
                  w-12 h-12 rounded-lg flex items-center justify-center text-xs font-medium
                  ${activeView === view 
                    ? 'bg-ios18-blue text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {view === 'active' ? '活跃' : 
                 view === 'completed' ? '过往' :
                 view === 'drawings' ? '图纸' : '工人'}
              </button>
            ))}
          </div>
        </div>

        {/* 侧边栏 */}
        {sidebar && (
          <div className="bg-white/80 backdrop-blur-xl border-r border-gray-200 flex-shrink-0" style={{ width: '180px' }}>
            {sidebar}
          </div>
        )}
        
        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-4 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // 移动端布局
  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col ${className}`}>
      {/* 移动端顶部栏 */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">激光切割管理</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 主内容区域 */}
      <main className="flex-1 p-4 overflow-auto">
        {children}
      </main>

      {/* 底部导航 */}
      <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200 p-2 flex-shrink-0">
        <div className="flex justify-around">
          {[
            { key: 'active', label: '活跃', icon: '📋' },
            { key: 'completed', label: '过往', icon: '✅' },
            { key: 'drawings', label: '图纸', icon: '📐' },
            { key: 'workers', label: '工人', icon: '👥' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => onViewChange(item.key as any)}
              className={`
                flex flex-col items-center p-2 rounded-lg min-h-[44px] min-w-[44px]
                ${activeView === item.key 
                  ? 'bg-ios18-blue text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 移动端侧边栏抽屉 */}
      <MobileDrawer
        isOpen={showMobileSidebar}
        onClose={() => setShowMobileSidebar(false)}
        title="功能菜单"
        position="left"
      >
        {sidebar}
      </MobileDrawer>
    </div>
  );
};