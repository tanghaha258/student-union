# 学生会信息管理系统 - 项目指南

## 📁 项目结构

```
学生会信息管理系统/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── routes/            # API路由
│   │   ├── middlewares/       # 中间件
│   │   ├── app.ts            # Express应用
│   │   └── server.ts         # 服务入口
│   ├── prisma/               # 数据库模型
│   │   └── schema.prisma     # Prisma schema
│   ├── package.json
│   └── .env                  # 环境变量
├── frontend/                  # 前端应用
│   ├── src/
│   │   ├── views/            # 页面组件
│   │   ├── components/       # 公共组件
│   │   ├── api/              # API接口
│   │   ├── stores/           # Pinia状态管理
│   │   ├── router/           # 路由配置
│   │   └── styles/           # 全局样式
│   ├── package.json
│   └── vite.config.ts
└── PROJECT_GUIDE.md          # 本文件
```

## 🚀 快速启动

### 方式一：分别启动（推荐开发使用）

**1. 启动后端服务**
```bash
cd backend
npm run dev
```
- 服务地址：http://localhost:3000
- API文档：http://localhost:3000/api

**2. 启动前端服务**
```bash
cd frontend
npm run dev
```
- 访问地址：http://localhost:5173

### 方式二：同时启动（需要安装 concurrently）

在项目根目录创建 `start-dev.js`：

```javascript
const { spawn } = require('child_process');

const backend = spawn('npm', ['run', 'dev'], { cwd: './backend', shell: true });
const frontend = spawn('npm', ['run', 'dev'], { cwd: './frontend', shell: true });

backend.stdout.on('data', (data) => {
  console.log(`[Backend] ${data}`);
});

frontend.stdout.on('data', (data) => {
  console.log(`[Frontend] ${data}`);
});

console.log('🚀 正在启动前后端服务...');
console.log('📦 后端: http://localhost:3000');
console.log('💻 前端: http://localhost:5173');
```

运行：
```bash
node start-dev.js
```

## 📦 依赖安装

### 后端依赖
```bash
cd backend
npm install
```

**主要依赖：**
- express - Web框架
- @prisma/client - ORM
- bcryptjs - 密码加密
- jsonwebtoken - JWT认证
- cors - 跨域处理
- xlsx - Excel导出

### 前端依赖
```bash
cd frontend
npm install
```

**主要依赖：**
- vue - 前端框架
- vue-router - 路由
- pinia - 状态管理
- element-plus - UI组件库
- axios - HTTP请求
- @element-plus/icons-vue - 图标

## 🗄️ 数据库设置

### 1. 配置数据库连接
编辑 `backend/.env`：
```env
DATABASE_URL="mysql://用户名:密码@localhost:3306/student_council"
JWT_SECRET="your-secret-key"
PORT=3000
```

### 2. 初始化数据库
```bash
cd backend
npx prisma db push
npx prisma db seed
```

### 3. 查看数据库（可选）
```bash
npx prisma studio
```

## 🔧 环境要求

- **Node.js**: >= 18.0.0
- **MySQL**: >= 8.0
- **npm**: >= 9.0.0

## 📋 常用命令

### 后端命令
```bash
cd backend

# 开发模式
npm run dev

# 生产构建
npm run build
npm start

# 数据库操作
npx prisma db push          # 同步数据库
npx prisma db seed          # 填充初始数据
npx prisma studio           # 打开数据库管理界面
npx prisma generate         # 生成客户端
```

### 前端命令
```bash
cd frontend

# 开发模式
npm run dev

# 生产构建
npm run build

# 代码检查
npm run lint
```

## 🔑 默认账号

系统初始化时会创建以下账号：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 超级管理员 | admin | admin123 |
| 学生会主席 | president | president123 |
| 成员 | member | member123 |

## 🌐 系统功能

### 管理端
- 用户管理
- 部门管理
- 活动管理
- 报名管理
- 学分管理
- 评优管理
- 通知管理
- 招新活动

### 学生端
- 首页统计
- 报名中心
- 我的报名
- 学分中心
- 成员展示
- 通知中心
- 个人中心

## 🐛 常见问题

### 1. 端口被占用
修改 `.env` 中的 `PORT` 或前端 `vite.config.ts` 中的端口配置。

### 2. 数据库连接失败
- 检查 MySQL 服务是否启动
- 检查 `.env` 中的数据库连接字符串
- 确保数据库已创建

### 3. 依赖安装失败
```bash
# 清除缓存后重试
npm cache clean --force
rm -rf node_modules
npm install
```

## 📞 技术支持

如有问题，请查看：
- 后端日志：`backend/` 目录下的控制台输出
- 前端日志：浏览器开发者工具 Console
- 网络请求：浏览器开发者工具 Network

## 📝 更新日志

### 最新功能
- ✅ 数据导出（Excel）
- ✅ 通知已读回执
- ✅ 移动端适配
- ✅ 主题切换（深色/浅色）
- ✅ 成员展示模块
- ✅ 活动状态智能计算
- ✅ 学分自动发放
