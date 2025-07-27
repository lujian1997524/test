// 后端环境配置管理模块
// 统一管理所有服务器配置

const path = require('path');
require('dotenv').config();

/**
 * 服务器配置
 */
const getServerConfig = () => {
  return {
    // 服务器地址和端口
    HOST: process.env.BACKEND_HOST || '192.168.31.134',
    PORT: parseInt(process.env.PORT || '35001'),
    
    // 前端地址（用于CORS配置）
    FRONTEND_HOST: process.env.FRONTEND_HOST || '192.168.31.134',
    FRONTEND_PORT: process.env.FRONTEND_PORT || '4000',
    
    // 环境
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // 完整URL
    get BACKEND_URL() {
      return `http://${this.HOST}:${this.PORT}`;
    },
    
    get FRONTEND_URL() {
      return `http://${this.FRONTEND_HOST}:${this.FRONTEND_PORT}`;
    }
  };
};

/**
 * 数据库配置
 */
const getDatabaseConfig = () => {
  return {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: parseInt(process.env.DB_PORT || '3330'),
    DATABASE: process.env.DB_NAME || 'laser_cutting_db',
    USERNAME: process.env.DB_USER || 'laser_user',
    PASSWORD: process.env.DB_PASSWORD || 'laser_pass',
    
    // 完整连接URL
    get CONNECTION_URL() {
      return `mysql://${this.USERNAME}:${this.PASSWORD}@${this.HOST}:${this.PORT}/${this.DATABASE}`;
    }
  };
};

/**
 * CORS配置 - 允许的源地址
 */
const getAllowedOrigins = () => {
  const serverConfig = getServerConfig();
  
  const origins = [
    serverConfig.FRONTEND_URL,  // 主前端地址
    'http://localhost:4000',    // 本地开发
    'http://127.0.0.1:4000',    // 本地开发
  ];
  
  // 如果有自定义CORS源，添加到列表中
  if (process.env.CORS_ORIGINS) {
    const customOrigins = process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
    origins.push(...customOrigins);
  }
  
  return origins;
};

/**
 * JWT配置
 */
const getJWTConfig = () => {
  return {
    SECRET: process.env.JWT_SECRET || 'laser_cutting_jwt_secret_key_2024',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h'
  };
};

/**
 * 文件上传配置
 */
const getUploadConfig = () => {
  return {
    MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'), // 10MB
    ALLOWED_TYPES: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,application/pdf,application/dwg,application/dxf').split(','),
    UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads'
  };
};

/**
 * 获取完整配置对象
 */
const getConfig = () => {
  const server = getServerConfig();
  const database = getDatabaseConfig();
  
  return {
    server,
    database,
    jwt: getJWTConfig(),
    upload: getUploadConfig(),
    cors: {
      origins: getAllowedOrigins()
    },
    
    // 便捷访问常用配置
    isDevelopment: server.NODE_ENV === 'development',
    isProduction: server.NODE_ENV === 'production',
  };
};

/**
 * 打印配置信息（开发环境）
 */
const logConfig = () => {
  const config = getConfig();
  
  if (config.isDevelopment) {
    console.log('🔧 后端配置信息:');
    console.log(`📡 服务器地址: ${config.server.BACKEND_URL}`);
    console.log(`🌐 前端地址: ${config.server.FRONTEND_URL}`);
    console.log(`🗄️ 数据库: ${config.database.HOST}:${config.database.PORT}/${config.database.DATABASE}`);
    console.log(`✅ 允许的CORS源: ${config.cors.origins.join(', ')}`);
    console.log(`📂 上传路径: ${config.upload.UPLOAD_PATH}`);
  }
};

module.exports = {
  getConfig,
  getServerConfig,
  getDatabaseConfig,
  getAllowedOrigins,
  getJWTConfig,
  getUploadConfig,
  logConfig
};