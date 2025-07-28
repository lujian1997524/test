# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
## 严格遵守
- 所有回复必须使用中文
- 所有注释必须使用中文
- 样式和 UI 尽可能使用/design-system的组件
- 每次需要 npm run dev时，执行完后立马挂起，不要一直等待
- 任何时候没有我的百分百确认开始，不要修改任何代码，永远都是讨论出结果，经过我明确的确认之后，才能进行开发和修改工作
- **严禁使用 emoji**：全站统一使用 @heroicons/react 图标库，不允许在任何代码、界面、注释中使用 emoji 表情符号
- **图标规范**：所有图标必须使用 @heroicons/react/24/outline 或 @heroicons/react/24/solid，确保视觉风格统一
- 每次需要启动前端和后端的时候，先检测端口是否被占用，如果被占用说明服务已经启动了，不需要再次启动，直接继续
- 遵守YAGNI原则
## 项目概述

这是一个激光切割生产管理系统，专为公司内部使用而设计。系统支持部门间的生产计划协作，包含项目管理、板材状态追踪、图纸管理和工人资源管理等功能。

### 核心功能
- 项目管理（增加、编辑、查看生产项目）
- 板材状态追踪（不同厚度板材的完成状态管理）
- 图纸管理（上传图纸、版本控制）
- 工人资料管理（联系方式、负责项目）
- 用户认证（简单的姓名登录系统）
- 权限管理（管理员/操作员角色区分）

### 默认用户
- **高春强** - 管理员（admin）：拥有所有功能权限
- **杨伟** - 操作员（operator）：查看项目、编辑板材状态、上传图纸

## 技术架构

### 技术栈
- **后端**: Node.js + Express.js + MySQL数据库（Docker部署）
- **前端**: Next.js + React + Electron桌面应用打包
- **状态管理**: Zustand（轻量级状态管理，替代复杂的WebSocket方案）
- **UI框架**: Tailwind CSS + iOS 18 & macOS 15 设计系统
- **数据库**: MySQL容器（端口3330）+ phpMyAdmin（端口8880）
- **开发方式**: 网页优先开发，实时预览，最后打包为桌面应用

### 端口配置
- 前端 (Next.js): `http://localhost:4000`
- 后端 API: `http://localhost:35001`
- MySQL 数据库: `localhost:3330`
- phpMyAdmin: `http://localhost:8880`

### 项目结构
```
laser-cutting-manager/
├── backend/                    # Node.js后端API
│   ├── src/
│   │   ├── controllers/        # 控制器
│   │   ├── models/            # Sequelize数据模型
│   │   ├── routes/            # API路由
│   │   ├── middleware/        # 认证、验证、错误处理中间件
│   │   └── utils/             # 工具函数
│   ├── uploads/               # 图纸文件存储
│   ├── create-sample-data.js  # 样本数据生成脚本
│   ├── fix-users.js          # 用户数据修复脚本
│   └── sync-db.js            # 数据库同步脚本
├── frontend/                   # Next.js + Electron应用
│   ├── app/                   # Next.js App Router页面
│   ├── components/            # React组件
│   │   ├── ui/               # 基础UI组件
│   │   ├── layout/           # 布局组件
│   │   └── [功能模块]/        # 按功能组织的组件
│   ├── contexts/             # React上下文
│   ├── hooks/                # 自定义React Hooks
│   ├── stores/               # Zustand状态管理
│   ├── styles/               # CSS和设计系统
│   ├── types/                # TypeScript类型定义
│   └── utils/                # 工具函数
├── shared/                    # 共享类型和常量
├── database/                  # 数据库初始化脚本和迁移
└── docker-compose.yml        # MySQL + phpMyAdmin配置
```

## 开发命令

### 环境搭建
```bash
# 启动Docker服务 (MySQL + phpMyAdmin)
docker-compose up -d

# 安装后端依赖
cd backend && npm install

# 安装前端依赖
cd frontend && npm install

# 同时运行前后端
npm run dev  # 运行两个服务

# 单独运行服务
npm run dev:backend   # 后端端口35001
npm run dev:frontend  # 前端端口4000
```

