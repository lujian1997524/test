const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// 导入配置管理
const { getConfig, logConfig } = require('./config/envConfig');

// 导入数据库连接和模型
const { testConnection } = require('./utils/database');
const models = require('./models');

// 导入路由
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const workersRoutes = require('./routes/workers');
const departmentsRoutes = require('./routes/departments');
const projectsRoutes = require('./routes/projects');
const materialsRoutes = require('./routes/materials');
const thicknessSpecsRoutes = require('./routes/thickness-specs');
const drawingsRoutes = require('./routes/drawings');
const dxfRoutes = require('./routes/dxf');
const dashboardRoutes = require('./routes/dashboard');
const searchRoutes = require('./routes/search');
const sseRoutes = require('./routes/sse');

const app = express();

// 获取配置
const config = getConfig();

// 中间件配置
app.use(helmet());

// CORS配置 - 使用环境配置管理
app.use(cors({
  origin: function (origin, callback) {
    // 允许同源请求 (origin为undefined)
    if (!origin) return callback(null, true);
    
    // 检查是否在允许的源列表中
    if (config.cors.origins.includes(origin)) {
      return callback(null, true);
    }
    
    // 允许localhost和127.0.0.1的任意端口（开发环境）
    if (config.isDevelopment && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }
    
    // 允许局域网IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const url = new URL(origin);
    const hostname = url.hostname;
    
    if (
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    ) {
      return callback(null, true);
    }
    
    console.warn(`❌ CORS: 拒绝来源 ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With']
}));

app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '激光切割生产管理系统 API 服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// API路由
app.get('/api', (req, res) => {
  res.json({
    message: '激光切割生产管理系统 API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      workers: '/api/workers',
      departments: '/api/departments',
      projects: '/api/projects',
      materials: '/api/materials',
      thicknessSpecs: '/api/thickness-specs',
      drawings: '/api/drawings',
      dxf: '/api/dxf',
      dashboard: '/api/dashboard',
      search: '/api/search',
      sse: '/api/sse'
    }
  });
});

// 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/workers', workersRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/thickness-specs', thicknessSpecsRoutes);
app.use('/api/drawings', drawingsRoutes);
app.use('/api/dxf', dxfRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/sse', sseRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.originalUrl
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请联系管理员'
  });
});

const PORT = config.server.PORT;

// 启动服务器
app.listen(PORT, config.server.HOST, async () => {
  console.log(`🚀 激光切割管理系统后端服务启动成功`);
  console.log(`📡 HTTP API: ${config.server.BACKEND_URL}`);
  console.log(`🌐 局域网访问: ${config.server.BACKEND_URL}`);
  console.log(`🔍 健康检查: ${config.server.BACKEND_URL}/health`);
  console.log(`📚 API文档: ${config.server.BACKEND_URL}/api`);
  
  // 输出配置信息
  logConfig();
  
  // 测试数据库连接
  await testConnection();
});

module.exports = { app };