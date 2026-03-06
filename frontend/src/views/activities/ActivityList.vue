<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>活动管理</h1>
        <p>管理学生会各类活动和事件</p>
      </div>
      <el-button type="primary" class="add-btn" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        创建活动
      </el-button>
    </div>

    <div class="filter-card glass-card">
      <div class="filter-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索活动名称"
          prefix-icon="Search"
          clearable
          class="search-input"
          @input="handleSearch"
        />
        <el-select v-model="selectedStatus" placeholder="活动状态" clearable @change="handleSearch">
          <el-option label="全部状态" value="" />
          <el-option label="草稿" value="DRAFT">
            <div class="status-option">
              <span class="status-dot draft"></span>
              草稿
            </div>
          </el-option>
          <el-option label="未开始" value="UPCOMING">
            <div class="status-option">
              <span class="status-dot upcoming"></span>
              未开始
            </div>
          </el-option>
          <el-option label="报名中" value="REGISTERING">
            <div class="status-option">
              <span class="status-dot registering"></span>
              报名中
            </div>
          </el-option>
          <el-option label="报名截止" value="REGISTRATION_CLOSED">
            <div class="status-option">
              <span class="status-dot closed"></span>
              报名截止
            </div>
          </el-option>
          <el-option label="进行中" value="ONGOING">
            <div class="status-option">
              <span class="status-dot ongoing"></span>
              进行中
            </div>
          </el-option>
          <el-option label="已结束" value="COMPLETED">
            <div class="status-option">
              <span class="status-dot completed"></span>
              已结束
            </div>
          </el-option>
          <el-option label="已取消" value="CANCELLED">
            <div class="status-option">
              <span class="status-dot cancelled"></span>
              已取消
            </div>
          </el-option>
        </el-select>
      </div>
    </div>

    <div class="activities-grid" v-loading="loading">
      <div class="activity-card glass-card" v-for="activity in filteredActivities" :key="activity.id">
        <div class="activity-header">
          <div class="activity-status" :class="getComputedStatus(activity).class">
            <el-icon><component :is="getComputedStatus(activity).icon" /></el-icon>
            {{ getComputedStatus(activity).text }}
          </div>
          <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, activity)">
            <el-button type="primary" text circle>
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">
                  <el-icon><Edit /></el-icon>编辑
                </el-dropdown-item>
                <el-dropdown-item command="publish" v-if="activity.status === 'DRAFT'">
                  <el-icon><Promotion /></el-icon>发布
                </el-dropdown-item>
                <el-dropdown-item command="cancel" v-if="!['COMPLETED', 'CANCELLED'].includes(activity.status)">
                  <el-icon><CircleClose /></el-icon>取消活动
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <el-icon><Delete /></el-icon>删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        
        <h3 class="activity-title">{{ activity.title }}</h3>
        <p class="activity-desc">{{ activity.description || '暂无描述' }}</p>
        
        <div class="activity-timeline">
          <div class="timeline-item" v-if="activity.registrationStart">
            <div class="timeline-dot" :class="{ active: isTimeActive(activity, 'registration') }"></div>
            <div class="timeline-content">
              <span class="timeline-label">报名开始</span>
              <span class="timeline-time">{{ formatDateTime(activity.registrationStart) }}</span>
            </div>
          </div>
          <div class="timeline-item" v-if="activity.registrationEnd">
            <div class="timeline-dot" :class="{ active: isTimeActive(activity, 'registrationEnd') }"></div>
            <div class="timeline-content">
              <span class="timeline-label">报名截止</span>
              <span class="timeline-time">{{ formatDateTime(activity.registrationEnd) }}</span>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot" :class="{ active: isTimeActive(activity, 'start') }"></div>
            <div class="timeline-content">
              <span class="timeline-label">活动开始</span>
              <span class="timeline-time">{{ formatDateTime(activity.startDate) }}</span>
            </div>
          </div>
          <div class="timeline-item" v-if="activity.endDate">
            <div class="timeline-dot" :class="{ active: isTimeActive(activity, 'end') }"></div>
            <div class="timeline-content">
              <span class="timeline-label">活动结束</span>
              <span class="timeline-time">{{ formatDateTime(activity.endDate) }}</span>
            </div>
          </div>
        </div>

        <div class="activity-info">
          <div class="info-item">
            <el-icon><Location /></el-icon>
            <span>{{ activity.location || '待定' }}</span>
          </div>
          <div class="info-item">
            <el-icon><User /></el-icon>
            <span>{{ activity.participantCount || 0 }}{{ activity.maxParticipants ? '/' + activity.maxParticipants : '' }}人</span>
          </div>
          <div class="info-item credit" v-if="activity.creditEnabled">
            <el-icon><Trophy /></el-icon>
            <span>{{ activity.creditValue }}学分</span>
          </div>
        </div>

        <div class="activity-progress" v-if="getComputedStatus(activity).progress !== undefined">
          <el-progress 
            :percentage="getComputedStatus(activity).progress" 
            :stroke-width="4"
            :show-text="false"
          />
          <span class="progress-text">{{ getComputedStatus(activity).progressText }}</span>
        </div>
      </div>
    </div>

    <el-empty v-if="filteredActivities.length === 0 && !loading" description="暂无活动数据" />

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" class="modern-dialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" class="modern-form">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="活动名称" prop="title">
              <el-input v-model="formData.title" placeholder="请输入活动名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="活动描述" prop="description">
              <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入活动描述" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动开始" prop="startDate">
              <el-date-picker v-model="formData.startDate" type="datetime" placeholder="选择开始时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动结束" prop="endDate">
              <el-date-picker v-model="formData.endDate" type="datetime" placeholder="选择结束时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报名开始">
              <el-date-picker v-model="formData.registrationStart" type="datetime" placeholder="选择报名开始时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报名截止">
              <el-date-picker v-model="formData.registrationEnd" type="datetime" placeholder="选择报名截止时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动地点" prop="location">
              <el-input v-model="formData.location" placeholder="请输入活动地点" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="人数上限">
              <el-input-number v-model="formData.maxParticipants" :min="0" placeholder="不限" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="需要审核">
              <el-switch v-model="formData.requireApproval" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用学分">
              <el-switch v-model="formData.creditEnabled" />
            </el-form-item>
          </el-col>
          <template v-if="formData.creditEnabled">
            <el-col :span="12">
              <el-form-item label="学分类型">
                <el-select v-model="formData.creditType" placeholder="选择学分类型" style="width: 100%">
                  <el-option label="综合测评" value="COMPREHENSIVE" />
                  <el-option label="第二课堂" value="SECOND_CLASSROOM" />
                  <el-option label="志愿服务" value="VOLUNTEER" />
                  <el-option label="文体活动" value="SPORTS_CULTURE" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="学分值">
                <el-input-number v-model="formData.creditValue" :min="0.1" :step="0.1" :precision="1" style="width: 100%" />
              </el-form-item>
            </el-col>
          </template>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { getActivities, createActivity, updateActivity, deleteActivity } from '@/api/activities'