### 开发流程
```bash
# 前端开发（热重载）
cd frontend && npm run dev -- -p 4000

# 后端开发（nodemon）
cd backend && npm run dev

# 数据库管理
# 访问 phpMyAdmin: http://localhost:8880
# MySQL连接: host=localhost, port=3330, user=laser_user, password=laser_pass

# 数据库初始化和同步
cd backend && node sync-db.js        # 同步数据库结构
cd backend && node create-sample-data.js  # 创建样本数据
cd backend && node fix-users.js      # 修复用户数据
```

### 调试和测试
```bash
# 前端类型检查
cd frontend && npx tsc --noEmit

# 前端代码检查
cd frontend && npm run lint

# API测试页面
# 访问: http://localhost:4000/api-test

# 设计系统预览
# 访问: http://localhost:4000/design-system

# 后端API文档
# 访问: http://localhost:35001/api

# 后端健康检查
# 访问: http://localhost:35001/health
```

### 构建和打包
```bash
# 构建前端网页版
cd frontend && npm run build

# 构建Electron桌面应用
cd frontend && npm run build:electron

# 启动生产环境前端服务
cd frontend && npm run start

# 启动后端生产环境
cd backend && npm run start
```

## 状态管理架构

### Zustand 状态管理
系统采用 Zustand 替代了复杂的 WebSocket 方案，实现简洁高效的状态管理：

#### 核心 Store 模块
- **`projectStore.ts`** - 项目数据管理
  - 项目CRUD操作（创建、读取、更新、删除）
  - JWT认证集成，自动处理授权头
  - 响应数据解析（处理后端包装的响应格式）
  - 事件监听器支持（监听 'materials-updated' 事件）

- **`materialStore.ts`** - 材料状态管理  
  - 材料状态更新（pending → in_progress → completed → empty 循环）
  - 自动日期处理（开始时间、完成时间）
  - 与项目数据的关联管理

#### 事件驱动通信
```javascript
// 组件间通信示例
window.dispatchEvent(new CustomEvent('materials-updated'));
window.addEventListener('materials-updated', () => {
  const store = useProjectStore.getState();
  store.fetchProjects();
});
```

#### 状态同步机制
- 使用浏览器原生事件系统实现组件间状态同步
- 支持跨组件实时数据更新，无需手动刷新
- 轻量级事件模型，避免了 WebSocket 的复杂性

## 核心功能和数据模型

### 主要实体
1. **用户 (Users)** - 基于姓名的简单认证（管理员/操作员角色）
2. **工人 (Workers)** - 员工记录，包含联系信息和项目分配
3. **项目 (Projects)** - 生产项目，包含状态、优先级和工人分配
4. **厚度规格 (ThicknessSpecs)** - 可配置的板材厚度规格
5. **板材 (Materials)** - 项目板材，包含厚度和完成状态
6. **图纸 (Drawings)** - 文件上传，支持版本控制

### 关键功能
- **项目树形导航** - 侧边栏中的层级项目组织
- **动态板材表格** - 根据厚度规格生成列，水平布局显示（序号-项目名-工人-2mm-3mm-4mm...-备注-开始时间-完成时间-图纸）
- **四状态管理** - 支持空白、待处理、进行中、已完成四个状态的可视化指示器和交互式切换
- **图纸上传** - 文件管理，支持版本历史
- **实时状态同步** - 通过Zustand和自定义事件实现状态变更的实时反映

## 设计系统

### iOS 18 & macOS 15 风格
- **色彩系统**: iOS 18 系统色彩（#0A84FF蓝色，#30D158绿色等）
- **字体系统**: SF Pro Display字体系列，iOS文字大小层级
- **组件风格**: 毛玻璃拟态效果、动态岛风格、圆角设计
- **动画效果**: Framer Motion实现流畅过渡和微交互

