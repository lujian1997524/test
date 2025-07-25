/** @type {import('next').NextConfig} */
const nextConfig = {
  // API代理配置
  async rewrites() {
    // 根据环境变量或请求来源动态设置后端地址
    const backendHost = process.env.BACKEND_HOST || '192.168.31.203';
    const backendPort = process.env.BACKEND_PORT || '35001';
    
    console.log(`🔄 配置 API 代理: /api/* -> http://${backendHost}:${backendPort}/api/*`);
    
    return [
      {
        source: '/api/:path*',
        destination: `http://${backendHost}:${backendPort}/api/:path*`
      }
    ]
  },
  
  // 生产时导出静态文件供Electron使用
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  distDir: 'out',
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig