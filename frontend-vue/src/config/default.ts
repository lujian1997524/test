/**
 * 默认配置文件
 * 使用统一的配置常量，避免硬编码
 */

import type { AppConfig } from '@/utils/configManager';

// 导入统一配置常量
const CONFIG_DEFAULTS = {
  PRODUCTION_HOST: '110.40.71.83',
  BACKEND_PORT: '35001'
};

export const DEFAULT_CONFIG: AppConfig = {
  // API配置 - 统一使用相对URL，让Vite代理处理
  apiUrl: '',
  apiTimeout: 30000,

  // 应用配置
  environment: 'production',
  appName: '激光切割生产管理系统', 
  version: '1.0.0',

  // 功能开关
  features: {
    enableNotifications: true,
    enableSSE: true,
    enableOfflineMode: false,
  },

  // UI配置
  ui: {
    theme: 'light',
    language: 'zh-CN',
    sidebarWidth: 220,
  },

  // 音频和通知配置
  audio: {
    notificationVolume: 70,
    enableSounds: true,
    soundTheme: 'default',
  },

  // 通知配置
  notifications: {
    desktop: true,
    sound: true,
    showPreview: true,
    position: 'top-right',
  },
};

/**
 * 开发环境配置覆盖
 */
export const DEVELOPMENT_CONFIG: Partial<AppConfig> = {
  environment: 'development',
  apiUrl: '', // 开发环境使用相对URL让Vite代理处理
  features: {
    enableNotifications: true,
    enableSSE: true,
    enableOfflineMode: true, // 开发环境启用离线模式便于测试
  },
};

/**
 * 生产环境配置覆盖
 */
export const PRODUCTION_CONFIG: Partial<AppConfig> = {
  environment: 'production',
  apiUrl: '', // 生产环境也使用相对URL，让代理处理
  features: {
    enableNotifications: true,
    enableSSE: true,
    enableOfflineMode: false,
  },
};