# 云服务器和Electron应用部署配置指南

## 概述

本文档详细说明如何将激光切割生产管理系统部署到腾讯云服务器，并配置Electron桌面应用以连接云端服务。

## 1. 云服务器部署配置

### 1.1 服务器环境准备

```bash
# 腾讯云服务器基础配置
- 操作系统: Ubuntu 20.04 LTS 或 CentOS 8
- 内存: 2GB以上
- 存储: 20GB以上
- 网络: 带宽5Mbps以上

# 安装Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装MySQL 8.0
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# 安装PM2进程管理器
sudo npm install -g pm2
```

### 1.2 后端服务器配置

```bash
# 1. 上传后端代码到服务器
scp -r ./backend user@your-server-ip:/home/user/laser-cutting-backend

# 2. 配置环境变量
cd /home/user/laser-cutting-backend
cp .env.example .env

# 编辑.env文件
vim .env
```

**生产环境.env配置：**
```bash
# 服务器配置
PORT=35001
NODE_ENV=production

# 数据库配置（云服务器内网）
DB_HOST=localhost
DB_PORT=3306
DB_NAME=laser_cutting_db
DB_USER=laser_user
DB_PASSWORD=your_secure_password

# JWT配置
JWT_SECRET=your_very_secure_jwt_secret_key_2024
JWT_EXPIRES_IN=24h

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf,application/dwg,application/dxf
```

### 1.3 网络和防火墙配置

```bash
# 腾讯云安全组配置
开放端口:
- 22 (SSH)
- 80 (HTTP) 
- 443 (HTTPS)
- 35001 (后端API)
- 4000 (前端服务，如需要)

# 服务器防火墙配置
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 35001
sudo ufw enable
```

### 1.4 启动后端服务

```bash
# 安装依赖
cd /home/user/laser-cutting-backend
npm install --production

# 数据库初始化
node sync-db.js
node create-sample-data.js

# 使用PM2启动服务
pm2 start src/app.js --name "laser-cutting-api"
pm2 startup
pm2 save

# 查看服务状态
pm2 status
pm2 logs laser-cutting-api
```

## 2. Electron应用配置

### 2.1 环境配置文件

**frontend/.env.production（生产环境）：**
```bash
# 云服务器API地址
NEXT_PUBLIC_API_BASE_URL=http://your-server-ip:35001
NEXT_PUBLIC_SERVER_URL=http://your-server-ip:35001
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_SSE_ENDPOINT=/api/sse/connect

# 如果使用域名和SSL证书
# NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
# NEXT_PUBLIC_SERVER_URL=https://api.yourdomain.com
```

### 2.2 SSE连接配置更新

**utils/sseManager.ts 修改：**
```typescript
private getSSEUrl(token: string): string {
  // 生产环境：直接连接到云服务器
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'false') {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:35001';
    return `${serverUrl}/api/sse/connect?token=${encodeURIComponent(token)}`;
  }
  
  // 开发环境：根据hostname判断
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:35001/api/sse/connect?token=${encodeURIComponent(token)}`;
    }
  }
  
  // 默认使用Next.js代理
  return `/api/sse/connect?token=${encodeURIComponent(token)}`;
}
```

### 2.3 API请求配置更新

**需要更新所有API请求，支持生产环境：**
```typescript
// utils/apiClient.ts (新建)
const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'false') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:35001';
  }
  
  // 开发环境使用代理
  return '';
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};
```

### 2.4 Electron应用打包

```bash
# 构建生产版本
cd frontend
npm run build

# 打包Electron应用
npm run build:electron

# 生成的exe文件位置
# dist/激光切割生产管理系统-1.0.0.exe
```

## 3. 多台电脑连接配置

### 3.1 客户端网络配置

每台电脑上的Electron应用会自动连接到云服务器：

```
电脑A: 安装exe应用 -> 连接到云服务器
电脑B: 安装exe应用 -> 连接到云服务器  
电脑C: 安装exe应用 -> 连接到云服务器
...
```

### 3.2 用户认证和SSE连接

```typescript
// 每台电脑的应用启动时：
1. 用户选择姓名登录 -> 获取JWT token
2. 建立SSE连接到云服务器 -> 接收实时通知
3. 所有操作通过API同步到云端 -> 触发SSE广播
4. 其他电脑收到实时更新 -> 界面自动刷新
```

## 4. SSL证书配置（推荐）

### 4.1 申请免费SSL证书

```bash
# 使用Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d api.yourdomain.com

# 配置nginx反向代理
sudo apt install nginx
```

**nginx配置文件：**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:35001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # SSE特殊配置
    location /api/sse/ {
        proxy_pass http://localhost:35001;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 5. 部署检查清单

### 5.1 服务器端检查

- [ ] Node.js和MySQL正确安装
- [ ] 后端服务成功启动（PM2管理）
- [ ] 数据库连接正常
- [ ] 防火墙端口开放
- [ ] SSL证书配置（可选）

### 5.2 客户端检查

- [ ] 环境变量正确配置
- [ ] API连接测试通过
- [ ] SSE连接建立成功
- [ ] 实时通知功能正常
- [ ] exe应用成功打包

### 5.3 功能测试

- [ ] 多台电脑同时登录不同用户
- [ ] 项目创建实时同步
- [ ] 项目状态变更实时通知
- [ ] 通知弹窗正常显示
- [ ] 网络断开自动重连

## 6. 故障排除

### 6.1 常见问题

**连接超时：**
```bash
# 检查防火墙
sudo ufw status
# 检查服务状态
pm2 status
# 检查端口占用
netstat -tlnp | grep 35001
```

**SSE连接失败：**
```bash
# 检查CORS配置
# 确保后端允许客户端IP
# 检查SSL证书（如使用HTTPS）
```

**数据库连接错误：**
```bash
# 检查MySQL服务
sudo systemctl status mysql
# 检查数据库权限
mysql -u laser_user -p laser_cutting_db
```

### 6.2 监控和日志

```bash
# 查看后端日志
pm2 logs laser-cutting-api

# 查看系统资源
pm2 monit

# 设置日志轮转
pm2 install pm2-logrotate
```

## 7. 注意事项

1. **安全性**：生产环境必须使用强密码和JWT密钥
2. **备份**：定期备份数据库和上传文件
3. **更新**：保持服务器和依赖包更新
4. **监控**：设置服务监控和告警
5. **文档**：记录服务器配置和部署过程

---

**部署完成后，所有客户端电脑都可以通过安装exe应用来连接云端服务，实现真正的多用户实时协作！**