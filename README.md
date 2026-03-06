# 学生会信息管理系统

一个现代化的学生会信息管理系统，支持角色权限管理、部门管理、活动管理、公告管理等功能。

## 技术栈

### 前端
- Vue 3 + TypeScript
- Vite
- Element Plus
- Vue Router
- Pinia
- Axios

### 后端
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT 认证

### 部署
- GitHub Actions (CI/CD)
- GitHub Pages (前端托管)
- GitHub Container Registry (后端镜像)
- Docker

## 项目结构

```
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── api/            # API 请求
│   │   ├── components/     # 公共组件
│   │   ├── router/         # 路由配置
│   │   ├── stores/         # 状态管理
│   │   ├── styles/         # 样式文件
│   │   └── views/          # 页面组件
│   └── package.json
│
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── middlewares/    # 中间件
│   │   └── routes/         # 路由
│   ├── prisma/
│   │   └── schema.prisma   # 数据库模型
│   └── package.json
│
└── .github/
    └── workflows/          # GitHub Actions 工作流
```

## 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 14+
- npm 或 yarn

### 本地开发

1. 克隆项目
```bash
git clone https://github.com/your-username/student-council-system.git
cd student-council-system
```

2. 安装后端依赖
```bash
cd backend
npm install
cp .env.example .env
# 编辑 .env 文件配置数据库连接
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

3. 安装前端依赖
```bash
cd ../frontend
npm install
npm run dev
```

4. 访问系统
- 前端: http://localhost:5173
- 后端 API: http://localhost:3000/api

### 测试账号
- admin / 123456 (超级管理员)
- president / 123456 (学生会主席)
- zhangsan / 123456 (部长)
- lisi / 123456 (成员)

## Docker 部署

```bash
docker-compose up -d
```

## GitHub 部署

1. Fork 本项目到你的 GitHub 账号
2. 在 Settings > Secrets 中配置以下密钥：
   - `JWT_SECRET`: JWT 密钥
   - `DATABASE_URL`: 数据库连接字符串
   - `VITE_API_BASE_URL`: 前端 API 地址（可选）
   - `CUSTOM_DOMAIN`: 自定义域名（可选）

3. 推送代码到 main 分支，GitHub Actions 会自动部署：
   - 前端部署到 GitHub Pages
   - 后端镜像推送到 GitHub Container Registry

## 功能特性

- ✅ 用户认证（登录/注册/登出）
- ✅ 角色权限管理（RBAC）
- ✅ 部门管理
- ✅ 成员管理
- ✅ 活动管理
- ✅ 公告管理
- ✅ 个人中心
- ✅ 响应式设计

## 许可证

MIT License
