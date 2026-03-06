<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>招新活动管理</h1>
        <p>管理学生会招新活动，创建、编辑、发布招新信息</p>
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
          <div class="stat-label">总报名人数</div>
        </div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.active }}</div>
          <div class="stat-label">进行中</div>
        </div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.closed }}</div>
          <div class="stat-label">已结束</div>
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
        <el-table-column prop="title" label="招新标题" min-width="160">
          <template #default="{ row }">
            <div class="title-cell">
              <span class="title">{{ row.title }}</span>
              <span class="intro" v-if="row.intro">{{ row.intro }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="报名时间" width="200">
          <template #default="{ row }">
            <div class="date-cell">
              <div><el-icon><Clock /></el-icon> {{ formatDateTime(row.startDate) }}</div>
              <div><el-icon><Clock /></el-icon> {{ formatDateTime(row.endDate) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="报名人数" width="90" align="center">
          <template #default="{ row }">
            <el-badge :value="row._count?.applications || 0" type="primary" class="count-badge" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)" size="small" effect="dark">
              {{ getStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="520" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" text size="small" @click="handleCopyLink(row)">
                <el-icon><Link /></el-icon>
                复制链接
              </el-button>
              <el-button type="primary" text size="small" @click="handleViewApplications(row)">
                <el-icon><User /></el-icon>
                报名管理
              </el-button>
              <el-button type="success" text size="small" @click="handleExport(row)">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
              <el-button type="primary" text size="small" @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button 
                v-if="row.status === 'OPEN'" 
                type="warning" 
                text 
                size="small" 
                @click="handleClose(row)"
              >
                结束
              </el-button>
              <el-button 
                v-else-if="row.status === 'CLOSED'" 
                type="success" 
                text 
                size="small" 
                @click="handlePublish(row)"
              >
                重新开放
              </el-button>
              <el-button type="danger" text size="small" @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
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
        <el-button type="default" :loading="submitting" @click="handleSubmit(false)">保存草稿</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit(true)">发布招新</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import {
  getRecruitments,
  createRecruitment,
  updateRecruitment,
  deleteRecruitment,
  publishRecruitment,
  closeRecruitment,
  exportRecruitmentApplications
} from '@/api/recruitment'
import type { Recruitment } from '@/api/recruitment'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const keyword = ref('')
const selectedStatus = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('创建招新')

const formRef = ref<FormInstance>()

const recruitmentList = ref<Recruitment[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const stats = reactive({
  total: 0,
  applications: 0,
  active: 0,
  closed: 0
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
  stats.active = recruitmentList.value.filter(r => r.status === 'OPEN').length
  stats.closed = recruitmentList.value.filter(r => r.status === 'CLOSED').length
}

const handleSearch = () => {
  page.value = 1
  fetchRecruitments()
}

const handleCopyLink = (row: Recruitment) => {
  const link = `${window.location.origin}/recruitment/${row.id}`
  navigator.clipboard.writeText(link).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
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

const handleClose = (row: Recruitment) => {
  ElMessageBox.confirm(`确定要结束招新活动 "${row.title}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await closeRecruitment(row.id)
      ElMessage.success('已结束')
      fetchRecruitments()
    } catch (error) {
      console.error(error)
    }
  })
}

const handlePublish = async (row: Recruitment) => {
  try {
    await publishRecruitment(row.id)
    ElMessage.success('已重新开放')
    fetchRecruitments()
  } catch (error) {
    console.error(error)
  }
}

const handleSubmit = async (publish: boolean) => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const data = {
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          status: publish ? 'OPEN' : 'DRAFT'
        }
        if (formData.id) {
          await updateRecruitment(formData.id, data)
          if (publish) await publishRecruitment(formData.id)
          ElMessage.success('修改成功')
        } else {
          const res = await createRecruitment(data)
          if (publish && res.data?.id) {
            await publishRecruitment(res.data.id)
          }
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

const handleViewApplications = (row: Recruitment) => {
  router.push(`/recruitment-applications/${row.id}`)
}

const handleExport = async (row: Recruitment) => {
  try {
    const blob = await exportRecruitmentApplications(row.id)
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

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: nowrap;
  }
}

.title-cell {
  .title {
    font-weight: 600;
    color: var(--text-primary);
  }

  .intro {
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
