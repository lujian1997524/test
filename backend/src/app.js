const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// 导入数据库连接和模型
const { testConnection } = require('./utils/database');
const models = require('./models');

// 导入路由
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const workersRoutes = require('./routes/workers');
const projectsRoutes = require('./routes/projects');
const materialsRoutes = require('./routes/materials');
const thicknessSpecsRoutes = require('./routes/thickness-specs');
const drawingsRoutes = require('./routes/drawings');
const dashboardRoutes = require('./routes/dashboard');
const searchRoutes = require('./routes/search');

const app = express();

// 中间件配置
app.use(helmet());
app.use(cors());
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
      projects: '/api/projects',
      materials: '/api/materials',
      thicknessSpecs: '/api/thickness-specs',
      drawings: '/api/drawings',
      dashboard: '/api/dashboard',
      search: '/api/search'
    }
  });
});

// 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/workers', workersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/thickness-specs', thicknessSpecsRoutes);
app.use('/api/drawings', drawingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);

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

const PORT = process.env.PORT || 35001;

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 激光切割管理系统后端服务启动成功`);
  console.log(`📡 HTTP API: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
  console.log(`📚 API文档: http://localhost:${PORT}/api`);
  
  // 测试数据库连接
  await testConnection();
});

module.exports = { app };