// API 配置
// 使用统一的配置常量，避免硬编码

// 导入统一配置常量
const CONFIG_DEFAULTS = {
  PRODUCTION_HOST: '110.40.71.83',
  DEVELOPMENT_HOST: 'localhost',
  BACKEND_PORT: '35001'
};

const isElectron = typeof window !== 'undefined' && window.electronAPI;
const isDev = import.meta.env.MODE === 'development';
const isStaticBuild = import.meta.env.VITE_STATIC_BUILD === 'true' || typeof window !== 'undefined' && !window.location.pathname.includes('_next');

// 根据环境确定 API 基础地址
export const API_BASE_URL = (() => {
  if (isDev && !isElectron) {
    // 开发环境的网页版，使用代理
    return '/api';
  } else {
    // 生产环境或 Electron 版本，直接连接后端
    // 根据环境选择默认主机地址
    const isProduction = import.meta.env.MODE === 'production';
    const defaultHost = isProduction ? CONFIG_DEFAULTS.PRODUCTION_HOST : CONFIG_DEFAULTS.DEVELOPMENT_HOST;
    
    const backendHost = import.meta.env.VITE_BACKEND_HOST || defaultHost;
    const backendPort = import.meta.env.VITE_BACKEND_PORT || CONFIG_DEFAULTS.BACKEND_PORT;
    return `http://${backendHost}:${backendPort}/api`;
  }
})();

console.log('🔧 API 配置:', {
  isDev,
  isElectron,
  isStaticBuild,
  API_BASE_URL
});

// API 请求封装
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  console.log(`📡 API 请求: ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error(`❌ API 请求失败 ${url}:`, error);
    throw error;
  }
};

export default API_BASE_URL;