interface Activity {
  id: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  registrationStart?: string
  registrationEnd?: string
  location?: string
  status: string
  maxParticipants?: number
  participantCount: number
  requireApproval: boolean
  creditEnabled: boolean
  creditType?: string
  creditValue?: number
}

const loading = ref(false)
const searchKeyword = ref('')
const selectedStatus = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('创建活动')
const formRef = ref<FormInstance>()

const activityList = ref<Activity[]>([])

const formData = reactive({
  id: '',
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  registrationStart: '',
  registrationEnd: '',
  location: '',
  status: 'DRAFT',
  maxParticipants: undefined as number | undefined,
  participantCount: 0,
  requireApproval: false,
  creditEnabled: false,
  creditType: '',
  creditValue: 0.5
})

const formRules: FormRules = {
  title: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  location: [{ required: true, message: '请输入活动地点', trigger: 'blur' }]
}

const filteredActivities = computed(() => {
  let result = activityList.value
  
  if (searchKeyword.value) {
    result = result.filter(a => 
      a.title.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  if (selectedStatus.value) {
    result = result.filter(a => {
      const computed = getComputedStatus(a)
      return computed.status === selectedStatus.value
    })
  }
  
  return result
})

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getComputedStatus = (activity: Activity) => {
  const now = new Date()
  const start = activity.startDate ? new Date(activity.startDate) : null
  const end = activity.endDate ? new Date(activity.endDate) : null
  const regStart = activity.registrationStart ? new Date(activity.registrationStart) : null
  const regEnd = activity.registrationEnd ? new Date(activity.registrationEnd) : null

  if (activity.status === 'CANCELLED') {
    return { status: 'CANCELLED', text: '已取消', class: 'cancelled', icon: 'CircleClose' }
  }

  if (activity.status === 'DRAFT') {
    return { status: 'DRAFT', text: '草稿', class: 'draft', icon: 'EditPen' }
  }

  if (end && now > end) {
    return { status: 'COMPLETED', text: '已结束', class: 'completed', icon: 'CircleCheck' }
  }

  if (start && now >= start && (!end || now <= end)) {
    const progress = end ? Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100) : undefined
    return { 
      status: 'ONGOING', 
      text: '进行中', 
      class: 'ongoing', 
      icon: 'VideoPlay',
      progress,
      progressText: progress !== undefined ? `活动进度 ${progress}%` : undefined
    }
  }

  if (regEnd && now >= regEnd && start && now < start) {
    const progress = Math.round(((now.getTime() - regEnd.getTime()) / (start.getTime() - regEnd.getTime())) * 100)
    return { 
      status: 'REGISTRATION_CLOSED', 
      text: '报名截止', 
      class: 'closed', 
      icon: 'Lock',
      progress,
      progressText: `距离活动开始 ${getRemainingTime(start)}`
    }
  }

  if (regStart && regEnd && now >= regStart && now < regEnd) {
    const progress = Math.round(((now.getTime() - regStart.getTime()) / (regEnd.getTime() - regStart.getTime())) * 100)
    return { 
      status: 'REGISTERING', 
      text: '报名中', 
      class: 'registering', 
      icon: 'UserFilled',
      progress,
      progressText: `剩余 ${getRemainingTime(regEnd)} 截止`
    }
  }

  if (start && now < start) {
    return { 
      status: 'UPCOMING', 
      text: '未开始', 
      class: 'upcoming', 
      icon: 'Clock',
      progressText: `距离开始 ${getRemainingTime(start)}`
    }
  }

  return { status: 'UPCOMING', text: '未开始', class: 'upcoming', icon: 'Clock' }
}

const getRemainingTime = (targetDate: Date) => {
  const now = new Date()
  const diff = targetDate.getTime() - now.getTime()
  
  if (diff <= 0) return '已结束'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) return `${days}天${hours}小时`
  if (hours > 0) return `${hours}小时${minutes}分钟`
  return `${minutes}分钟`
}

