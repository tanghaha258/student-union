<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>报名中心</h1>
        <p>浏览并报名参加各类活动</p>
      </div>
    </div>

    <div class="filter-card glass-card">
      <div class="filter-row">
        <el-input v-model="keyword" placeholder="搜索活动名称" prefix-icon="Search" clearable class="search-input" @input="handleSearch" />
        <el-select v-model="selectedStatus" placeholder="活动状态" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="报名中" value="OPEN" />
          <el-option label="已结束" value="CLOSED" />
          <el-option label="已取消" value="CANCELLED" />
        </el-select>
      </div>
    </div>

    <div class="activities-grid" v-loading="loading">
      <div class="activity-card glass-card" v-for="activity in activityList" :key="activity.id">
        <div class="card-header">
          <div class="status-badge" :class="getActivityStatus(activity).class">
            {{ getActivityStatus(activity).text }}
          </div>
          <h3>{{ activity.title }}</h3>
        </div>
        <p class="description">{{ activity.description || '暂无描述' }}</p>
        <div class="info-list">
          <div class="info-item">
            <el-icon><Calendar /></el-icon>
            <span>活动时间：{{ formatDate(activity.eventDate) }}</span>
          </div>
          <div class="info-item">
            <el-icon><Clock /></el-icon>
            <span>报名时间：{{ formatDate(activity.startDate) }} - {{ formatDate(activity.endDate) }}</span>
          </div>
          <div class="info-item" v-if="activity.location">
            <el-icon><Location /></el-icon>
            <span>{{ activity.location }}</span>
          </div>
          <div class="info-item">
            <el-icon><User /></el-icon>
            <span>已报名：{{ activity._count?.registrations || 0 }}{{ activity.maxParticipants ? '/' + activity.maxParticipants : '' }}人</span>
          </div>
          <div class="info-item credit-info" v-if="activity.creditEnabled">
            <el-icon><Trophy /></el-icon>
            <span class="credit-text">
              可获学分：
              <span class="credit-value">{{ activity.creditValue }}</span>
              分（{{ getCreditTypeName(activity.creditType || '') }}）
            </span>
          </div>
        </div>
        <div class="card-footer">
          <el-button type="primary" text size="small" @click="handleViewDetail(activity)">
            <el-icon><View /></el-icon>
            详情
          </el-button>
          <el-button v-if="activity.registrations?.length" type="success" disabled>
            <el-icon><Check /></el-icon>
            已报名
          </el-button>
          <el-button v-else-if="getActivityStatus(activity).status !== 'OPEN'" type="info" disabled>
            {{ getActivityStatus(activity).status === 'CLOSED' ? '已结束' : 
               getActivityStatus(activity).status === 'CANCELLED' ? '已取消' : '即将开始' }}
          </el-button>
          <el-button v-else type="primary" @click="handleRegister(activity)">
            <el-icon><Plus /></el-icon>
            立即报名
          </el-button>
        </div>
      </div>
      <el-empty v-if="!loading && activityList.length === 0" description="暂无可报名的活动" />
    </div>

    <div class="pagination-wrapper" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="fetchActivities"
        @size-change="fetchActivities"
      />
    </div>

    <el-dialog v-model="registerDialogVisible" title="活动报名" width="450px" class="modern-dialog">
      <div class="register-info">
        <h4>{{ currentActivity?.title }}</h4>
        <p>{{ currentActivity?.description }}</p>
      </div>
      <el-form ref="registerFormRef" :model="registerForm" label-width="80px">
        <el-form-item label="备注">
          <el-input v-model="registerForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="registerDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="registering" @click="submitRegistration">确认报名</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="活动详情" width="600px" class="modern-dialog">
      <div class="activity-detail" v-if="currentActivity">
        <div class="detail-header">
          <h3>{{ currentActivity.title }}</h3>
          <el-tag :type="getActivityStatus(currentActivity).status === 'OPEN' ? 'success' : 'info'" effect="dark">
            {{ getActivityStatus(currentActivity).text }}
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
          <div class="detail-item" v-if="currentActivity.requireApproval">
            <span class="label">审核方式</span>
            <span class="value"><el-tag type="warning" size="small">需要审核</el-tag></span>
          </div>
          <div class="detail-item" v-if="currentActivity.creditEnabled">
            <span class="label">学分奖励</span>
            <span class="value credit-value">
              <el-icon><Trophy /></el-icon>
              {{ currentActivity.creditValue }}分（{{ getCreditTypeName(currentActivity.creditType || '') }}）
            </span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button 
          v-if="!currentActivity?.registrations?.length && getActivityStatus(currentActivity!).status === 'OPEN'" 
          type="primary" 
          @click="handleRegister(currentActivity!)"
        >
          立即报名
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRegistrationActivities, createRegistration } from '@/api/registration'
import type { RegistrationActivity } from '@/api/registration'

