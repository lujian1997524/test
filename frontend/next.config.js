/** @type {import('next').NextConfig} */
const nextConfig = {
  // API代理配置
  async rewrites() {
    // 从环境变量读取配置，提供默认值
    const backendHost = process.env.NEXT_PUBLIC_BACKEND_HOST || '192.168.31.134';
    const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '35001';
    
    console.log(`🔄 配置 API 代理: /api/* -> http://${backendHost}:${backendPort}/api/*`);
    
    return [
      {
        source: '/api/:path*',
        destination: `http://${backendHost}:${backendPort}/api/:path*`
      }
    ]
  },
  
  // 配置WebSocket和热重载
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 开发环境下配置HMR WebSocket
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  
  // 生产时导出静态文件供Electron使用
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  distDir: process.env.NODE_ENV === 'production' ? 'out' : '.next',
  images: {
    unoptimized: true
  },
  
  // Electron环境下的路径配置 - 修复Windows静态资源路径问题
  trailingSlash: process.env.NODE_ENV === 'production',
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : undefined,
  
  // 修复Electron中的资源路径问题
  experimental: {
    esmExternals: false
  }
}

module.exports = nextConfig