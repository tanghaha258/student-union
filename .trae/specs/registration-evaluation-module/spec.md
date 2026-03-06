# 报名模块 & 评优模块 产品需求文档 (PRD)

## 1. 模块概述

### 1.1 报名模块
提供活动报名功能，支持学生在线报名参加学生会组织的各类活动。

### 1.2 评优模块
提供评优评先功能，支持优秀学生、优秀干部等评选活动的创建、报名、评审和结果公示。

---

## 2. 报名模块详细设计

### 2.1 功能列表

| 功能 | 说明 | 权限 |
|------|------|------|
| 活动报名列表 | 展示可报名的活动 | 所有用户 |
| 活动报名 | 填写信息报名活动 | 所有用户 |
| 我的报名 | 查看已报名的活动 | 所有用户 |
| 报名管理 | 管理活动报名人员 | 管理员/部长 |
| 报名审核 | 审核报名申请 | 管理员/部长 |
| 导出名单 | 导出报名人员名单 | 管理员/部长 |

### 2.2 数据库设计

```prisma
model RegistrationActivity {
  id          String   @id @default(uuid())
  title       String
  description String?
  startDate   DateTime // 报名开始时间
  endDate     DateTime // 报名结束时间
  eventDate   DateTime // 活动日期
  location    String?
  maxParticipants Int? // 最大报名人数
  status      String   @default("OPEN") // OPEN, CLOSED, CANCELLED
  requireApproval Boolean @default(false) // 是否需要审核
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  organizer   User?    @relation(fields: [organizerId], references: [id])
  organizerId String?
  registrations Registration[]
  
  @@map("registration_activities")
}

model Registration {
  id          String   @id @default(uuid())
  status      String   @default("PENDING") // PENDING, APPROVED, REJECTED, CANCELLED
  remark      String?  // 备注/留言
  reviewedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  activity    RegistrationActivity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  activityId  String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  reviewer    User?    @relation("RegistrationReviewer", fields: [reviewerId], references: [id])
  reviewerId  String?
  
  @@unique([activityId, userId])
  @@map("registrations")
}
```

### 2.3 API接口设计

#### 报名活动管理
- `GET /api/registration-activities` - 获取报名活动列表
- `GET /api/registration-activities/:id` - 获取活动详情
- `POST /api/registration-activities` - 创建报名活动 (ADMIN/MINISTER)
- `PUT /api/registration-activities/:id` - 更新活动 (ADMIN/MINISTER)
- `DELETE /api/registration-activities/:id` - 删除活动 (ADMIN)

#### 报名管理
- `POST /api/registrations` - 提交报名
- `GET /api/registrations/my` - 获取我的报名
- `GET /api/registrations/activity/:activityId` - 获取活动报名列表 (ADMIN/MINISTER)
- `PUT /api/registrations/:id/review` - 审核报名 (ADMIN/MINISTER)
- `DELETE /api/registrations/:id` - 取消报名

### 2.4 页面设计

#### 报名中心 (RegistrationCenter.vue)
- 展示进行中的报名活动卡片
- 每个卡片显示：活动名称、时间、地点、已报名人数/上限、报名按钮
- 支持按状态筛选：进行中、即将开始、已结束

#### 我的报名 (MyRegistrations.vue)
- 列表展示已报名的活动
- 显示报名状态：待审核、已通过、已拒绝、已取消
- 支持取消报名

#### 报名管理 (RegistrationManage.vue)
- 管理员/部长查看所有报名活动
- 查看每个活动的报名人员名单
- 审核报名申请
- 导出报名名单Excel

---

## 3. 评优模块详细设计

### 3.1 功能列表

| 功能 | 说明 | 权限 |
|------|------|------|
| 评优活动列表 | 展示评优活动 | 所有用户 |
| 申请评优 | 提交评优申请 | 所有用户 |
| 我的申请 | 查看评优申请状态 | 所有用户 |
| 评优管理 | 创建/管理评优活动 | 管理员 |
| 评审管理 | 评审申请/打分 | 评审员 |
| 结果公示 | 展示评优结果 | 所有用户 |

### 3.2 数据库设计

