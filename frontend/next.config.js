/** @type {import('next').NextConfig} */

// 检测是否为 Electron 环境
const isElectron = process.env.IS_ELECTRON === 'true';
// 检测打包模式
const useStaticExport = process.env.USE_STATIC_EXPORT === 'true';

const nextConfig = {
  // API代理配置（仅非Electron环境）
  async rewrites() {
    if (isElectron) {
      return []; // Electron环境下不需要代理
    }
    
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
    // Electron 环境优化
    if (isElectron && !isServer) {
      config.target = 'electron-renderer';
    }
    
    if (dev && !isServer) {
      // 开发环境下配置HMR WebSocket
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  
  // 条件性配置导出模式
  output: useStaticExport ? 'export' : undefined,
  distDir: useStaticExport ? 'out' : '.next',
  
  // 图片配置
  images: {
    unoptimized: useStaticExport || isElectron
  },
  
  // Electron环境下的路径配置
  trailingSlash: useStaticExport,
  assetPrefix: useStaticExport ? './' : undefined,
  
  // 实验性配置
  experimental: {
    esmExternals: false
  }
}

module.exports = nextConfig