const loading = ref(false)
const registering = ref(false)
const keyword = ref('')
const selectedStatus = ref('')
const registerDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentActivity = ref<RegistrationActivity | null>(null)

const activityList = ref<RegistrationActivity[]>([])
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

const registerForm = reactive({
  remark: ''
})

const getActivityStatus = (activity: RegistrationActivity) => {
  const now = new Date()
  const startDate = new Date(activity.startDate)
  const endDate = new Date(activity.endDate)
  
  if (activity.status === 'CANCELLED') return { status: 'CANCELLED', text: '已取消', class: 'cancelled' }
  if (now < startDate) return { status: 'UPCOMING', text: '即将开始', class: 'upcoming' }
  if (now > endDate) return { status: 'CLOSED', text: '已结束', class: 'closed' }
  return { status: 'OPEN', text: '报名中', class: 'open' }
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    OPEN: 'open',
    CLOSED: 'closed',
    CANCELLED: 'cancelled',
    UPCOMING: 'upcoming'
  }
  return map[status] || ''
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    OPEN: '报名中',
    CLOSED: '已结束',
    CANCELLED: '已取消',
    UPCOMING: '即将开始'
  }
  return map[status] || status
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
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

const fetchActivities = async () => {
  loading.value = true
  try {
    const res = await getRegistrationActivities({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
      status: selectedStatus.value
    })
    activityList.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    ElMessage.error('获取活动列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchActivities()
}

const handleRegister = (activity: RegistrationActivity) => {
  currentActivity.value = activity
  registerForm.remark = ''
  registerDialogVisible.value = true
}

const handleViewDetail = (activity: RegistrationActivity) => {
  currentActivity.value = activity
  detailDialogVisible.value = true
}

const submitRegistration = async () => {
  if (!currentActivity.value) return
  registering.value = true
  try {
    await createRegistration({
      activityId: currentActivity.value.id,
      remark: registerForm.remark
    })
    ElMessage.success('报名成功')
    registerDialogVisible.value = false
    fetchActivities()
  } catch (error: any) {
    console.error(error)
    const message = error.response?.data?.message || '报名失败'
    ElMessage.error(message)
  } finally {
    registering.value = false
  }
}

onMounted(() => {
  fetchActivities()
})
</script>

<style scoped lang="scss">
.page-wrapper {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;

  .header-info {
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 6px;
    }

    p {
      font-size: 14px;
      color: var(--text-secondary);
    }
  }
}

.filter-card {
  padding: 20px;
  margin-bottom: 24px;

  .filter-row {
    display: flex;
    gap: 16px;

    .search-input {
      width: 300px;
    }

    .el-select {
      width: 150px;
    }
  }
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  min-height: 300px;
}

.activity-card {
  padding: 24px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;

    .status-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;

      &.open {
        background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
        color: white;
      }

      &.closed {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-muted);
      }

      &.cancelled {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
      }

      &.upcoming {
        background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
        color: white;
      }
    }

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      flex: 1;
      line-height: 1.4;
    }
  }

  .description {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 16px;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .info-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-muted);

      .el-icon {
        color: var(--primary-light);
      }

      &.credit-info {
        .credit-text {
          color: #fbbf24;
        }

        .credit-value {
          font-weight: 700;
          font-size: 15px;
        }
      }
    }
  }

  .card-footer {
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.register-info {
  margin-bottom: 20px;

  h4 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: var(--text-secondary);
  }
}

.activity-detail {
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }
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
