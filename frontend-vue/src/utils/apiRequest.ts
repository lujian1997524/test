// 统一的后端地址配置
const BACKEND_URL = 'http://110.40.71.83:35001'

// 获取后端API基础URL
export const getApiBaseUrl = () => {
  return BACKEND_URL
}

// 创建一个统一的API请求函数
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${BACKEND_URL}${endpoint}`
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

// 认证请求
export const authenticatedRequest = async (
  endpoint: string, 
  token: string, 
  options: RequestInit = {}
) => {
  return apiRequest(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  })
}