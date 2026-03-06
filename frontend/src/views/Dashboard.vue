<template>
  <div class="dashboard-container">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-text">
        <h1>欢迎回来，{{ userStore.userInfo?.realName || userStore.username }}！</h1>
        <p>今天是 {{ currentDate }}，{{ isManager ? '祝您工作愉快！' : '祝您学习进步！' }}</p>
      </div>
      <div class="quick-actions">
        <template v-if="isManager">
          <el-button type="primary" @click="router.push('/activities')">
            <el-icon><Calendar /></el-icon>
            创建活动
          </el-button>
          <el-button @click="router.push('/announcements')">
            <el-icon><Bell /></el-icon>
            发布公告
          </el-button>
        </template>
        <template v-else>
          <el-button type="primary" @click="router.push('/registration-center')">
            <el-icon><EditPen /></el-icon>
            活动报名
          </el-button>
          <el-button @click="router.push('/credit-center')">
            <el-icon><Trophy /></el-icon>
            我的学分
          </el-button>
        </template>
      </div>
    </div>

    <!-- 管理员统计卡片 -->
    <template v-if="isManager">
      <div class="stats-grid">
        <div class="stat-card glass-card clickable" v-for="stat in adminStats" :key="stat.key" @click="handleStatClick(stat.key)">
          <div class="stat-icon" :style="{ background: stat.gradient }">
            <el-icon><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- 学生端统计卡片 -->
    <template v-else>
      <div class="student-stats-grid">
        <div class="student-stat-card glass-card clickable" @click="router.push('/credit-center')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <el-icon><Trophy /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ studentStats.totalCredit.toFixed(1) }}</div>
            <div class="stat-label">总学分</div>
          </div>
        </div>
        <div class="student-stat-card glass-card clickable" @click="router.push('/my-registrations')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <el-icon><EditPen /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ studentStats.registrationCount }}</div>
            <div class="stat-label">已报名活动</div>
          </div>
        </div>
        <div class="student-stat-card glass-card clickable" @click="router.push('/notifications-center')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <el-icon><Bell /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ studentStats.unreadNotifications }}</div>
            <div class="stat-label">未读通知</div>
          </div>
        </div>
        <div class="student-stat-card glass-card clickable" @click="router.push('/credit-center')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
            <el-icon><Medal /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ studentStats.evaluationLevel || '-' }}</div>
            <div class="stat-label">最新评优</div>
          </div>
        </div>
      </div>
    </template>

    <!-- 内容区域 -->
    <div class="content-grid">
      <!-- 近期活动 -->
      <div class="content-card glass-card activities-card">
        <div class="card-header">
          <h3>{{ isManager ? '近期活动' : '可报名活动' }}</h3>
          <el-button type="primary" text @click="router.push(isManager ? '/activities' : '/registration-center')">
            查看全部
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="card-content">
          <div class="activity-list" v-if="activities.length > 0">
            <div class="activity-item clickable" v-for="activity in activities" :key="activity.id" @click="handleActivityClick(activity)">
              <div class="activity-date">
                <span class="day">{{ formatDay(activity.startDate || activity.eventDate) }}</span>
                <span class="month">{{ formatMonth(activity.startDate || activity.eventDate) }}</span>
              </div>
              <div class="activity-info">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-meta">
                  <span v-if="activity.location"><el-icon><Location /></el-icon> {{ activity.location }}</span>
                  <span><el-icon><User /></el-icon> {{ activity.participantCount || activity._count?.registrations || 0 }}人</span>
                </div>
              </div>
              <div class="activity-action">
                <template v-if="!isManager">
                  <el-button type="primary" size="small" @click.stop="router.push('/registration-center')">
                    报名
                  </el-button>
                </template>
                <template v-else>
                  <el-tag :type="getStatusType(activity.status)" size="small">
                    {{ getStatusText(activity.status) }}
                  </el-tag>
                </template>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无活动" />
        </div>
      </div>

      <!-- 公告/通知 -->
      <div class="content-card glass-card">
        <div class="card-header">
          <h3>{{ isManager ? '最新公告' : '最新通知' }}</h3>
          <el-button type="primary" text @click="router.push(isManager ? '/announcements' : '/notifications-center')">
            查看全部
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="card-content">
          <div class="announcement-list" v-if="announcements.length > 0">
            <div class="announcement-item" v-for="item in announcements" :key="item.id" @click="handleViewAnnouncement(item)">
              <div class="announcement-priority" :class="'priority-' + (item.priority || 1)"></div>
              <div class="announcement-content">
                <div class="announcement-title">{{ item.title }}</div>
                <div class="announcement-date">{{ formatDate(item.createdAt) }}</div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无通知" />
        </div>
      </div>

      <!-- 管理员：部门概览 -->
      <div class="content-card glass-card departments-card" v-if="isManager">
        <div class="card-header">
          <h3>部门概览</h3>
          <el-button type="primary" text @click="router.push('/departments')">
            查看全部
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="card-content">
          <div class="department-list">
            <div class="department-item clickable" v-for="dept in departments" :key="dept.id" @click="router.push('/members')">
              <div class="dept-avatar">{{ dept.name.charAt(0) }}</div>
              <div class="dept-info">
                <div class="dept-name">{{ dept.name }}</div>
                <div class="dept-count">{{ dept.memberCount || 0 }} 名成员</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学生端：我的学分明细 -->
      <div class="content-card glass-card" v-if="!isManager">
        <div class="card-header">
          <h3>学分明细</h3>
          <el-button type="primary" text @click="router.push('/credit-center')">
            查看全部
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="card-content">
          <div class="credit-list" v-if="creditRecords.length > 0">
            <div class="credit-item clickable" v-for="record in creditRecords" :key="record.id" @click="router.push('/credit-center')">
              <div class="credit-icon" :class="getCreditTypeClass(record.type)">
                <el-icon><Trophy /></el-icon>
              </div>
              <div class="credit-info">
                <div class="credit-title">{{ record.description || record.activity?.title || '学分奖励' }}</div>
                <div class="credit-type">{{ getCreditTypeName(record.type) }}</div>
              </div>
              <div class="credit-value">+{{ record.value }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无学分记录" />
        </div>
      </div>
    </div>

    <!-- 公告详情弹窗 -->
    <el-dialog 
      v-model="announcementDialogVisible" 
      :title="currentAnnouncement?.title"
      width="600px"
      class="modern-dialog"
      append-to-body
    >
      <div class="announcement-detail" v-if="currentAnnouncement">
        <div class="detail-meta">
          <el-tag 
            :type="currentAnnouncement.priority === 3 || currentAnnouncement.priority === 1 ? 'danger' : currentAnnouncement.priority === 2 ? 'warning' : 'info'"
            effect="dark"
            size="small"
          >
            {{ currentAnnouncement.priority === 3 || currentAnnouncement.priority === 1 ? '紧急' : currentAnnouncement.priority === 2 ? '重要' : '普通' }}
          </el-tag>
          <span class="detail-time">{{ formatDateTime(currentAnnouncement.createdAt) }}</span>
        </div>
        <el-divider />
        <div class="detail-content">{{ currentAnnouncement.content }}</div>
      </div>
      <template #footer>
        <el-button type="primary" @click="announcementDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 活动详情弹窗 -->
    <el-dialog 
      v-model="activityDialogVisible" 
      :title="currentActivity?.title"
      width="600px"
      class="modern-dialog"
      append-to-body
    >
      <div class="activity-detail" v-if="currentActivity">
        <div class="detail-header">
          <el-tag :type="getStatusType(currentActivity.status)" effect="dark">
            {{ getStatusText(currentActivity.status) }}
          </el-tag>
        </div>
        <el-divider />
        <div class="detail-section">
          <div class="detail-item">
            <span class="label">活动描述</span>
            <span class="value">{{ currentActivity.description || '暂无描述' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">活动时间</span>
            <span class="value">{{ formatDateTime(currentActivity.eventDate) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">报名时间</span>
            <span class="value">{{ formatDateTime(currentActivity.startDate) }} 至 {{ formatDateTime(currentActivity.endDate) }}</span>
          </div>
          <div class="detail-item" v-if="currentActivity.location">
            <span class="label">活动地点</span>
            <span class="value">{{ currentActivity.location }}</span>
          </div>
          <div class="detail-item">
            <span class="label">报名人数</span>
            <span class="value">{{ currentActivity._count?.registrations || 0 }}{{ currentActivity.maxParticipants ? '/' + currentActivity.maxParticipants : '' }}人</span>
          </div>
          <div class="detail-item" v-if="currentActivity.creditEnabled">
            <span class="label">学分奖励</span>
            <span class="value credit-value">
              <el-icon><Trophy /></el-icon>
              {{ currentActivity.creditValue }}分
            </span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="activityDialogVisible = false">关闭</el-button>
        <el-button 
          v-if="!isManager && getStatusType(currentActivity.status) === 'success'" 
          type="primary" 
          @click="router.push('/registration-center')"
        >
          立即报名
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getDashboardStats, getRecentActivities, getRecentAnnouncements, getDepartmentStats } from '@/api/dashboard'
import { getMyCredits } from '@/api/credit'
import { getMyRegistrations, getRegistrationActivities } from '@/api/registration'
import { getNotifications } from '@/api/notification'

const router = useRouter()
const userStore = useUserStore()

const isTopAdmin = computed(() => ['ADMIN', 'PRESIDENT'].includes(userStore.role || ''))
const isManager = computed(() => ['ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'].includes(userStore.role || ''))

const currentDate = computed(() => {
  const now = new Date()
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`
})

// 管理员统计数据
const adminStats = reactive([
  { key: 'users', label: '用户总数', value: 0, icon: 'User', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { key: 'departments', label: '部门数量', value: 0, icon: 'OfficeBuilding', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { key: 'activities', label: '活动数量', value: 0, icon: 'Calendar', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { key: 'announcements', label: '公告数量', value: 0, icon: 'Bell', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
])

// 学生端统计数据
const studentStats = reactive({
  totalCredit: 0,
  registrationCount: 0,
  unreadNotifications: 0,
  evaluationLevel: ''
})

const activities = ref<any[]>([])
const announcements = ref<any[]>([])
const departments = ref<any[]>([])
const creditRecords = ref<any[]>([])

const announcementDialogVisible = ref(false)
const activityDialogVisible = ref(false)
const currentAnnouncement = ref<any>(null)
const currentActivity = ref<any>(null)

const formatDay = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.getDate()
}

const formatMonth = (dateStr: string) => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const date = new Date(dateStr)
  return months[date.getMonth()]
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'info',
    UPCOMING: 'primary',
    REGISTERING: 'success',
    REGISTRATION_CLOSED: 'warning',
    ONGOING: 'success',
    COMPLETED: '',
    CANCELLED: 'danger',
    PLANNING: 'info',
    OPEN: 'success',
    CLOSED: 'info'
  }
  return map[status] || ''
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    UPCOMING: '未开始',
    REGISTERING: '报名中',
    REGISTRATION_CLOSED: '报名截止',
    ONGOING: '进行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    PLANNING: '计划中',
    OPEN: '报名中',
    CLOSED: '已结束'
  }
  return map[status] || status
}

const getCreditTypeClass = (type: string) => {
  const map: Record<string, string> = {
    COMPREHENSIVE: 'type-primary',
    SECOND_CLASSROOM: 'type-success',
    VOLUNTEER: 'type-warning',
    SPORTS_CULTURE: 'type-info'
  }
  return map[type] || ''
}

const getCreditTypeName = (type: string) => {
  const map: Record<string, string> = {
    COMPREHENSIVE: '综合测评',
    SECOND_CLASSROOM: '第二课堂',
    VOLUNTEER: '志愿服务',
    SPORTS_CULTURE: '文体活动'
  }
  return map[type] || type
}

const handleViewAnnouncement = (item: any) => {
  currentAnnouncement.value = item
  announcementDialogVisible.value = true
}

const handleActivityClick = (activity: any) => {
  if (isManager.value) {
    router.push('/activities')
  } else {
    currentActivity.value = activity
    activityDialogVisible.value = true
  }
}

const handleStatClick = (key: string) => {
  const routeMap: Record<string, string> = {
    users: '/users',
    departments: '/departments',
    activities: '/activities',
    announcements: '/announcements'
  }
  if (routeMap[key]) {
    router.push(routeMap[key])
  }
}

const fetchAdminData = async () => {
  try {
    const [statsRes, activitiesRes, announcementsRes, departmentsRes] = await Promise.all([
      getDashboardStats(),
      getRecentActivities(5),
      getRecentAnnouncements(5),
      getDepartmentStats()
    ])
    
    if (statsRes.data) {
      adminStats[0].value = statsRes.data.userCount
      adminStats[1].value = statsRes.data.departmentCount
      adminStats[2].value = statsRes.data.activityCount
      adminStats[3].value = statsRes.data.announcementCount
    }
    
    activities.value = activitiesRes.data || []
    announcements.value = announcementsRes.data || []
    departments.value = departmentsRes.data || []
  } catch (error) {
    console.error('Failed to fetch admin data:', error)
  }
}

const fetchStudentData = async () => {
  try {
    const [creditRes, registrationRes, notificationRes, activityRes] = await Promise.all([
      getMyCredits(),
      getMyRegistrations({ page: 1, pageSize: 100 }),
      getNotifications(),
      getRegistrationActivities({ page: 1, pageSize: 5, status: 'OPEN' })
    ])
    
    studentStats.totalCredit = creditRes.data?.totalCredits || 0
    studentStats.registrationCount = (registrationRes.data?.list || []).filter((r: any) => r.status === 'APPROVED').length
    studentStats.unreadNotifications = (notificationRes.data || []).filter((n: any) => !n.isRead).length
    creditRecords.value = (creditRes.data?.records || []).slice(0, 5)
    activities.value = (activityRes.data?.list || []).map((a: any) => ({
      ...a,
      startDate: a.startDate,
      eventDate: a.eventDate,
      participantCount: a._count?.registrations || 0
    }))
    announcements.value = (notificationRes.data || []).slice(0, 5)
  } catch (error) {
    console.error('Failed to fetch student data:', error)
  }
}

onMounted(() => {
  if (isManager.value) {
    fetchAdminData()
  } else {
    fetchStudentData()
  }
})
</script>

<style scoped lang="scss">
.dashboard-container {
  padding: 0;
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 32px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255, 255, 255, 0.1);

  .welcome-text {
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    p {
      font-size: 15px;
      color: var(--text-secondary);
    }
  }

  .quick-actions {
    display: flex;
    gap: 12px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.student-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card, .student-stat-card {
  display: flex;
  align-items: center;
  padding: 24px;

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    flex-shrink: 0;

    .el-icon {
      font-size: 28px;
      color: white;
    }
  }

  .stat-info {
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .stat-label {
      font-size: 14px;
      color: var(--text-secondary);
      margin-top: 4px;
    }
  }
}

.clickable {
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.content-card {
  padding: 0;
  overflow: hidden;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .card-content {
    padding: 16px;
    max-height: 320px;
    overflow-y: auto;
  }
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .activity-date {
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    flex-shrink: 0;

    .day {
      font-size: 20px;
      font-weight: 700;
      color: white;
      line-height: 1;
    }

    .month {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .activity-info {
    flex: 1;

    .activity-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 6px;
    }

    .activity-meta {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: var(--text-muted);

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}

.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.announcement-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .announcement-priority {
    width: 4px;
    height: 36px;
    border-radius: 2px;
    margin-right: 14px;

    &.priority-3, &.priority-1 {
      background: linear-gradient(180deg, #ef4444 0%, #f97316 100%);
    }

    &.priority-2 {
      background: linear-gradient(180deg, #f59e0b 0%, #eab308 100%);
    }
  }

  .announcement-content {
    flex: 1;

    .announcement-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .announcement-date {
      font-size: 12px;
      color: var(--text-muted);
    }
  }
}

.department-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.department-item {
  display: flex;
  align-items: center;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);

  .dept-avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    color: white;
    margin-right: 12px;
  }

  .dept-info {
    .dept-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .dept-count {
      font-size: 12px;
      color: var(--text-muted);
    }
  }
}

.credit-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.credit-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);

  .credit-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;

    .el-icon {
      font-size: 18px;
      color: white;
    }

    &.type-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    &.type-success { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
    &.type-warning { background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%); }
    &.type-info { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
  }

  .credit-info {
    flex: 1;

    .credit-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .credit-type {
      font-size: 12px;
      color: var(--text-muted);
    }
  }

  .credit-value {
    font-size: 16px;
    font-weight: 600;
    color: #10b981;
  }
}

.announcement-detail, .activity-detail {
  .detail-meta {
    display: flex;
    align-items: center;
    gap: 12px;

    .detail-time {
      font-size: 14px;
      color: var(--text-muted);
    }
  }

  .detail-content {
    font-size: 15px;
    line-height: 1.8;
    color: var(--text-primary);
    white-space: pre-wrap;
  }

  .detail-section {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .detail-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      .label {
        width: 80px;
        flex-shrink: 0;
        font-size: 14px;
        color: var(--text-muted);
      }

      .value {
        font-size: 14px;
        color: var(--text-primary);

        &.credit-value {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #fbbf24;
          font-weight: 600;
        }
      }
    }
  }
}
</style>
