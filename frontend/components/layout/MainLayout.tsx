'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from './Header'
import { Sidebar, SidebarItem } from './Sidebar'

export interface MainLayoutProps {
  children: React.ReactNode
  headerTitle?: string
  headerSubtitle?: string
  headerActions?: React.ReactNode
  sidebarItems?: SidebarItem[]
  showSidebar?: boolean
  className?: string
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  headerTitle,
  headerSubtitle,
  headerActions,
  sidebarItems = [],
  showSidebar = true,
  className = ''
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // 默认在移动端折叠

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${className}`}>
      <div className="flex min-h-screen">
        {/* 侧边栏 - 响应式优化 */}
        {showSidebar && sidebarItems.length > 0 && (
          <motion.div
            className="flex-shrink-0 w-72 lg:w-80 xl:w-96 p-2 lg:p-4 hidden md:block"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Sidebar
              items={sidebarItems}
              collapsed={sidebarCollapsed}
              onToggleCollapse={toggleSidebar}
              className="h-full sticky top-2 lg:top-4"
            />
          </motion.div>
        )}

        {/* 主内容区域 - 响应式优化 */}
        <motion.div
          className="flex-1 flex flex-col min-h-screen overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {/* 页面头部 - 紧凑优化 */}
          {(headerTitle || headerActions) && (
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
              <div className="p-2 lg:p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {/* 移动端菜单按钮 */}
                    {showSidebar && sidebarItems.length > 0 && (
                      <button
                        onClick={toggleSidebar}
                        className="md:hidden p-1.5 rounded-md bg-white/70 border border-gray-200/50 hover:bg-gray-50 transition-all duration-200 active:scale-95"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                    )}
                    <div>
                      <Header
                        title={headerTitle}
                        subtitle={headerSubtitle}
                      />
                    </div>
                  </div>
                  <div>
                    {headerActions}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 页面内容 - 修复显示问题 */}
          <motion.main
            className="flex-1 p-2 lg:p-3 xl:p-4 pb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{ minHeight: 0 }} // 确保可以收缩
          >
            <div className="w-full h-full">
              {children}
            </div>
          </motion.main>
        </motion.div>
      </div>

      {/* 移动端侧边栏覆盖层 */}
      {showSidebar && sidebarItems.length > 0 && (
        <motion.div
          className={`fixed inset-0 z-50 md:hidden ${
            sidebarCollapsed ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: sidebarCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={toggleSidebar}
          />
          <motion.div
            className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl"
            initial={{ x: -288 }}
            animate={{ x: sidebarCollapsed ? -288 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="p-2 h-full">
              <Sidebar
                items={sidebarItems}
                collapsed={false}
                onToggleCollapse={toggleSidebar}
                className="h-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}