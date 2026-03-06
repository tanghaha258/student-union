<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>学分管理</h1>
        <p>管理学分记录，手动添加或扣除学分</p>
      </div>
      <div class="header-actions">
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出Excel
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          添加学分
        </el-button>
      </div>
    </div>

    <div class="filter-card glass-card">
      <div class="filter-row">
        <el-input v-model="searchKeyword" placeholder="搜索用户" prefix-icon="Search" clearable class="search-input" />
        <el-select v-model="selectedType" placeholder="学分类型" clearable @change="fetchCredits">
          <el-option label="全部" value="" />
          <el-option label="综合测评" value="COMPREHENSIVE" />
          <el-option label="第二课堂" value="SECOND_CLASSROOM" />
          <el-option label="志愿服务" value="VOLUNTEER" />
          <el-option label="文体活动" value="SPORTS_CULTURE" />
        </el-select>
      </div>
    </div>

    <div class="table-card glass-card">
      <el-table :data="creditList" v-loading="loading" style="width: 100%">
        <el-table-column label="用户信息" min-width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <span class="name">{{ row.user?.realName || row.user?.username }}</span>
              <span class="info">{{ row.user?.studentId }} · {{ row.user?.className }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="120">
          <template #default="{ row }">
            <el-tag :type="row.source === 'ACTIVITY' ? 'success' : 'primary'" size="small">
              {{ row.source === 'ACTIVITY' ? '活动' : '手动' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getCreditTypeColor(row.type)" size="small">
              {{ getCreditTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="学分" width="100" align="center">
          <template #default="{ row }">
            <span :class="['credit-value', { negative: row.value < 0 }]">
              {{ row.value > 0 ? '+' : '' }}{{ row.value }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="200" />
        <el-table-column label="时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
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
          @current-change="fetchCredits"
          @size-change="fetchCredits"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="添加学分" width="500px" class="modern-dialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="用户" prop="userId">
          <el-select v-model="formData.userId" filterable placeholder="搜索并选择用户" style="width: 100%">
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="`${user.realName || user.username} (${user.studentId || '无学号'})`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学分类型" prop="type">
          <el-select v-model="formData.type" placeholder="选择学分类型" style="width: 100%">
            <el-option label="综合测评" value="COMPREHENSIVE" />
            <el-option label="第二课堂" value="SECOND_CLASSROOM" />
            <el-option label="志愿服务" value="VOLUNTEER" />
            <el-option label="文体活动" value="SPORTS_CULTURE" />
          </el-select>
        </el-form-item>
        <el-form-item label="学分值" prop="value">
          <el-input-number v-model="formData.value" :step="0.5" :precision="1" placeholder="输入学分值" style="width: 100%" />
          <div class="form-tip">正数为添加学分，负数为扣除学分</div>
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { getCreditList, addCredit } from '@/api/credit'
import { exportCredits, downloadFile } from '@/api/export'
import { getUserList } from '@/api/user'
import type { CreditRecord } from '@/api/credit'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const searchKeyword = ref('')
const selectedType = ref('')
const creditList = ref<CreditRecord[]>([])
const userList = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const formRef = ref<FormInstance>()

const formData = reactive({
  userId: '',
  type: 'COMPREHENSIVE',
  value: 1.0,
  description: ''
})

const formRules: FormRules = {
  userId: [{ required: true, message: '请选择用户', trigger: 'change' }],
  type: [{ required: true, message: '请选择学分类型', trigger: 'change' }],
  value: [{ required: true, message: '请输入学分值', trigger: 'blur' }]
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

const getCreditTypeColor = (type: string) => {
  const map: Record<string, string> = {
    COMPREHENSIVE: 'primary',
    SECOND_CLASSROOM: 'success',
    VOLUNTEER: 'warning',
    SPORTS_CULTURE: 'info'
  }
  return map[type] || ''
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const fetchCredits = async () => {
  loading.value = true
  try {
    const res = await getCreditList({
      page: page.value,
      pageSize: pageSize.value,
      type: selectedType.value || undefined
    })
    creditList.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('Failed to fetch credits:', error)
    ElMessage.error('获取学分列表失败')
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const res = await getUserList({ page: 1, pageSize: 1000 })
    userList.value = res.data?.list || []
  } catch (error) {
    console.error('Failed to fetch users:', error)
  }
}

const handleAdd = () => {
  Object.assign(formData, {
    userId: '',
    type: 'COMPREHENSIVE',
    value: 1.0,
    description: ''
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await addCredit({
          userId: formData.userId,
          type: formData.type,
          value: formData.value,
          description: formData.description
        })
        ElMessage.success('添加成功')
        dialogVisible.value = false
        fetchCredits()
      } catch (error) {
        console.error(error)
        ElMessage.error('添加失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleExport = async () => {
  try {
    ElMessage.info('正在导出...')
    const blob = await exportCredits({
      type: selectedType.value || undefined
    })
    downloadFile(blob, `学分记录_${new Date().toISOString().slice(0, 10)}.xlsx`)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('Export failed:', error)
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  fetchCredits()
  fetchUsers()
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

  .header-actions {
    display: flex;
    gap: 12px;
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

.user-cell {
  .name {
    display: block;
    font-weight: 500;
    color: var(--text-primary);
  }

  .info {
    font-size: 12px;
    color: var(--text-muted);
  }
}

.credit-value {
  font-weight: 600;
  color: #10b981;

  &.negative {
    color: #ef4444;
  }
}

.pagination-wrapper {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.form-tip {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}
</style>
