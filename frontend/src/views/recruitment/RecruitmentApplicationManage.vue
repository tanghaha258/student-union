<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>{{ recruitment?.title || '报名管理' }}</h1>
        <p>管理招新报名，审核、安排面试、录用</p>
      </div>
      <div class="header-actions">
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card glass-card" @click="filterByStatus('')">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">总报名</div>
        </div>
      </div>
      <div class="stat-card glass-card" @click="filterByStatus('PENDING')">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">待审核</div>
        </div>
      </div>
      <div class="stat-card glass-card" @click="filterByStatus('INTERVIEW')">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.interview }}</div>
          <div class="stat-label">面试中</div>
        </div>
      </div>
      <div class="stat-card glass-card" @click="filterByStatus('APPROVED')">
        <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.approved }}</div>
          <div class="stat-label">已通过</div>
        </div>
      </div>
      <div class="stat-card glass-card" @click="filterByStatus('HIRED')">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%);">
          <el-icon><Medal /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.hired }}</div>
          <div class="stat-label">已录用</div>
        </div>
      </div>
    </div>

    <div class="filter-card glass-card">
      <div class="filter-row">
        <el-input v-model="keyword" placeholder="搜索姓名/学号" prefix-icon="Search" clearable class="search-input" @input="handleSearch" />
        <el-select v-model="selectedStatus" placeholder="状态筛选" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="待审核" value="PENDING" />
          <el-option label="已通过" value="APPROVED" />
          <el-option label="已拒绝" value="REJECTED" />
          <el-option label="面试中" value="INTERVIEW" />
          <el-option label="已录用" value="HIRED" />
          <el-option label="未通过" value="FAILED" />
        </el-select>
        <el-select v-model="selectedDepartment" placeholder="部门筛选" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
        </el-select>
        <el-button type="success" :disabled="selectedIds.length === 0" @click="handleBatchApprove">
          批量通过 ({{ selectedIds.length }})
        </el-button>
        <el-button type="danger" :disabled="selectedIds.length === 0" @click="handleBatchReject">
          批量拒绝 ({{ selectedIds.length }})
        </el-button>
      </div>
    </div>

    <div class="table-card glass-card" v-loading="loading">
      <el-table 
        :data="applicationList" 
        class="modern-table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="姓名" width="80" />
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="className" label="班级" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="志愿部门" width="140">
          <template #default="{ row }">
            <div v-if="row.department1">{{ row.department1 }}</div>
            <div v-if="row.department2" class="text-muted">备选: {{ row.department2 }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="面试信息" width="180">
          <template #default="{ row }">
            <div v-if="row.interviewTime" class="interview-cell">
              <div><el-icon><Clock /></el-icon> {{ row.interviewTime }}</div>
              <div v-if="row.interviewLocation"><el-icon><Location /></el-icon> {{ row.interviewLocation }}</div>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="handleViewDetail(row)">
              详情
            </el-button>
            <template v-if="row.status === 'PENDING'">
              <el-button type="success" text size="small" @click="handleUpdateStatus(row, 'APPROVED')">通过</el-button>
              <el-button type="warning" text size="small" @click="handleArrangeInterview(row)">面试</el-button>
              <el-button type="danger" text size="small" @click="handleUpdateStatus(row, 'REJECTED')">拒绝</el-button>
            </template>
            <template v-else-if="row.status === 'INTERVIEW'">
              <el-button type="success" text size="small" @click="handleUpdateStatus(row, 'HIRED')">录用</el-button>
              <el-button type="danger" text size="small" @click="handleUpdateStatus(row, 'FAILED')">淘汰</el-button>
            </template>
            <template v-else>
              <el-button type="primary" text size="small" @click="handleUpdateStatus(row, 'PENDING')">重置</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchApplications"
          @size-change="fetchApplications"
        />
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="报名详情" width="600px" class="modern-dialog">
      <div class="detail-content" v-if="currentApplication">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">姓名：</span>
              <span class="value">{{ currentApplication.name }}</span>
            </div>
            <div class="detail-item">
              <span class="label">学号：</span>
              <span class="value">{{ currentApplication.studentId }}</span>
            </div>
            <div class="detail-item">
              <span class="label">班级：</span>
              <span class="value">{{ currentApplication.className }}</span>
            </div>
            <div class="detail-item">
              <span class="label">性别：</span>
              <span class="value">{{ currentApplication.gender || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">出生日期：</span>
              <span class="value">{{ currentApplication.birthday || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">QQ：</span>
              <span class="value">{{ currentApplication.qq || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">手机号：</span>
              <span class="value">{{ currentApplication.phone }}</span>
            </div>
            <div class="detail-item">
              <span class="label">邮箱：</span>
              <span class="value">{{ currentApplication.email || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>志愿选择</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">第一志愿：</span>
              <span class="value">{{ currentApplication.department1 || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">第二志愿：</span>
              <span class="value">{{ currentApplication.department2 || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">服从调剂：</span>
              <span class="value">{{ currentApplication.isAdjusted ? '是' : '否' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>个人展示</h4>
          <div class="detail-text" v-if="currentApplication.skills">
            <span class="label">技能特长：</span>
            <p>{{ currentApplication.skills }}</p>
          </div>
          <div class="detail-text" v-if="currentApplication.experience">
            <span class="label">相关经历：</span>
            <p>{{ currentApplication.experience }}</p>
          </div>
          <div class="detail-text" v-if="currentApplication.reason">
            <span class="label">申请理由：</span>
            <p>{{ currentApplication.reason }}</p>
          </div>
          <div class="detail-text" v-if="currentApplication.expectation">
            <span class="label">期望收获：</span>
            <p>{{ currentApplication.expectation }}</p>
          </div>
        </div>

        <div class="detail-section" v-if="currentApplication.interviewTime">
          <h4>面试信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">面试时间：</span>
              <span class="value">{{ currentApplication.interviewTime }}</span>
            </div>
            <div class="detail-item">
              <span class="label">面试地点：</span>
              <span class="value">{{ currentApplication.interviewLocation }}</span>
            </div>
          </div>
        </div>

        <div class="detail-footer">
          <span class="current-status">
            当前状态：<el-tag :type="getStatusType(currentApplication.status)">{{ getStatusText(currentApplication.status) }}</el-tag>
          </span>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <template v-if="currentApplication?.status === 'PENDING'">
          <el-button type="danger" @click="handleUpdateStatus(currentApplication, 'REJECTED'); detailVisible = false">拒绝</el-button>
          <el-button type="warning" @click="showInterviewDialog(currentApplication)">安排面试</el-button>
          <el-button type="success" @click="handleUpdateStatus(currentApplication, 'APPROVED'); detailVisible = false">通过</el-button>
        </template>
      </template>
    </el-dialog>

    <!-- 面试安排弹窗 -->
    <el-dialog v-model="interviewVisible" title="安排面试" width="450px" class="modern-dialog">
      <el-form :model="interviewForm" label-width="100px">
        <el-form-item label="报名人">
          <span>{{ currentApplication?.name }}（{{ currentApplication?.studentId }}）</span>
        </el-form-item>
        <el-form-item label="志愿部门">
          <span>{{ currentApplication?.department1 }}</span>
        </el-form-item>
        <el-form-item label="面试时间" required>
          <el-date-picker 
            v-model="interviewForm.interviewTime" 
            type="datetime" 
            placeholder="选择面试时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="面试地点" required>
          <el-input v-model="interviewForm.interviewLocation" placeholder="请输入面试地点" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="interviewForm.remark" type="textarea" :rows="2" placeholder="备注信息（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="interviewVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmInterview">确认安排</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getRecruitmentApplications,
  updateApplicationStatus,
  batchUpdateApplications,
  arrangeInterview,
  getRecruitmentStats,
  exportRecruitmentApplications
} from '@/api/recruitment'
import type { RecruitmentApplication, RecruitmentStats } from '@/api/recruitment'

const router = useRouter()
const route = useRoute()
const recruitmentId = route.params.id as string

const loading = ref(false)
const keyword = ref('')
const selectedStatus = ref('')
const selectedDepartment = ref('')
const detailVisible = ref(false)
const interviewVisible = ref(false)

const applicationList = ref<RecruitmentApplication[]>([])
const currentApplication = ref<RecruitmentApplication | null>(null)
const selectedIds = ref<string[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const recruitment = ref<{ title: string } | null>(null)

const stats = reactive<RecruitmentStats>({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  interview: 0,
  hired: 0,
  failed: 0,
  departmentStats: []
})

const interviewForm = reactive({
  interviewTime: '',
  interviewLocation: '',
  remark: ''
})

const departments = computed(() => {
  return stats.departmentStats.map(d => d.department).filter(Boolean) as string[]
})

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    INTERVIEW: 'primary',
    HIRED: 'success',
    FAILED: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    INTERVIEW: '面试中',
    HIRED: '已录用',
    FAILED: '未通过'
  }
  return texts[status] || status
}

const fetchApplications = async () => {
  loading.value = true
  try {
    const res = await getRecruitmentApplications(recruitmentId, {
      page: page.value,
      pageSize: pageSize.value,
      status: selectedStatus.value,
      department: selectedDepartment.value,
      keyword: keyword.value
    })
    applicationList.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('Failed to fetch applications:', error)
    ElMessage.error('获取报名列表失败')
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await getRecruitmentStats(recruitmentId)
    if (res.data) {
      Object.assign(stats, res.data)
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

const handleSearch = () => {
  page.value = 1
  fetchApplications()
}

const filterByStatus = (status: string) => {
  selectedStatus.value = status
  handleSearch()
}

const handleSelectionChange = (selection: RecruitmentApplication[]) => {
  selectedIds.value = selection.map(item => item.id)
}

const handleViewDetail = (row: RecruitmentApplication) => {
  currentApplication.value = row
  detailVisible.value = true
}

const handleUpdateStatus = async (row: RecruitmentApplication, status: string) => {
  try {
    await updateApplicationStatus(row.id, { status })
    ElMessage.success('状态更新成功')
    fetchApplications()
    fetchStats()
  } catch (error) {
    console.error(error)
  }
}

const handleBatchApprove = async () => {
  ElMessageBox.confirm(`确定要通过选中的 ${selectedIds.value.length} 条报名吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      await batchUpdateApplications(selectedIds.value, 'APPROVED')
      ElMessage.success('批量通过成功')
      selectedIds.value = []
      fetchApplications()
      fetchStats()
    } catch (error) {
      console.error(error)
    }
  })
}

const handleBatchReject = async () => {
  ElMessageBox.confirm(`确定要拒绝选中的 ${selectedIds.value.length} 条报名吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await batchUpdateApplications(selectedIds.value, 'REJECTED')
      ElMessage.success('批量拒绝成功')
      selectedIds.value = []
      fetchApplications()
      fetchStats()
    } catch (error) {
      console.error(error)
    }
  })
}

const showInterviewDialog = (row: RecruitmentApplication) => {
  currentApplication.value = row
  interviewForm.interviewTime = ''
  interviewForm.interviewLocation = ''
  interviewForm.remark = ''
  detailVisible.value = false
  interviewVisible.value = true
}

const handleArrangeInterview = (row: RecruitmentApplication) => {
  showInterviewDialog(row)
}

const handleConfirmInterview = async () => {
  if (!interviewForm.interviewTime || !interviewForm.interviewLocation) {
    ElMessage.warning('请填写面试时间和地点')
    return
  }
  
  try {
    const timeStr = new Date(interviewForm.interviewTime).toLocaleString('zh-CN')
    await arrangeInterview(currentApplication.value!.id, {
      interviewTime: timeStr,
      interviewLocation: interviewForm.interviewLocation,
      remark: interviewForm.remark
    })
    ElMessage.success('面试安排成功')
    interviewVisible.value = false
    fetchApplications()
    fetchStats()
  } catch (error) {
    console.error(error)
  }
}

const handleExport = async () => {
  try {
    const blob = await exportRecruitmentApplications(recruitmentId)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `报名数据_${new Date().toLocaleDateString()}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  fetchApplications()
  fetchStats()
})
</script>

<style scoped lang="scss">
.page-wrapper {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  .header-info {
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 8px 0 6px;
    }

    p {
      font-size: 14px;
      color: var(--text-secondary);
    }
  }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: white;
  }

  .stat-info {
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-secondary);
    }
  }
}

.filter-card {
  padding: 16px 20px;
  margin-bottom: 20px;

  .filter-row {
    display: flex;
    gap: 12px;
    align-items: center;

    .search-input {
      width: 200px;
    }

    .el-select {
      width: 120px;
    }
  }
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.text-muted {
  font-size: 12px;
  color: var(--text-muted);
}

.interview-cell {
  font-size: 12px;
  color: var(--text-secondary);

  div {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 2px;
  }
}

.pagination-wrapper {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-content {
  .detail-section {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    &:last-of-type {
      border-bottom: none;
    }

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: #667eea;
      margin-bottom: 12px;
    }
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 20px;

    .detail-item {
      font-size: 14px;

      .label {
        color: var(--text-secondary);
      }

      .value {
        color: var(--text-primary);
      }
    }
  }

  .detail-text {
    margin-bottom: 12px;

    .label {
      font-size: 13px;
      color: var(--text-secondary);
      display: block;
      margin-bottom: 4px;
    }

    p {
      font-size: 14px;
      color: var(--text-primary);
      line-height: 1.6;
      margin: 0;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
    }
  }

  .detail-footer {
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);

    .current-status {
      font-size: 14px;
      color: var(--text-secondary);
    }
  }
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-card .filter-row {
    flex-wrap: wrap;
  }
}
</style>
