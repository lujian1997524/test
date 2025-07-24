/** @type {import('next').NextConfig} */
const nextConfig = {
  // API代理配置
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:35001/api/:path*'
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