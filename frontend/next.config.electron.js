/** @type {import('next').NextConfig} */
const nextConfig = {
  // 移除静态导出配置，保留SSR功能
  output: undefined,
  distDir: '.next',
  
  // Electron 环境下不需要API代理（直接与后端通信）
  async rewrites() {
    return []
  },
  
  // 优化 Webpack 配置
  webpack: (config, { dev, isServer }) => {
    // Electron 环境下的特殊配置
    if (!isServer) {
      config.target = 'electron-renderer'
    }
    
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    
    return config
  },
  
  // 图片优化配置
  images: {
    domains: ['localhost'],
    unoptimized: false // 启用图片优化
  },
  
  experimental: {
    esmExternals: false
  }
}

module.exports = nextConfig