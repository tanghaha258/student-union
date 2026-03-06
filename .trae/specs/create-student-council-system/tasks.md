# Tasks

## Phase 1: 项目初始化与基础架构
- [ ] Task 1: 创建项目目录结构
  - [ ] SubTask 1.1: 创建前端项目目录
  - [ ] SubTask 1.2: 创建后端项目目录
  - [ ] SubTask 1.3: 创建部署配置目录
  - [ ] SubTask 1.4: 初始化 Git 仓库

- [ ] Task 2: 初始化前端项目
  - [ ] SubTask 2.1: 使用Vite创建Vue3+TypeScript项目
  - [ ] SubTask 2.2: 安装Element Plus组件库
  - [ ] SubTask 2.3: 配置Vue Router路由
  - [ ] SubTask 2.4: 配置Pinia状态管理
  - [ ] SubTask 2.5: 配置Axios请求封装

- [ ] Task 3: 初始化后端项目
  - [ ] SubTask 3.1: 创建Node.js项目并安装依赖
  - [ ] SubTask 3.2: 配置Express服务器
  - [ ] SubTask 3.3: 配置数据库连接
  - [ ] SubTask 3.4: 配置Redis缓存（可选）
  - [ ] SubTask 3.5: 配置JWT认证中间件

## Phase 2: 数据库设计与实现
- [ ] Task 4: 设计并创建数据库表结构
  - [ ] SubTask 4.1: 创建用户相关表（users, roles, user_roles）
  - [ ] SubTask 4.2: 创建部门相关表（departments, members）
  - [ ] SubTask 4.3: 创建活动相关表（activities, activity_registrations）
  - [ ] SubTask 4.4: 创建公告和文件表（announcements, files）
  - [ ] SubTask 4.5: 创建日志表（operation_logs）

- [ ] Task 5: 创建数据库迁移脚本和种子数据
  - [ ] SubTask 5.1: 编写数据库迁移脚本
  - [ ] SubTask 5.2: 创建初始角色和权限数据
  - [ ] SubTask 5.3: 创建测试用户数据

## Phase 3: 后端核心功能开发
- [ ] Task 6: 实现用户认证模块
  - [ ] SubTask 6.1: 实现用户登录接口
  - [ ] SubTask 6.2: 实现用户注册接口
  - [ ] SubTask 6.3: 实现密码加密和验证
  - [ ] SubTask 6.4: 实现Token生成和验证
  - [ ] SubTask 6.5: 实现密码找回功能

- [ ] Task 7: 实现角色权限模块
  - [ ] SubTask 7.1: 创建角色管理接口（CRUD）
  - [ ] SubTask 7.2: 创建权限管理接口
  - [ ] SubTask 7.3: 实现权限验证中间件
  - [ ] SubTask 7.4: 实现用户角色分配接口

- [ ] Task 8: 实现部门管理模块
  - [ ] SubTask 8.1: 创建部门CRUD接口
  - [ ] SubTask 8.2: 实现部门树形结构查询
  - [ ] SubTask 8.3: 实现部门成员管理接口

- [ ] Task 9: 实现成员管理模块
  - [ ] SubTask 9.1: 创建成员CRUD接口
  - [ ] SubTask 9.2: 实现成员信息查询（分页、筛选）
  - [ ] SubTask 9.3: 实现成员导入导出功能

- [ ] Task 10: 实现活动管理模块
  - [ ] SubTask 10.1: 创建活动CRUD接口
  - [ ] SubTask 10.2: 实现活动报名接口
  - [ ] SubTask 10.3: 实现活动签到接口
  - [ ] SubTask 10.4: 实现活动统计接口

- [ ] Task 11: 实现通知公告模块
  - [ ] SubTask 11.1: 创建公告CRUD接口
  - [ ] SubTask 11.2: 实现公告发布和推送
  - [ ] SubTask 11.3: 实现公告阅读状态追踪

- [ ] Task 12: 实现文件管理模块
  - [ ] SubTask 12.1: 实现文件上传接口
  - [ ] SubTask 12.2: 实现文件下载接口
  - [ ] SubTask 12.3: 实现文件分类管理

- [ ] Task 13: 实现数据统计模块
  - [ ] SubTask 13.1: 实现成员统计接口
  - [ ] SubTask 13.2: 实现活动统计接口
  - [ ] SubTask 13.3: 实现部门绩效统计接口

## Phase 4: 前端核心功能开发
- [ ] Task 14: 实现登录注册页面
  - [ ] SubTask 14.1: 创建登录页面组件
  - [ ] SubTask 14.2: 创建注册页面组件
  - [ ] SubTask 14.3: 实现登录状态持久化
  - [ ] SubTask 14.4: 实现路由守卫

- [ ] Task 15: 实现主布局和导航
  - [ ] SubTask 15.1: 创建主布局组件
  - [ ] SubTask 15.2: 创建侧边栏导航组件
  - [ ] SubTask 15.3: 创建顶部导航栏组件
  - [ ] SubTask 15.4: 实现动态菜单渲染

- [ ] Task 16: 实现用户管理页面
  - [ ] SubTask 16.1: 创建用户列表页面
  - [ ] SubTask 16.2: 创建用户详情页面
  - [ ] SubTask 16.3: 创建用户编辑弹窗

