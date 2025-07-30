// 环境配置管理模块
// 使用统一的配置常量，避免硬编码

// 导入统一配置常量
const CONFIG_DEFAULTS = {
  PRODUCTION_HOST: '110.40.71.83',
  DEVELOPMENT_HOST: '110.40.71.83', // 开发环境也使用远程服务器
  BACKEND_PORT: '35001',
  FRONTEND_PORT: '4000'
};

interface EnvironmentConfig {
  // 服务器配置
  BACKEND_HOST: string;
  BACKEND_PORT: string;
  FRONTEND_HOST: string;
  FRONTEND_PORT: string;
  
  // 派生的URL
  BACKEND_URL: string;
  FRONTEND_URL: string;
  
  // 其他配置
  API_TIMEOUT: number;
  DEV_MODE: boolean;
}

/**
 * 获取环境配置
 * 支持多种部署场景：本地开发、局域网部署、云服务器部署
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  // 检测是否为生产环境
  const isProduction = import.meta.env.MODE === 'production';
  
  // 根据环境选择默认主机地址
  const defaultHost = isProduction ? CONFIG_DEFAULTS.PRODUCTION_HOST : CONFIG_DEFAULTS.DEVELOPMENT_HOST;
  
  // 从环境变量读取配置，使用统一的默认值
  const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST || defaultHost;
  const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || CONFIG_DEFAULTS.BACKEND_PORT;
  const FRONTEND_HOST = import.meta.env.VITE_FRONTEND_HOST || defaultHost;
  const FRONTEND_PORT = import.meta.env.VITE_FRONTEND_PORT || CONFIG_DEFAULTS.FRONTEND_PORT;
  
  const config: EnvironmentConfig = {
    BACKEND_HOST,
    BACKEND_PORT,
    FRONTEND_HOST,
    FRONTEND_PORT,
    
    // 自动构建完整URL
    BACKEND_URL: `http://${BACKEND_HOST}:${BACKEND_PORT}`,
    FRONTEND_URL: `http://${FRONTEND_HOST}:${FRONTEND_PORT}`,
    
    // 其他配置
    API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true',
  };
  
  return config;
};

/**
 * 获取API基础URL
 * 根据运行环境自动选择合适的URL
 */
export const getApiBaseUrl = (): string => {
  // 统一使用完整的后端地址
  return 'http://110.40.71.83:35001';
};

/**
 * 获取完整的后端URL（包含协议和端口）
 */
export const getBackendUrl = (): string => {
  const config = getEnvironmentConfig();
  return config.BACKEND_URL;
};

/**
 * 获取可能的后端URL列表（用于连接检测）
 */
export const getPossibleBackendUrls = (): string[] => {
  const config = getEnvironmentConfig();
  
  return [
    config.BACKEND_URL,
    'http://110.40.71.83:35001',
    'http://localhost:35001',
    'http://127.0.0.1:35001'
  ];
};

/**
 * 检测可用的后端地址
 */
export async function detectAvailableBackend(): Promise<string | null> {
  // 检查是否在Electron环境
  if (typeof window === 'undefined' || !(window as any).ELECTRON_ENV) {
    return null;
  }

  const possibleUrls = getPossibleBackendUrls();

  console.log('🔍 开始检测可用的后端地址...');

  for (const url of possibleUrls) {
    try {
      console.log(`⚡ 检测: ${url}`);
      const startTime = Date.now();
      
      // 尝试访问健康检查端点
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // 设置较短的超时时间
        signal: AbortSignal.timeout(3000)
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        console.log(`✅ 后端可用: ${url} (响应时间: ${responseTime}ms)`);
        // 更新全局变量
        (window as any).BACKEND_URL = url;
        return url;
      } else {
        console.log(`❌ 后端不可用: ${url} (状态码: ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ 连接失败: ${url} (错误: ${error})`);
    }
  }

  console.log('❌ 所有后端地址都不可用');
  return null;
}

/**
 * 带重试的后端检测
 */
export async function detectBackendWithRetry(maxRetries: number = 3): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    console.log(`🔄 第 ${i + 1} 次尝试检测后端...`);
    const result = await detectAvailableBackend();
    if (result) {
      return result;
    }
    
    if (i < maxRetries - 1) {
      console.log('⏳ 等待 2 秒后重试...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return null;
}

/**
 * 记录当前配置信息（调试用）
 */
export const logCurrentConfig = (): void => {
  if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
    const config = getEnvironmentConfig();
    console.log('🔧 环境配置信息:', {
      环境: import.meta.env.MODE,
      前端地址: config.FRONTEND_URL,
      后端地址: config.BACKEND_URL,
      API基础URL: getApiBaseUrl(),
      开发模式: config.DEV_MODE,
      API超时: config.API_TIMEOUT + 'ms'
    });
  }
};

// 默认导出配置对象
const config = getEnvironmentConfig();
export default config;