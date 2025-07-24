'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/stores/notificationStore';
import type { NotificationMessage } from '@/utils/sseManager';

// 通知图标组件
const NotificationIcon = ({ type }: { type: NotificationMessage['type'] }) => {
  const iconProps = {
    className: "w-5 h-5 flex-shrink-0",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeWidth: 2
  };

  switch (type) {
    case 'success':
      return (
        <svg {...iconProps} className={`${iconProps.className} text-green-500`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'warning':
      return (
        <svg {...iconProps} className={`${iconProps.className} text-yellow-500`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'error':
      return (
        <svg {...iconProps} className={`${iconProps.className} text-red-500`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg {...iconProps} className={`${iconProps.className} text-blue-500`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

// 单个通知项组件
const NotificationItem = ({ 
  notification, 
  onClose, 
  onClick 
}: { 
  notification: NotificationMessage;
  onClose: () => void;
  onClick?: () => void;
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = () => {
    if (notification.onClick) {
      notification.onClick();
    } else if (onClick) {
      onClick();
    }
    onClose();
  };

  const borderColors = {
    info: 'border-blue-200',
    success: 'border-green-200',
    warning: 'border-yellow-200',
    error: 'border-red-200'
  };

  const bgColors = {
    info: 'bg-blue-50/80',
    success: 'bg-green-50/80',
    warning: 'bg-yellow-50/80',
    error: 'bg-red-50/80'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        mass: 0.8 
      }}
      className={`
        relative bg-white/95 backdrop-blur-xl rounded-2xl border shadow-lg
        ${borderColors[notification.type]} 
        hover:shadow-xl transition-all duration-200
        cursor-pointer group max-w-sm w-full
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* 左侧色彩条 */}
      <div className={`
        absolute left-0 top-3 bottom-3 w-1 rounded-full
        ${notification.type === 'info' ? 'bg-blue-500' : ''}
        ${notification.type === 'success' ? 'bg-green-500' : ''}
        ${notification.type === 'warning' ? 'bg-yellow-500' : ''}
        ${notification.type === 'error' ? 'bg-red-500' : ''}
      `} />

      {/* 主要内容 */}
      <div className="p-4 pl-6">
        <div className="flex items-start justify-between gap-3">
          {/* 图标和内容 */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <NotificationIcon type={notification.type} />
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-text-primary text-sm leading-tight">
                {notification.title}
              </h4>
              <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                {notification.message}
              </p>
              <div className="text-text-tertiary text-xs mt-2">
                {new Date(notification.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* 关闭按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className={`
              w-6 h-6 rounded-full flex items-center justify-center
              text-text-tertiary hover:text-text-secondary hover:bg-gray-100
              transition-all duration-200 flex-shrink-0
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 进度条（如果有持续时间）*/}
      {notification.duration && notification.duration > 0 && (
        <motion.div
          className={`
            absolute bottom-0 left-0 h-0.5 rounded-full
            ${notification.type === 'info' ? 'bg-blue-500' : ''}
            ${notification.type === 'success' ? 'bg-green-500' : ''}
            ${notification.type === 'warning' ? 'bg-yellow-500' : ''}
            ${notification.type === 'error' ? 'bg-red-500' : ''}
          `}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ 
            duration: notification.duration / 1000,
            ease: "linear"
          }}
        />
      )}
    </motion.div>
  );
};

// 通知容器组件
export const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotificationStore();

  // 调试日志：监控通知数组变化
  React.useEffect(() => {
    console.log('📱 NotificationContainer - 通知列表更新:', notifications.map(n => ({
      id: n.id,
      title: n.title,
      timestamp: n.timestamp
    })));
  }, [notifications]);

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => {
          console.log('🗝️ 渲染通知key:', notification.id);
          return (
            <div key={notification.id} className="pointer-events-auto">
              <NotificationItem
                notification={notification}
                onClose={() => removeNotification(notification.id)}
              />
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// SSE连接状态指示器组件
export const SSEConnectionIndicator = () => {
  const { isSSEConnected } = useNotificationStore();

  if (isSSEConnected) {
    // 连接正常时不显示
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-6 z-50 pointer-events-none"
    >
      <div className="bg-red-50/90 backdrop-blur-xl border border-red-200 rounded-2xl px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-700 text-sm font-medium">
            实时同步已断开
          </span>
        </div>
      </div>
    </motion.div>
  );
};