const isTimeActive = (activity: Activity, type: string) => {
  const now = new Date()
  const start = activity.startDate ? new Date(activity.startDate) : null
  const end = activity.endDate ? new Date(activity.endDate) : null
  const regStart = activity.registrationStart ? new Date(activity.registrationStart) : null
  const regEnd = activity.registrationEnd ? new Date(activity.registrationEnd) : null

  switch (type) {
    case 'registration':
      return regStart && now >= regStart
    case 'registrationEnd':
      return regEnd && now >= regEnd
    case 'start':
      return start && now >= start
    case 'end':
      return end && now >= end
    default:
      return false
  }
}

const handleSearch = () => {
  // 筛选已通过 computed 处理
}

const handleAdd = () => {
  dialogTitle.value = '创建活动'
  Object.assign(formData, {
    id: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    registrationStart: '',
    registrationEnd: '',
    location: '',
    status: 'DRAFT',
    maxParticipants: undefined,
    participantCount: 0,
    requireApproval: false,
    creditEnabled: false,
    creditType: '',
    creditValue: 0.5
  })
  dialogVisible.value = true
}

const handleCommand = (command: string, activity: Activity) => {
  switch (command) {
    case 'edit':
      handleEdit(activity)
      break
    case 'publish':
      handlePublish(activity)
      break
    case 'cancel':
      handleCancel(activity)
      break
    case 'delete':
      handleDelete(activity)
      break
  }
}

const handleEdit = (activity: Activity) => {
  dialogTitle.value = '编辑活动'
  Object.assign(formData, activity)
  dialogVisible.value = true
}

const handlePublish = async (activity: Activity) => {
  try {
    await updateActivity(activity.id, { status: 'UPCOMING' })
    ElMessage.success('活动已发布')
    fetchActivities()
  } catch (error) {
    console.error(error)
  }
}

const handleCancel = async (activity: Activity) => {
  try {
    await ElMessageBox.confirm(`确定要取消活动 "${activity.title}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await updateActivity(activity.id, { status: 'CANCELLED' })
    ElMessage.success('活动已取消')
    fetchActivities()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (activity: Activity) => {
  try {
    await ElMessageBox.confirm(`确定要删除活动 "${activity.title}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteActivity(activity.id)
    ElMessage.success('删除成功')
    fetchActivities()
  } catch (error) {
    console.error(error)
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (formData.id) {
          await updateActivity(formData.id, formData)
          ElMessage.success('更新成功')
        } else {
          await createActivity(formData)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        fetchActivities()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const fetchActivities = async () => {
  loading.value = true
  try {
    const res = await getActivities()
    activityList.value = res.data?.list || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
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
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  padding: 16px 20px;
  margin-bottom: 24px;

  .filter-row {
    display: flex;
    gap: 16px;

    .search-input {
      width: 300px;
    }
  }
}

.status-option {
  display: flex;
  align-items: center;
  gap: 8px;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.activity-card {
  padding: 20px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }

  .activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .activity-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;

    .el-icon {
      font-size: 14px;
    }

    &.draft {
      background: rgba(156, 163, 175, 0.2);
      color: #9ca3af;
    }

    &.upcoming {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
    }

    &.registering {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }

    &.closed {
      background: rgba(249, 115, 22, 0.2);
      color: #f97316;
    }

    &.ongoing {
      background: rgba(168, 85, 247, 0.2);
      color: #a855f7;
    }

    &.completed {
      background: rgba(107, 114, 128, 0.2);
      color: #6b7280;
    }

    &.cancelled {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
  }

  .activity-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .activity-desc {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 16px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .activity-timeline {
    padding: 12px 0;
    margin-bottom: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .timeline-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 0;

      .timeline-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);

        &.active {
          background: var(--primary-color);
          box-shadow: 0 0 8px var(--primary-color);
        }
      }

      .timeline-content {
        display: flex;
        justify-content: space-between;
        flex: 1;
        font-size: 13px;

        .timeline-label {
          color: var(--text-muted);
        }

        .timeline-time {
          color: var(--text-secondary);
        }
      }
    }
  }

  .activity-info {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;

    .info-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-secondary);

      .el-icon {
        color: var(--text-muted);
      }

      &.credit {
        color: #fbbf24;

        .el-icon {
          color: #fbbf24;
        }
      }
    }
  }

  .activity-progress {
    .progress-text {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
      display: block;
    }
  }
}
</style>
