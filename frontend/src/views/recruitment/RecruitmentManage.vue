<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>招新管理</h1>
        <p>管理招新活动和审核报名申请</p>
      </div>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        创建招新
      </el-button>
    </div>

    <div class="stats-row">
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <el-icon><Calendar /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">招新活动</div>
        </div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.applications }}</div>
          <div class="stat-label">报名人数</div>
        </div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">待审核</div>
        </div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.approved }}</div>
          <div class="stat-label">已通过</div>
        </div>
      </div>
    </div>

    <div class="filter-card glass-card">
      <div class="filter-row">
        <el-input v-model="keyword" placeholder="搜索招新活动" prefix-icon="Search" clearable class="search-input" @input="handleSearch" />
        <el-select v-model="selectedStatus" placeholder="活动状态" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="进行中" value="OPEN" />
          <el-option label="已结束" value="CLOSED" />
        </el-select>
      </div>
    </div>

    <div class="table-card glass-card" v-loading="loading">
      <el-table :data="recruitmentList" class="modern-table">
        <el-table-column prop="title" label="招新名称" min-width="200">
          <template #default="{ row }">
            <div class="title-cell">
              <span class="title">{{ row.title }}</span>
              <span class="desc" v-if="row.description">{{ row.description }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="报名时间" width="220">
          <template #default="{ row }">
            <div class="date-cell">
              <div><el-icon><Clock /></el-icon> {{ formatDateTime(row.startDate) }}</div>
              <div><el-icon><Clock /></el-icon> {{ formatDateTime(row.endDate) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="报名人数" width="120" align="center">
          <template #default="{ row }">
            <el-badge :value="row._count?.applications || 0" type="primary" class="count-badge" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)" size="small" effect="dark">
              {{ getStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="handleViewApplications(row)">
              <el-icon><User /></el-icon>
              查看报名
            </el-button>
            <el-button type="success" text size="small" @click="handleExport(row)">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button type="primary" text size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button type="danger" text size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchRecruitments"
          @size-change="fetchRecruitments"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" class="modern-dialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="招新标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入招新标题" />
        </el-form-item>
        <el-form-item label="招新简介">
          <el-input v-model="formData.intro" type="textarea" :rows="2" placeholder="请输入招新简介（显示在落地页）" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startDate">
              <el-date-picker v-model="formData.startDate" type="datetime" placeholder="选择开始时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止时间" prop="endDate">
              <el-date-picker v-model="formData.endDate" type="datetime" placeholder="选择截止时间" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="招新要求">
          <el-input v-model="formData.requirements" type="textarea" :rows="3" placeholder="请输入招新要求" />
        </el-form-item>
        <el-form-item label="福利待遇">
          <el-input v-model="formData.benefits" type="textarea" :rows="3" placeholder="请输入福利待遇" />
        </el-form-item>
        <el-form-item label="招新流程">
          <el-input v-model="formData.process" type="textarea" :rows="3" placeholder="请输入招新流程" />
        </el-form-item>
        <el-form-item label="Banner图">
          <el-input v-model="formData.banner" placeholder="请输入Banner图片URL（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="applicationsDialogVisible" :title="currentRecruitment?.title + ' - 报名列表'" width="1000px" class="modern-dialog">
      <div class="applications-header">
        <el-input v-model="applicationKeyword" placeholder="搜索姓名/学号" prefix-icon="Search" clearable style="width: 200px;" @input="filterApplications" />
        <el-select v-model="applicationStatus" placeholder="状态筛选" clearable @change="filterApplications">
          <el-option label="全部" value="" />
          <el-option label="待审核" value="PENDING" />
          <el-option label="已通过" value="APPROVED" />
          <el-option label="已拒绝" value="REJECTED" />
        </el-select>
      </div>
      <el-table :data="filteredApplications" v-loading="applicationsLoading" max-height="500">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <div class="expand-item" v-if="row.skills">
                <span class="label">技能特长：</span>
                <span class="value">{{ row.skills }}</span>
              </div>
              <div class="expand-item" v-if="row.experience">
                <span class="label">相关经历：</span>
                <span class="value">{{ row.experience }}</span>
              </div>
              <div class="expand-item" v-if="row.reason">
                <span class="label">报名原因：</span>
                <span class="value">{{ row.reason }}</span>
              </div>
              <div class="expand-item" v-if="row.expectation">
                <span class="label">期望收获：</span>
                <span class="value">{{ row.expectation }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="80" />
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="className" label="班级" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="意向部门" width="140">
          <template #default="{ row }">
            <div v-if="row.department1">{{ row.department1 }}</div>
            <div v-if="row.department2" class="text-muted">备选: {{ row.department2 }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'" size="small">
              {{ row.status === 'APPROVED' ? '已通过' : row.status === 'REJECTED' ? '已拒绝' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'PENDING'">
              <el-button type="success" size="small" @click="handleReview(row, 'APPROVED')">通过</el-button>
              <el-button type="danger" size="small" @click="handleReview(row, 'REJECTED')">拒绝</el-button>
            </template>
            <template v-else>
              <el-button type="primary" text size="small" @click="handleReview(row, 'PENDING')">重置</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import {
  getRecruitments,
  createRecruitment,
  updateRecruitment,
  deleteRecruitment,
  getRecruitmentApplications,
  updateApplicationStatus,
  exportRecruitmentApplications
} from '@/api/recruitment'
import type { Recruitment, RecruitmentApplication } from '@/api/recruitment'

const loading = ref(false)
const submitting = ref(false)
const applicationsLoading = ref(false)
const keyword = ref('')
const selectedStatus = ref('')
const dialogVisible = ref(false)
const applicationsDialogVisible = ref(false)
const dialogTitle = ref('创建招新')
const formRef = ref<FormInstance>()

const recruitmentList = ref<Recruitment[]>([])
const applications = ref<RecruitmentApplication[]>([])
const currentRecruitment = ref<Recruitment | null>(null)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const applicationKeyword = ref('')
const applicationStatus = ref('')

const stats = reactive({
  total: 0,
  applications: 0,
  pending: 0,
  approved: 0
})

const formData = reactive({
  id: '',
  title: '',
  intro: '',
  description: '',
  startDate: '',
  endDate: '',
  requirements: '',
  benefits: '',
  process: '',
  banner: ''
})

const formRules: FormRules = {
  title: [{ required: true, message: '请输入招新标题', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择截止时间', trigger: 'change' }]
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getStatusType = (row: Recruitment) => {
  if (row.status === 'CLOSED') return 'info'
  const now = new Date()
  const end = new Date(row.endDate)
  if (now > end) return 'warning'
  return 'success'
}

const getStatusText = (row: Recruitment) => {
  if (row.status === 'CLOSED') return '已结束'
  const now = new Date()
  const start = new Date(row.startDate)
  const end = new Date(row.endDate)
  if (now < start) return '未开始'
  if (now > end) return '已过期'
  return '进行中'
}

const filteredApplications = computed(() => {
  let result = applications.value
  if (applicationKeyword.value) {
    const kw = applicationKeyword.value.toLowerCase()
    result = result.filter(a => 
      a.name.toLowerCase().includes(kw) || 
      a.studentId.toLowerCase().includes(kw)
    )
  }
  if (applicationStatus.value) {
    result = result.filter(a => a.status === applicationStatus.value)
  }
  return result
})

const fetchRecruitments = async () => {
  loading.value = true
  try {
    const res = await getRecruitments({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
      status: selectedStatus.value
    })
    recruitmentList.value = res.data?.list || []
    total.value = res.data?.total || 0
    updateStats()
  } catch (error) {
    console.error('Failed to fetch recruitments:', error)
    ElMessage.error('获取招新列表失败')
  } finally {
    loading.value = false
  }
}

const updateStats = () => {
  stats.total = recruitmentList.value.length
  stats.applications = recruitmentList.value.reduce((sum, r) => sum + (r._count?.applications || 0), 0)
}

const handleSearch = () => {
  page.value = 1
  fetchRecruitments()
}

const handleCreate = () => {
  dialogTitle.value = '创建招新'
  Object.assign(formData, {
    id: '',
    title: '',
    intro: '',
    description: '',
    startDate: '',
    endDate: '',
    requirements: '',
    benefits: '',
    process: '',
    banner: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: Recruitment) => {
  dialogTitle.value = '编辑招新'
  Object.assign(formData, {
    id: row.id,
    title: row.title,
    intro: row.intro || '',
    description: row.description || '',
    startDate: row.startDate,
    endDate: row.endDate,
    requirements: row.requirements || '',
    benefits: row.benefits || '',
    process: row.process || '',
    banner: row.banner || ''
  })
  dialogVisible.value = true
}

const handleDelete = (row: Recruitment) => {
  ElMessageBox.confirm(`确定要删除招新活动 "${row.title}" 吗？删除后所有报名数据将一并删除！`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteRecruitment(row.id)
      ElMessage.success('删除成功')
      fetchRecruitments()
    } catch (error) {
      console.error(error)
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const data = {
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString()
        }
        if (formData.id) {
          await updateRecruitment(formData.id, data)
          ElMessage.success('修改成功')
        } else {
          await createRecruitment(data)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        fetchRecruitments()
      } catch (error) {
        console.error(error)
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleViewApplications = async (recruitment: Recruitment) => {
  currentRecruitment.value = recruitment
  applicationsDialogVisible.value = true
  applicationsLoading.value = true
  applicationKeyword.value = ''
  applicationStatus.value = ''
  try {
    const res = await getRecruitmentApplications(recruitment.id, { page: 1, pageSize: 1000 })
    applications.value = res.data?.list || []
    stats.pending = applications.value.filter(a => a.status === 'PENDING').length
    stats.approved = applications.value.filter(a => a.status === 'APPROVED').length
  } catch (error) {
    console.error(error)
  } finally {
    applicationsLoading.value = false
  }
}

const filterApplications = () => {}

const handleReview = async (row: RecruitmentApplication, status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
  try {
    await updateApplicationStatus(row.id, { status })
    ElMessage.success(status === 'APPROVED' ? '已通过' : status === 'REJECTED' ? '已拒绝' : '已重置')
    handleViewApplications(currentRecruitment.value!)
  } catch (error) {
    console.error(error)
  }
}

const handleExport = async (row: Recruitment) => {
  try {
    const res = await exportRecruitmentApplications(row.id)
    const blob = new Blob([res], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${row.title}_报名数据.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  fetchRecruitments()
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

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
  }

  .stat-info {
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 14px;
      color: var(--text-secondary);
      margin-top: 4px;
    }
  }
}

.filter-card {
  padding: 20px;
  margin-bottom: 20px;

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

.table-card {
  padding: 0;
  overflow: hidden;
}

.title-cell {
  .title {
    font-weight: 600;
    color: var(--text-primary);
  }

  .desc {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.date-cell {
  font-size: 12px;
  color: var(--text-secondary);

  div {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 2px;
  }
}

.count-badge {
  :deep(.el-badge__content) {
    font-size: 12px;
  }
}

.pagination-wrapper {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.applications-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.expand-content {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;

  .expand-item {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      font-weight: 600;
      color: var(--text-secondary);
      margin-right: 8px;
    }

    .value {
      color: var(--text-primary);
    }
  }
}

.text-muted {
  color: var(--text-muted);
  font-size: 12px;
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