### 组件架构
- **基础UI组件**: Button、Card、Input、StatusIndicator、StatusToggle 位于 `/components/ui/`
- **功能组件**: 按领域组织（projects、workers、materials、drawings）
- **布局组件**: MainLayout、Sidebar、Header 保证结构一致性
- **状态管理**: 使用Zustand stores（projectStore、materialStore）进行数据管理

## 开发原则

### 代码质量要求
- **简洁优先** - 在保证功能完整的前提下，保持代码简洁明了
- **逻辑清晰** - 避免过度复杂的逻辑结构，优先选择直观易懂的实现方式
- **精简设计** - 避免代码臃肿，每个组件和函数都应有明确的单一职责
- **渐进增强** - 先实现核心功能，再逐步添加高级特性
- **可维护性** - 代码应该易于理解和修改，避免过度抽象

### 开发方式

#### 网页优先策略
1. 所有功能先在浏览器中开发和测试：`http://localhost:4000`
2. 开发专用页面：`/design-system`（组件展示）、`/api-test`（API测试）
3. 实时预览和热重载，快速迭代
4. Electron打包作为最后步骤

#### API集成
- REST API，使用 `/api/` 前缀，从前端代理到后端
- Next.js配置API代理：`/api/:path*` → `http://localhost:35001/api/:path*`
- JWT认证，基于角色的访问控制
- 文件上传处理（图纸管理，存储在 `backend/uploads/drawings/`）
- 使用Zustand进行客户端状态管理，通过自定义事件实现组件间通信

#### 专用开发页面
- `/design-system` - UI组件展示和测试
- `/api-test` - API接口测试工具
- `/project-tree-demo` - 项目树形结构演示

## 数据库结构

主要表及关系：
- `users` (id, name, role) - 用户表
- `workers` (id, name, phone, email, department, position) - 工人表
- `projects` (id, name, status, priority, assigned_worker_id, created_by) - 项目表
- `thickness_specs` (id, thickness, unit, material_type, is_active, sort_order) - 厚度规格表
- `materials` (id, project_id, thickness_spec_id, status, completed_by, completed_date) - 板材表
- `drawings` (id, project_id, filename, file_path, version, uploaded_by) - 图纸表

### 数据库连接信息
- **数据库名**: laser_cutting_db
- **用户名**: laser_user
- **密码**: laser_pass
- **Root密码**: root123456

### 重要文件和配置

#### 状态管理相关文件
- **`frontend/stores/projectStore.ts`** - 项目数据的 Zustand Store
  - 支持项目 CRUD 操作，集成 JWT 认证
  - 监听 'materials-updated' 事件自动刷新数据
  - 处理后端包装响应格式 `{projects: [...]}` → `[...]`

- **`frontend/stores/materialStore.ts`** - 材料状态的 Zustand Store  
  - 处理材料状态循环：`empty → pending → in_progress → completed → empty`
  - 自动设置开始时间和完成时间
  - 集成用户认证和错误处理

#### 核心组件文件
- **`frontend/components/materials/MaterialsTable.tsx`** - 主要数据表格
  - 水平厚度列布局：序号-项目名-工人-2mm-3mm-4mm...-备注-开始时间-完成时间-图纸
  - 集成 StatusToggle 组件实现交互式状态切换
  - 支持空状态处理（删除材料记录）
  - API 集成和实时数据同步

- **`frontend/components/ui/StatusIndicator.tsx`** - 状态指示器和切换组件
  - 四状态支持：`empty | pending | in_progress | completed`
  - StatusToggle 组件提供点击切换功能
  - 视觉样式配置和动画效果（Framer Motion）
  - 循环状态切换逻辑

### 关键配置文件
- `frontend/next.config.js` - Next.js配置，包含API代理设置
- `frontend/tailwind.config.js` - Tailwind CSS配置
- `frontend/tsconfig.json` - TypeScript配置
- `docker-compose.yml` - MySQL和phpMyAdmin容器配置
- `database/init/01-create-tables.sql` - 数据库表结构定义

