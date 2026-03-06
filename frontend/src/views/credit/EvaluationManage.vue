<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>评优管理</h1>
        <p>创建评优周期，自动计算评优结果</p>
      </div>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        创建评优
      </el-button>
    </div>

    <div class="period-list glass-card">
      <div class="card-header">
        <h3>评优周期</h3>
      </div>
      <el-table :data="periods" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="评优名称" min-width="200" />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)" size="small">
              {{ getTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间范围" width="220">
          <template #default="{ row }">
            {{ formatDate(row.startDate) }} ~ {{ formatDate(row.endDate) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)" size="small" effect="dark">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="参评人数" width="100" align="center">
          <template #default="{ row }">
            {{ row._count?.results || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="280">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" text size="small" @click="handleViewResults(row)">查看结果</el-button>
              <el-button 
                v-if="row.status === 'DRAFT'" 
                type="success" 
                text 
                size="small" 
                @click="handleCalculate(row)"
                :loading="row.calculating"
              >
                计算评优
              </el-button>
              <el-button 
                v-if="row.status === 'PUBLISHED'" 
                type="primary" 
                text 
                size="small" 
                @click="handleExport(row)"
              >
                导出
              </el-button>
              <el-button v-if="row.status === 'DRAFT'" type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" title="创建评优周期" width="550px" class="modern-dialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="评优名称" prop="name">
          <el-input v-model="formData.name" placeholder="如：2024-2025学年第一学期评优" />
        </el-form-item>
        <el-form-item label="评优类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio value="SEMESTER">学期评优</el-radio>
            <el-radio value="YEAR">年度评优</el-radio>
            <el-radio value="CUSTOM">自定义评优</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker v-model="formData.startDate" type="date" placeholder="选择开始日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker v-model="formData.endDate" type="date" placeholder="选择结束日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          系统将自动统计该时间段内的所有学分记录，并根据排名自动评定等级
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resultsDialogVisible" :title="currentPeriod?.name + ' - 评优结果'" width="1000px" class="modern-dialog">
      <div class="results-header">
        <div class="filter-row">
          <el-select v-model="selectedLevel" placeholder="评优等级" clearable @change="fetchResults">
            <el-option label="全部" value="" />
            <el-option label="优秀" value="EXCELLENT" />
            <el-option label="良好" value="GOOD" />
            <el-option label="合格" value="QUALIFIED" />
            <el-option label="不合格" value="UNQUALIFIED" />
          </el-select>
        </div>
        <div class="level-stats">
          <div class="level-item excellent">
            <span class="count">{{ levelStats.excellent }}</span>
            <span class="label">优秀</span>
          </div>
          <div class="level-item good">
            <span class="count">{{ levelStats.good }}</span>
            <span class="label">良好</span>
          </div>
          <div class="level-item qualified">
            <span class="count">{{ levelStats.qualified }}</span>
            <span class="label">合格</span>
          </div>
          <div class="level-item unqualified">
            <span class="count">{{ levelStats.unqualified }}</span>
            <span class="label">不合格</span>
          </div>
        </div>
      </div>
      <el-table :data="results" v-loading="resultsLoading" style="width: 100%">
        <el-table-column type="index" label="排名" width="70" />
        <el-table-column label="学生信息" min-width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <span class="name">{{ row.user?.realName || row.user?.username }}</span>
              <span class="info">{{ row.user?.studentId }} · {{ row.user?.className }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="user.department.name" label="部门" width="120" />
        <el-table-column prop="totalCredit" label="总学分" width="100" align="center">
          <template #default="{ row }">
            <span class="credit-value">{{ row.totalCredit.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelColor(row.level)" size="small" effect="dark">
              {{ getLevelName(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="handleEditLevel(row)">调整等级</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="resultsPage"
          v-model:page-size="resultsPageSize"
          :total="resultsTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchResults"
          @size-change="fetchResults"
        />
      </div>
    </el-dialog>

    <el-dialog v-model="editLevelDialogVisible" title="调整评优等级" width="400px">
      <el-form label-width="80px">
        <el-form-item label="当前等级">
          <el-tag :type="getLevelColor(editingResult?.level)" effect="dark">
            {{ getLevelName(editingResult?.level) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="调整为">
          <el-select v-model="editLevel" placeholder="选择等级">
            <el-option label="优秀" value="EXCELLENT" />
            <el-option label="良好" value="GOOD" />
            <el-option label="合格" value="QUALIFIED" />
            <el-option label="不合格" value="UNQUALIFIED" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editRemark" type="textarea" :rows="2" placeholder="调整原因（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editLevelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveLevel">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import {
  getEvaluationPeriods,
  createEvaluationPeriod,
  calculateEvaluation,
  getEvaluationResults,
  updateEvaluationResult,
  deleteEvaluationPeriod
} from '@/api/credit'
import type { EvaluationPeriod, EvaluationResult } from '@/api/credit'

const loading = ref(false)
const submitting = ref(false)
const resultsLoading = ref(false)
const dialogVisible = ref(false)
const resultsDialogVisible = ref(false)
const editLevelDialogVisible = ref(false)
const periods = ref<EvaluationPeriod[]>([])
const results = ref<EvaluationResult[]>([])
const currentPeriod = ref<EvaluationPeriod | null>(null)
const editingResult = ref<EvaluationResult | null>(null)
const selectedLevel = ref('')
const editLevel = ref('')
const editRemark = ref('')
const resultsPage = ref(1)
const resultsPageSize = ref(20)
const resultsTotal = ref(0)
const formRef = ref<FormInstance>()

const formData = reactive({
  name: '',
  type: 'SEMESTER',
  startDate: '',
  endDate: ''
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入评优名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择评优类型', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

const levelStats = computed(() => {
  const stats = { excellent: 0, good: 0, qualified: 0, unqualified: 0 }
  results.value.forEach(r => {
    if (r.level === 'EXCELLENT') stats.excellent++
    else if (r.level === 'GOOD') stats.good++
    else if (r.level === 'QUALIFIED') stats.qualified++
    else stats.unqualified++
  })
  return stats
})

const getTypeName = (type: string) => {
  const map: Record<string, string> = {
    SEMESTER: '学期评优',
    YEAR: '年度评优',
    CUSTOM: '自定义评优'
  }
  return map[type] || type
}

const getTypeColor = (type: string) => {
  const map: Record<string, string> = {
    SEMESTER: 'primary',
    YEAR: 'success',
    CUSTOM: 'warning'
  }
  return map[type] || ''
}

const getStatusName = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: '待计算',
    CALCULATING: '计算中',
    PUBLISHED: '已发布'
  }
  return map[status] || status
}

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'warning',
    CALCULATING: 'info',
    PUBLISHED: 'success'
  }
  return map[status] || ''
}

const getLevelName = (level?: string) => {
  const map: Record<string, string> = {
    EXCELLENT: '优秀',
    GOOD: '良好',
    QUALIFIED: '合格',
    UNQUALIFIED: '不合格'
  }
  return map[level || ''] || level
}

const getLevelColor = (level?: string) => {
  const map: Record<string, string> = {
    EXCELLENT: 'success',
    GOOD: 'primary',
    QUALIFIED: 'warning',
    UNQUALIFIED: 'danger'
  }
  return map[level || ''] || ''
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const fetchPeriods = async () => {
  loading.value = true
  try {
    const res = await getEvaluationPeriods()
    periods.value = (res.data || []).map(p => ({ ...p, calculating: false }))
  } catch (error) {
    console.error('Failed to fetch periods:', error)
    ElMessage.error('获取评优周期失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  Object.assign(formData, {
    name: '',
    type: 'SEMESTER',
    startDate: '',
    endDate: ''
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await createEvaluationPeriod({
          name: formData.name,
          type: formData.type,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString()
        })
        ElMessage.success('创建成功')
        dialogVisible.value = false
        fetchPeriods()
      } catch (error) {
        console.error(error)
        ElMessage.error('创建失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleCalculate = async (period: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要计算「${period.name}」的评优结果吗？系统将自动统计该时间段内的学分并排名。`,
      '确认计算',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    
    period.calculating = true
    const res = await calculateEvaluation(period.id)
    ElMessage.success(`计算完成，共 ${res.data?.totalUsers} 人参评`)
    fetchPeriods()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error('计算失败')
    }
  } finally {
    period.calculating = false
  }
}

const handleViewResults = (period: EvaluationPeriod) => {
  currentPeriod.value = period
  selectedLevel.value = ''
  resultsPage.value = 1
  fetchResults()
  resultsDialogVisible.value = true
}

const fetchResults = async () => {
  if (!currentPeriod.value) return
  resultsLoading.value = true
  try {
    const res = await getEvaluationResults(currentPeriod.value.id, {
      level: selectedLevel.value || undefined,
      page: resultsPage.value,
      pageSize: resultsPageSize.value
    })
    results.value = res.data?.list || []
    resultsTotal.value = res.data?.total || 0
  } catch (error) {
    console.error('Failed to fetch results:', error)
  } finally {
    resultsLoading.value = false
  }
}

const handleEditLevel = (result: EvaluationResult) => {
  editingResult.value = result
  editLevel.value = result.level
  editRemark.value = result.remark || ''
  editLevelDialogVisible.value = true
}

const handleSaveLevel = async () => {
  if (!editingResult.value) return
  try {
    await updateEvaluationResult(editingResult.value.id, {
      level: editLevel.value,
      remark: editRemark.value
    })
    ElMessage.success('修改成功')
    editLevelDialogVisible.value = false
    fetchResults()
  } catch (error) {
    console.error(error)
    ElMessage.error('修改失败')
  }
}

const handleExport = (period: EvaluationPeriod) => {
  ElMessage.info('导出功能开发中...')
}

const handleDelete = (period: EvaluationPeriod) => {
  ElMessageBox.confirm(`确定要删除「${period.name}」吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteEvaluationPeriod(period.id)
      ElMessage.success('删除成功')
      fetchPeriods()
    } catch (error) {
      console.error(error)
      ElMessage.error('删除失败')
    }
  })
}

onMounted(() => {
  fetchPeriods()
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

.period-list {
  padding: 0;
  overflow: hidden;

  .card-header {
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .filter-row {
    display: flex;
    gap: 12px;
  }

  .level-stats {
    display: flex;
    gap: 16px;

    .level-item {
      text-align: center;
      padding: 8px 16px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);

      .count {
        display: block;
        font-size: 20px;
        font-weight: 700;
      }

      .label {
        font-size: 12px;
        color: var(--text-muted);
      }

      &.excellent .count { color: #10b981; }
      &.good .count { color: #3b82f6; }
      &.qualified .count { color: #f59e0b; }
      &.unqualified .count { color: #ef4444; }
    }
  }
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
  color: var(--primary-color);
}

.pagination-wrapper {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.form-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
}
</style>
