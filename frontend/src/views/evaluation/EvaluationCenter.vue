<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>评优中心</h1>
        <p>申请各类评优评先荣誉</p>
      </div>
    </div>

    <div class="filter-card glass-card">
      <div class="filter-row">
        <el-select v-model="selectedType" placeholder="评优类型" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="优秀学生干部" value="EXCELLENT_CADRE" />
          <el-option label="优秀学生" value="EXCELLENT_STUDENT" />
          <el-option label="优秀团员" value="EXCELLENT_MEMBER" />
          <el-option label="先进个人" value="ADVANCED_INDIVIDUAL" />
        </el-select>
        <el-select v-model="selectedStatus" placeholder="活动状态" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="申请中" value="OPEN" />
          <el-option label="评审中" value="REVIEWING" />
          <el-option label="已公示" value="ANNOUNCED" />
        </el-select>
      </div>
    </div>

    <div class="activities-grid" v-loading="loading">
      <div class="activity-card glass-card" v-for="activity in activityList" :key="activity.id">
        <div class="card-header">
          <div class="type-badge" :class="activity.type">
            {{ getTypeText(activity.type) }}
          </div>
          <div class="status-badge" :class="activity.status">
            {{ getStatusText(activity.status) }}
          </div>
        </div>
        <h3 class="title">{{ activity.title }}</h3>
        <p class="description">{{ activity.description || '暂无描述' }}</p>
        <div class="info-list">
          <div class="info-item">
            <el-icon><Calendar /></el-icon>
            <span>申请截止：{{ formatDate(activity.endDate) }}</span>
          </div>
          <div class="info-item">
            <el-icon><Trophy /></el-icon>
            <span>获奖名额：{{ activity.maxAwards }}人</span>
          </div>
          <div class="info-item">
            <el-icon><User /></el-icon>
            <span>已申请：{{ activity._count?.applications || 0 }}人</span>
          </div>
        </div>
        <div class="card-footer">
          <el-button v-if="activity.status === 'OPEN'" type="primary" @click="handleApply(activity)">
            <el-icon><EditPen /></el-icon>
            立即申请
          </el-button>
          <el-button v-else-if="activity.status === 'ANNOUNCED'" type="success" @click="handleViewResults(activity)">
            <el-icon><View /></el-icon>
            查看结果
          </el-button>
          <el-button v-else type="info" disabled>
            {{ activity.status === 'REVIEWING' ? '评审中' : '未开始' }}
          </el-button>
        </div>
      </div>
      <el-empty v-if="!loading && activityList.length === 0" description="暂无评优活动" />
    </div>

    <div class="pagination-wrapper" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="fetchActivities"
      />
    </div>

    <!-- 申请弹窗 -->
    <el-dialog v-model="applyDialogVisible" title="提交申请" width="600px" class="modern-dialog">
      <div class="apply-info">
        <h4>{{ currentActivity?.title }}</h4>
        <p class="criteria" v-if="currentActivity?.criteria">{{ currentActivity.criteria }}</p>
      </div>
      <el-form ref="applyFormRef" :model="applyForm" :rules="applyRules" label-width="100px">
        <el-form-item label="自我评价" prop="selfEvaluation">
          <el-input v-model="applyForm.selfEvaluation" type="textarea" :rows="5" placeholder="请详细描述您的表现和成就" />
        </el-form-item>
        <el-form-item label="申请材料">
          <el-input v-model="applyForm.materials" type="textarea" :rows="3" placeholder="请列出相关证明材料（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="applying" @click="submitApplication">提交申请</el-button>
      </template>
    </el-dialog>

    <!-- 结果公示弹窗 -->
    <el-dialog v-model="resultsDialogVisible" title="评优结果" width="700px" class="modern-dialog">
      <el-table :data="results" v-loading="resultsLoading">
        <el-table-column type="index" label="排名" width="60" />
        <el-table-column label="姓名" min-width="120">
          <template #default="{ row }">
            {{ row.applicant?.nickname || row.applicant?.username }}
          </template>
        </el-table-column>
        <el-table-column prop="applicant.className" label="班级" width="120" />
        <el-table-column label="得分" width="100">
          <template #default="{ row }">
            <span class="score">{{ row.totalScore?.toFixed(1) || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.rank <= (currentActivity?.maxAwards || 0)" type="success" size="small">获奖</el-tag>
            <el-tag v-else type="info" size="small">未获奖</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getEvaluationActivities, createEvaluationApplication, getActivityApplications } from '@/api/evaluation'
import type { EvaluationActivity, EvaluationApplication } from '@/api/evaluation'

const loading = ref(false)
const applying = ref(false)
const resultsLoading = ref(false)
const selectedType = ref('')
const selectedStatus = ref('')
const applyDialogVisible = ref(false)
const resultsDialogVisible = ref(false)
const currentActivity = ref<EvaluationActivity | null>(null)

const activityList = ref<EvaluationActivity[]>([])
const results = ref<EvaluationApplication[]>([])
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

const applyForm = reactive({
  selfEvaluation: '',
  materials: ''
})

const applyRules = {
  selfEvaluation: [{ required: true, message: '请填写自我评价', trigger: 'blur' }]
}

const getTypeText = (type: string) => {
  const map: Record<string, string> = {
    EXCELLENT_CADRE: '优秀学生干部',
    EXCELLENT_STUDENT: '优秀学生',
    EXCELLENT_MEMBER: '优秀团员',
    ADVANCED_INDIVIDUAL: '先进个人'
  }
  return map[type] || type
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    OPEN: '申请中',
    REVIEWING: '评审中',
    ANNOUNCED: '已公示',
    CLOSED: '已结束'
  }
  return map[status] || status
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const fetchActivities = async () => {
  loading.value = true
  try {
    const res = await getEvaluationActivities({
      page: page.value,
      pageSize: pageSize.value,
      type: selectedType.value,
      status: selectedStatus.value
    })
    activityList.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    ElMessage.error('获取评优活动失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchActivities()
}

const handleApply = (activity: EvaluationActivity) => {
  currentActivity.value = activity
  applyForm.selfEvaluation = ''
  applyForm.materials = ''
  applyDialogVisible.value = true
}

const submitApplication = async () => {
  if (!currentActivity.value) return
  applying.value = true
  try {
    await createEvaluationApplication({
      activityId: currentActivity.value.id,
      selfEvaluation: applyForm.selfEvaluation,
      materials: applyForm.materials
    })
    ElMessage.success('申请提交成功')
    applyDialogVisible.value = false
    fetchActivities()
  } catch (error: any) {
    console.error(error)
  } finally {
    applying.value = false
  }
}

const handleViewResults = async (activity: EvaluationActivity) => {
  currentActivity.value = activity
  resultsDialogVisible.value = true
  resultsLoading.value = true
  try {
    const res = await getActivityApplications(activity.id, { page: 1, pageSize: 50 })
    results.value = (res.data?.list || []).sort((a, b) => (a.rank || 999) - (b.rank || 999))
  } catch (error) {
    console.error(error)
  } finally {
    resultsLoading.value = false
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
    justify-content: space-between;
    margin-bottom: 12px;

    .type-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;

      &.EXCELLENT_CADRE {
        background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%);
        color: white;
      }

      &.EXCELLENT_STUDENT {
        background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
        color: white;
      }

      &.EXCELLENT_MEMBER {
        background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
        color: white;
      }

      &.ADVANCED_INDIVIDUAL {
        background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
        color: white;
      }
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;

      &.OPEN {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
      }

      &.REVIEWING {
        background: rgba(251, 191, 36, 0.2);
        color: #fbbf24;
      }

      &.ANNOUNCED {
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
      }
    }
  }

  .title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .description {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 16px;
    line-height: 1.6;
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
    }
  }

  .card-footer {
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.apply-info {
  margin-bottom: 20px;

  h4 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .criteria {
    font-size: 14px;
    color: var(--text-secondary);
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: var(--radius-md);
  }
}

.score {
  font-weight: 700;
  color: var(--primary-light);
}
</style>
