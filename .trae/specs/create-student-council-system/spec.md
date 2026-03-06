# 学生会信息管理系统 Spec

## Why
学生会需要一个现代化的信息管理系统来高效管理成员信息、活动组织、权限分配等日常事务，替代传统的人工管理方式，提高工作效率和信息透明度。

## What Changes
- 创建完整的前后端分离架构的学生会管理系统
- 实现基于角色的权限控制系统（RBAC）
- 提供精美的用户界面和流畅的用户体验
- **使用 GitHub 生态进行部署上线**

## Impact
- 新建前端项目（Vue 3 + TypeScript）
- 新建后端项目（Node.js + Express）
- 新建数据库设计
- 新建 GitHub 部署配置

---

## ADDED Requirements

### Requirement: 用户认证系统
系统应提供完整的用户认证功能，包括登录、注册、密码找回等功能。

#### Scenario: 用户登录成功
- **WHEN** 用户输入正确的用户名和密码
- **THEN** 系统验证成功并跳转到主页

#### Scenario: 用户登录失败
- **WHEN** 用户输入错误的用户名或密码
- **THEN** 系统显示错误提示，不允许登录

### Requirement: 角色管理系统
系统应支持多种角色类型，包括但不限于：
- 超级管理员（系统最高权限）
- 学生会主席（管理所有部门）
- 部门部长（管理本部门）
- 部门成员（基础权限）
- 普通用户（仅查看公开信息）

#### Scenario: 角色分配
- **WHEN** 管理员为用户分配角色
- **THEN** 用户获得对应角色的权限

### Requirement: 权限控制系统
系统应实现细粒度的权限控制，支持：
- 菜单权限（控制可见菜单）
- 操作权限（控制增删改查操作）
- 数据权限（控制数据访问范围）

#### Scenario: 权限验证
- **WHEN** 用户尝试访问某功能
- **THEN** 系统检查用户权限，允许或拒绝访问

### Requirement: 成员管理模块
系统应提供学生会成员的完整生命周期管理：
- 成员信息录入
- 成员信息修改
- 成员离职/换届管理
- 成员档案查询

#### Scenario: 添加新成员
- **WHEN** 管理员填写成员信息并提交
- **THEN** 系统创建新成员记录并分配默认角色

### Requirement: 部门管理模块
系统应支持学生会组织架构管理：
- 部门创建与删除
- 部门信息维护
- 部门成员分配

### Requirement: 活动管理模块
系统应提供活动全流程管理：
- 活动创建与发布
- 活动报名管理
- 活动签到功能
- 活动总结与归档

### Requirement: 通知公告模块
系统应支持信息发布功能：
- 公告发布
- 公告推送
- 公告阅读状态追踪

### Requirement: 文件管理模块
系统应提供文件管理功能：
- 文件上传
- 文件分类存储
- 文件下载
- 文件权限控制

### Requirement: 数据统计模块
系统应提供数据可视化功能：
- 成员统计
- 活动统计
- 部门绩效统计

### Requirement: 前端界面
前端应具有现代化的用户界面：
- 响应式设计，支持多端访问
- 精美的UI组件
- 流畅的动画效果
- 良好的用户体验

### Requirement: 后端API
后端应提供RESTful API：
- 统一的API响应格式
- 完善的错误处理
- JWT身份认证
- API文档

### Requirement: GitHub 部署方案
系统应使用 GitHub 生态进行部署：

#### 前端部署
- 使用 **GitHub Pages** 部署前端静态资源
- 使用 **GitHub Actions** 自动构建和部署
- 支持自定义域名配置

#### 后端部署
- 使用 **GitHub Actions** 构建 Docker 镜像
- 推送镜像到 **GitHub Container Registry (ghcr.io)**
- 支持部署到云服务器或容器服务

#### CI/CD 流程
- 代码推送到 main 分支自动触发部署
- Pull Request 自动运行测试
- 自动化构建、测试、部署流程

#### Scenario: 前端自动部署
- **WHEN** 代码推送到 main 分支
- **THEN** GitHub Actions 自动构建前端并部署到 GitHub Pages

#### Scenario: 后端自动部署
- **WHEN** 代码推送到 main 分支
- **THEN** GitHub Actions 构建后端 Docker 镜像并推送到 ghcr.io

---

## 技术选型

### 前端技术栈
- 框架：Vue 3 + TypeScript
- UI组件库：Element Plus
- 状态管理：Pinia
- 路由：Vue Router
- HTTP客户端：Axios
- 构建工具：Vite

### 后端技术栈
- 框架：Node.js + Express
- 数据库：MySQL / PostgreSQL（可使用云数据库服务）
- 缓存：Redis（可选）
- 认证：JWT
- ORM：Prisma

### GitHub 部署技术
- CI/CD：GitHub Actions
- 前端托管：GitHub Pages
- 容器镜像：GitHub Container Registry (ghcr.io)
- 环境变量：GitHub Secrets

---

## 数据库设计概要

### 用户表 (users)
- id, username, password, email, phone, avatar, status, created_at, updated_at

### 角色表 (roles)
- id, name, code, description, permissions, created_at

### 用户角色关联表 (user_roles)
- id, user_id, role_id

### 部门表 (departments)
- id, name, description, parent_id, leader_id, created_at

### 成员表 (members)
- id, user_id, department_id, position, join_date, status

### 活动表 (activities)
- id, title, description, start_time, end_time, location, status, creator_id

### 活动报名表 (activity_registrations)
- id, activity_id, user_id, status, registered_at

### 公告表 (announcements)
- id, title, content, author_id, status, publish_time

### 文件表 (files)
- id, name, path, size, type, uploader_id, created_at

### 操作日志表 (operation_logs)
- id, user_id, action, target, details, ip, created_at