```prisma
model EvaluationActivity {
  id          String   @id @default(uuid())
  title       String   // 评优名称：如"优秀学生干部评选"
  description String?
  type        String   // 类型：EXCELLENT_STUDENT, EXCELLENT_CADRE, etc.
  startDate   DateTime // 申请开始
  endDate     DateTime // 申请截止
  reviewStartDate DateTime // 评审开始
  reviewEndDate   DateTime // 评审结束
  announceDate DateTime // 结果公示日期
  status      String   @default("DRAFT") // DRAFT, OPEN, REVIEWING, ANNOUNCED, CLOSED
  criteria    String?  // 评选标准
  maxAwards   Int      // 获奖名额
  requireMaterial Boolean @default(true) // 是否需要提交材料
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  organizer   User?    @relation(fields: [organizerId], references: [id])
  organizerId String?
  applications EvaluationApplication[]
  reviewers   EvaluationReviewer[]
  
  @@map("evaluation_activities")
}

model EvaluationReviewer {
  id          String   @id @default(uuid())
  
  activity    EvaluationActivity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  activityId  String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  
  @@unique([activityId, userId])
  @@map("evaluation_reviewers")
}

model EvaluationApplication {
  id          String   @id @default(uuid())
  status      String   @default("PENDING") // PENDING, REVIEWING, APPROVED, REJECTED
  materials   String?  // 申请材料JSON
  selfEvaluation String? // 自我评价
  totalScore  Float?   // 总分
  rank        Int?     // 排名
  remark      String?  // 备注
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  activity    EvaluationActivity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  activityId  String
  applicant   User     @relation(fields: [applicantId], references: [id], onDelete: Cascade)
  applicantId String
  reviews     EvaluationReview[]
  
  @@map("evaluation_applications")
}

model EvaluationReview {
  id          String   @id @default(uuid())
  score       Float    // 评分
  comment     String?  // 评语
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  application EvaluationApplication @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  applicationId String
  reviewer    User     @relation(fields: [reviewerId], references: [id], onDelete: Cascade)
  reviewerId  String
  
  @@unique([applicationId, reviewerId])
  @@map("evaluation_reviews")
}
```

### 3.3 API接口设计

#### 评优活动管理
- `GET /api/evaluation-activities` - 获取评优活动列表
- `GET /api/evaluation-activities/:id` - 获取活动详情
- `POST /api/evaluation-activities` - 创建评优活动 (ADMIN)
- `PUT /api/evaluation-activities/:id` - 更新活动 (ADMIN)
- `DELETE /api/evaluation-activities/:id` - 删除活动 (ADMIN)

#### 评审员管理
- `POST /api/evaluation-activities/:id/reviewers` - 添加评审员 (ADMIN)
- `DELETE /api/evaluation-activities/:id/reviewers/:userId` - 移除评审员 (ADMIN)

#### 评优申请
- `POST /api/evaluation-applications` - 提交申请
- `GET /api/evaluation-applications/my` - 获取我的申请
- `GET /api/evaluation-applications/activity/:activityId` - 获取活动申请列表
- `PUT /api/evaluation-applications/:id` - 修改申请

#### 评审管理
- `POST /api/evaluation-reviews` - 提交评审
- `GET /api/evaluation-reviews/my` - 获取我的评审任务
- `PUT /api/evaluation-reviews/:id` - 修改评审

### 3.4 页面设计

#### 评优中心 (EvaluationCenter.vue)
- 展示进行中的评优活动
- 卡片显示：评优名称、类型、申请时间、状态、申请按钮
- 结果公示区

#### 我的评优申请 (MyEvaluations.vue)
- 列表展示申请记录
- 显示状态、得分、排名

#### 评优管理 (EvaluationManage.vue)
- 管理员创建/编辑评优活动
- 设置评审员
- 管理申请
- 发布结果

#### 评审中心 (ReviewCenter.vue)
- 评审员查看待评审的申请
- 评分、写评语
- 查看已评审的申请

---

## 4. 权限设计

| 功能 | 超级管理员 | 主席/副主席 | 部长 | 成员 |
|------|-----------|------------|------|------|
| 创建报名活动 | ✓ | ✓ | ✓ | - |
| 审核报名 | ✓ | ✓ | ✓(本部门) | - |
| 导出名单 | ✓ | ✓ | ✓ | - |
| 创建评优活动 | ✓ | ✓ | - | - |
| 指定评审员 | ✓ | ✓ | - | - |
| 评审打分 | ✓ | ✓ | ✓(被指定) | - |
| 报名活动 | ✓ | ✓ | ✓ | ✓ |
| 申请评优 | ✓ | ✓ | ✓ | ✓ |

---

## 5. 界面风格

保持与系统整体一致的毛玻璃设计风格：
- 半透明卡片背景
- 圆角设计 (16px)
- 渐变色彩
- 毛玻璃模糊效果
