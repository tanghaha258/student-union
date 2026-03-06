<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>报名管理</h1>
        <p>管理报名活动和审核报名申请</p>
      </div>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        创建活动
      </el-button>
    </div>

    <div class="filter-card glass-card">
      <div class="filter-row">
        <el-input v-model="keyword" placeholder="搜索活动名称" prefix-icon="Search" clearable class="search-input" @input="handleSearch" />
        <el-select v-model="selectedStatus" placeholder="活动状态" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="报名中" value="OPEN" />
          <el-option label="已结束" value="CLOSED" />
        </el-select>
      </div>
    </div>

    <div class="table-card glass-card" v-loading="loading">
      <el-table :data="activityList" class="modern-table">
        <el-table-column prop="title" label="活动名称" min-width="180" />
        <el-table-column label="报名时间" width="200">
          <template #default="{ row }">
            {{ formatDate(row.startDate) }} - {{ formatDate(row.endDate) }}
          </template>
        </el-table-column>
        <el-table-column label="活动时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.eventDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地点" width="100" />
        <el-table-column label="报名人数" width="100">
          <template #default="{ row }">
            {{ row._count?.registrations || 0 }}{{ row.maxParticipants ? '/' + row.maxParticipants : '' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'OPEN' ? 'success' : 'info'" size="small">
              {{ row.status === 'OPEN' ? '报名中' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" text size="small" @click="handleViewRegistrations(row)">查看报名</el-button>
              <el-button type="primary" text size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
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
          @current-change="fetchActivities"
          @size-change="fetchActivities"
        />
      </div>
    </div>

    <!-- 创建/编辑活动弹窗 -->
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
            <el-form-item label="报名开始" prop="startDate">
              <el-date-picker v-model="formData.startDate" type="datetime" placeholder="选择报名开始时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报名截止" prop="endDate">
              <el-date-picker v-model="formData.endDate" type="datetime" placeholder="选择报名截止时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动时间" prop="eventDate">
              <el-date-picker v-model="formData.eventDate" type="datetime" placeholder="选择活动时间" style="width: 100%" />
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
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看报名列表弹窗 -->
    <el-dialog v-model="registrationsDialogVisible" :title="currentActivity?.title + ' - 报名列表'" width="900px" class="modern-dialog">
      <el-table :data="registrations" v-loading="registrationsLoading">
        <el-table-column label="报名人" min-width="150">
          <template #default="{ row }">
            {{ row.user?.nickname || row.user?.username }}
          </template>
        </el-table-column>
        <el-table-column prop="user.studentId" label="学号" width="120" />
        <el-table-column prop="user.className" label="班级" width="120" />
        <el-table-column prop="user.phone" label="手机号" width="130" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'" size="small">
              {{ row.status === 'APPROVED' ? '已通过' : row.status === 'REJECTED' ? '已拒绝' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <template v-if="row.status === 'PENDING'">
              <el-button type="success" text size="small" @click="handleReview(row, 'APPROVED')">通过</el-button>
              <el-button type="danger" text size="small" @click="handleReview(row, 'REJECTED')">拒绝</el-button>
            </template>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import {
  getRegistrationActivities,
  createRegistrationActivity,
  updateRegistrationActivity,
  deleteRegistrationActivity,
  getActivityRegistrations,
  reviewRegistration
} from '@/api/registration'
import type { RegistrationActivity, Registration } from '@/api/registration'

const loading = ref(false)
const submitting = ref(false)
const registrationsLoading = ref(false)
const keyword = ref('')
const selectedStatus = ref('')
const dialogVisible = ref(false)
const registrationsDialogVisible = ref(false)
const dialogTitle = ref('创建活动')
const formRef = ref<FormInstance>()

const activityList = ref<RegistrationActivity[]>([])
const registrations = ref<Registration[]>([])
const currentActivity = ref<RegistrationActivity | null>(null)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const formData = reactive({
  id: '',
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  eventDate: '',
  location: '',
  maxParticipants: null as number | null,
  requireApproval: false,
  creditEnabled: false,
  creditType: 'COMPREHENSIVE',
  creditValue: 1.0
})

const formRules: FormRules = {
  title: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择报名开始时间', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择报名截止时间', trigger: 'change' }],
  eventDate: [{ required: true, message: '请选择活动时间', trigger: 'change' }]
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
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

const handleCreate = () => {
  dialogTitle.value = '创建活动'
  Object.assign(formData, {
    id: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    eventDate: '',
    location: '',
    maxParticipants: null,
    requireApproval: false,
    creditEnabled: false,
    creditType: 'COMPREHENSIVE',
    creditValue: 1.0
  })
  dialogVisible.value = true
}

const handleEdit = (row: RegistrationActivity) => {
  dialogTitle.value = '编辑活动'
  Object.assign(formData, {
    id: row.id,
    title: row.title,
    description: row.description || '',
    startDate: row.startDate,
    endDate: row.endDate,
    eventDate: row.eventDate,
    location: row.location || '',
    maxParticipants: row.maxParticipants,
    requireApproval: row.requireApproval,
    creditEnabled: row.creditEnabled || false,
    creditType: row.creditType || 'COMPREHENSIVE',
    creditValue: row.creditValue || 1.0
  })
  dialogVisible.value = true
}

const handleDelete = (row: RegistrationActivity) => {
  ElMessageBox.confirm(`确定要删除活动 "${row.title}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteRegistrationActivity(row.id)
      ElMessage.success('删除成功')
      fetchActivities()
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
          endDate: new Date(formData.endDate).toISOString(),
          eventDate: new Date(formData.eventDate).toISOString()
        }
        if (formData.id) {
          await updateRegistrationActivity(formData.id, data)
          ElMessage.success('修改成功')
        } else {
          await createRegistrationActivity(data)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        fetchActivities()
      } catch (error) {
        console.error(error)
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleViewRegistrations = async (activity: RegistrationActivity) => {
  currentActivity.value = activity
  registrationsDialogVisible.value = true
  registrationsLoading.value = true
  try {
    const res = await getActivityRegistrations(activity.id, { page: 1, pageSize: 100 })
    registrations.value = res.data?.list || []
  } catch (error) {
    console.error(error)
  } finally {
    registrationsLoading.value = false
  }
}

const handleReview = async (row: Registration, status: 'APPROVED' | 'REJECTED') => {
  try {
    await reviewRegistration(row.id, { status })
    ElMessage.success(status === 'APPROVED' ? '已通过' : '已拒绝')
    handleViewRegistrations(currentActivity.value!)
  } catch (error) {
    console.error(error)
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
    gap: 8px;
  }
}

.pagination-wrapper {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.text-muted {
  color: var(--text-muted);
}
</style>
