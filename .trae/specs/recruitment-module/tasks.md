# 招新活动管理模块 开发任务

## 后端开发

- [ ] 1. 更新数据库Schema添加新状态字段
  - 添加 INTERVIEW, HIRED, FAILED 状态支持
  
- [ ] 2. 开发招新活动管理API
  - GET /api/recruitments - 获取招新活动列表
  - POST /api/recruitments - 创建招新活动
  - POST /api/recruitments/:id - 更新招新活动
  - POST /api/recruitments/:id/delete - 删除招新活动
  - POST /api/recruitments/:id/publish - 发布招新活动
  - POST /api/recruitments/:id/close - 结束招新活动
  - GET /api/recruitments/:id/stats - 获取统计数据

- [ ] 3. 开发报名管理API
  - GET /api/recruitments/:id/applications - 获取报名列表
  - GET /api/recruitments/applications/:id - 获取报名详情
  - POST /api/recruitments/applications/:id/status - 更新报名状态
  - POST /api/recruitments/applications/batch - 批量更新状态
  - POST /api/recruitments/applications/:id/interview - 安排面试

## 前端开发

- [ ] 4. 创建招新活动管理页面
  - RecruitmentActivityList.vue - 招新活动列表
  - RecruitmentActivityForm.vue - 招新活动表单（创建/编辑）

- [ ] 5. 创建报名管理页面
  - RecruitmentApplicationManage.vue - 报名管理
  - ApplicationDetailDialog.vue - 报名详情弹窗
  - InterviewArrangeDialog.vue - 面试安排弹窗

- [ ] 6. 更新路由和菜单
  - 添加招新活动管理路由
  - 在侧边栏添加菜单项

- [ ] 7. 更新API文件
  - 添加新的API接口调用

## 测试

- [ ] 8. 功能测试
  - 创建招新活动
  - 编辑招新活动
  - 报名审核流程
  - 面试安排
  - 数据导出