- [ ] Task 17: 实现角色权限管理页面
  - [ ] SubTask 17.1: 创建角色列表页面
  - [ ] SubTask 17.2: 创建角色编辑页面
  - [ ] SubTask 17.3: 创建权限配置组件

- [ ] Task 18: 实现部门管理页面
  - [ ] SubTask 18.1: 创建部门树形展示页面
  - [ ] SubTask 18.2: 创建部门编辑弹窗
  - [ ] SubTask 18.3: 创建部门成员管理页面

- [ ] Task 19: 实现成员管理页面
  - [ ] SubTask 19.1: 创建成员列表页面
  - [ ] SubTask 19.2: 创建成员详情页面
  - [ ] SubTask 19.3: 创建成员编辑弹窗
  - [ ] SubTask 19.4: 实现成员导入导出功能

- [ ] Task 20: 实现活动管理页面
  - [ ] SubTask 20.1: 创建活动列表页面
  - [ ] SubTask 20.2: 创建活动详情页面
  - [ ] SubTask 20.3: 创建活动创建/编辑页面
  - [ ] SubTask 20.4: 创建活动报名管理页面

- [ ] Task 21: 实现通知公告页面
  - [ ] SubTask 21.1: 创建公告列表页面
  - [ ] SubTask 21.2: 创建公告详情页面
  - [ ] SubTask 21.3: 创建公告发布页面

- [ ] Task 22: 实现数据统计页面
  - [ ] SubTask 22.1: 创建统计概览页面
  - [ ] SubTask 22.2: 创建图表组件
  - [ ] SubTask 22.3: 实现数据可视化

- [ ] Task 23: 实现个人中心页面
  - [ ] SubTask 23.1: 创建个人信息页面
  - [ ] SubTask 23.2: 创建密码修改页面
  - [ ] SubTask 23.3: 创建头像上传功能

## Phase 5: GitHub 部署配置
- [ ] Task 24: Docker容器化配置
  - [ ] SubTask 24.1: 创建后端Dockerfile
  - [ ] SubTask 24.2: 创建docker-compose.yml（用于本地开发）
  - [ ] SubTask 24.3: 创建.dockerignore文件

- [ ] Task 25: GitHub Actions CI配置
  - [ ] SubTask 25.1: 创建前端CI工作流（lint、build、test）
  - [ ] SubTask 25.2: 创建后端CI工作流（lint、test）
  - [ ] SubTask 25.3: 配置PR自动检查

- [ ] Task 26: GitHub Pages 前端部署
  - [ ] SubTask 26.1: 创建前端部署工作流
  - [ ] SubTask 26.2: 配置Vite构建输出路径
  - [ ] SubTask 26.3: 配置自定义域名（可选）

- [ ] Task 27: GitHub Container Registry 后端部署
  - [ ] SubTask 27.1: 创建后端Docker镜像构建工作流
  - [ ] SubTask 27.2: 配置镜像推送到ghcr.io
  - [ ] SubTask 27.3: 创建部署到云服务器的工作流（可选）

- [ ] Task 28: GitHub Secrets 配置
  - [ ] SubTask 28.1: 配置数据库连接密钥
  - [ ] SubTask 28.2: 配置JWT密钥
  - [ ] SubTask 28.3: 配置其他环境变量

## Phase 6: 测试与优化
- [ ] Task 29: 编写测试用例
  - [ ] SubTask 29.1: 编写后端单元测试
  - [ ] SubTask 29.2: 编写前端组件测试
  - [ ] SubTask 29.3: 编写E2E测试

- [ ] Task 30: 性能优化
  - [ ] SubTask 30.1: 前端性能优化（懒加载、缓存）
  - [ ] SubTask 30.2: 后端性能优化（查询优化、缓存）
  - [ ] SubTask 30.3: 数据库索引优化

---

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 3]
- [Task 5] depends on [Task 4]
- [Task 6] depends on [Task 3]
- [Task 7] depends on [Task 6]
- [Task 8] depends on [Task 7]
- [Task 9] depends on [Task 8]
- [Task 10] depends on [Task 7]
- [Task 11] depends on [Task 7]
- [Task 12] depends on [Task 7]
- [Task 13] depends on [Task 9, Task 10]
- [Task 14] depends on [Task 2, Task 6]
- [Task 15] depends on [Task 14]
- [Task 16] depends on [Task 15, Task 6]
- [Task 17] depends on [Task 15, Task 7]
- [Task 18] depends on [Task 15, Task 8]
- [Task 19] depends on [Task 15, Task 9]
- [Task 20] depends on [Task 15, Task 10]
- [Task 21] depends on [Task 15, Task 11]
- [Task 22] depends on [Task 15, Task 13]
- [Task 23] depends on [Task 15]
- [Task 24] depends on [Task 3]
- [Task 25] depends on [Task 2, Task 3]
- [Task 26] depends on [Task 2, Task 25]
- [Task 27] depends on [Task 24, Task 25]
- [Task 28] depends on [Task 26, Task 27]
- [Task 29] depends on [Task 6-13, Task 14-23]
- [Task 30] depends on [Task 29]