### 数据模型文件
- `backend/src/models/index.js` - Sequelize模型汇总和关联定义
- `backend/src/models/[Entity].js` - 各实体的Sequelize模型定义

### 认证和中间件
- `backend/src/middleware/auth.js` - JWT认证中间件
- `backend/src/middleware/validation.js` - 请求验证中间件
- `frontend/contexts/AuthContext.tsx` - 前端认证上下文

## 测试和质量保证

### 预览和测试策略
- 每个开发阶段都有专用预览URL
- 通过设计系统展示页面进行组件测试
- 通过专用测试界面进行API测试
- Electron打包前进行跨浏览器兼容性测试

### 用户角色和权限
- **管理员**（高春强）：系统完整访问权限、用户管理、厚度规格配置
- **操作员**（杨伟）：项目查看、板材状态更新、图纸上传

## 部署

### 开发环境
- Docker Compose用于本地MySQL和phpMyAdmin
- Next.js开发服务器，包含API代理
- Express服务器用于后端API

### 生产打包
- Next.js静态导出，集成Electron
- Electron builder生成Windows exe文件
- 后端部署为独立Node.js服务

## 近期更新和已解决问题

### 2025-07-24 更新记录
1. **完全弃用WebSocket** - 用户明确要求弃用WebSocket，因为"websocket 有点过于复杂了"
   - 实现了基于Zustand的轻量级状态管理方案
   - 使用浏览器原生事件系统实现组件间通信
   - 避免了WebSocket的复杂性，同时保持实时更新功能

2. **MaterialsTable 表格布局优化**
   - 用户要求的水平厚度列格式：序号-项目名-工人-2mm-3mm-4mm...-备注-开始时间-完成时间-图纸
   - 保持原有的左侧边栏 + 右侧表格布局设计
   - 集成StatusToggle组件实现交互式状态切换

3. **四状态管理系统**
   - 扩展StatusToggle支持四个状态：空白 → 待处理 → 进行中 → 已完成 → 空白（循环）
   - 空白状态会删除对应的材料记录
   - 自动处理开始时间和完成时间设置

4. **API和认证修复**
   - 修复了API路由和认证相关的401错误
   - 添加了缺失的`GET /api/materials`端点
   - 修复了API请求字段名称匹配问题（camelCase vs snake_case）
   - 处理后端包装响应格式的数据解析

### 系统当前状态
- ✅ Zustand状态管理正常工作
- ✅ MaterialsTable 四状态切换功能完全正常
- ✅ API认证和数据同步正常
- ✅ 事件驱动的实时更新机制工作正常
- ✅ 后端日志显示所有API调用成功执行
- ✅ 用户可以正常使用状态切换和数据管理功能

## 重要开发注意事项

### 用户偏好和限制
- **绝对禁止**修改用户的表格布局设计（保持左侧边栏+右侧表格）
- **严格遵循**用户指定的MaterialsTable格式要求
- **必须使用中文**进行所有回复和注释
- **状态管理**必须使用Zustand，不得重新引入WebSocket

### 关键实现细节
- StatusToggle 必须支持四状态循环切换
- 空状态处理需要删除数据库记录
- API调用必须包含正确的JWT认证头
- 事件系统用于组件间通信：`window.dispatchEvent(new CustomEvent('materials-updated'))`

## 完成的任务清单
项目目前已经完成了以下主要功能：
- ✅ 用户认证系统（基于姓名的简单登录）
- ✅ 项目管理模块（CRUD操作）
- ✅ 工人资料管理
- ✅ 四状态材料管理系统（empty → pending → in_progress → completed → empty）
- ✅ 动态厚度规格配置
- ✅ 图纸文件上传和版本控制
- ✅ 实时状态同步（Zustand + 自定义事件）
- ✅ iOS 18 & macOS 15 设计系统
- ✅ 数据库结构和关联关系
- ✅ API认证和权限控制
- ✅ Docker 容器化开发环境