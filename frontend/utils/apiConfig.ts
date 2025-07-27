// API 配置
const isElectron = typeof window !== 'undefined' && window.electronAPI;
const isDev = process.env.NODE_ENV === 'development';

// 根据环境确定 API 基础地址
export const API_BASE_URL = (() => {
  if (isDev && !isElectron) {
    // 开发环境的网页版，使用代理
    return '/api';
  } else {
    // 生产环境的 Electron 版本，直接连接后端
    const backendHost = process.env.NEXT_PUBLIC_BACKEND_HOST || '192.168.31.134';
    const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '35001';
    return `http://${backendHost}:${backendPort}/api`;
  }
})();

console.log('🔧 API 配置:', {
  isDev,
  isElectron,
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