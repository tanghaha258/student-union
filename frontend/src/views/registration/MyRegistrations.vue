<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>我的报名</h1>
        <p>查看已报名的活动记录</p>
      </div>
    </div>

    <div class="filter-card glass-card">
      <el-select v-model="selectedStatus" placeholder="报名状态" clearable @change="handleSearch">
        <el-option label="全部" value="" />
        <el-option label="待审核" value="PENDING" />
        <el-option label="已通过" value="APPROVED" />
        <el-option label="已拒绝" value="REJECTED" />
        <el-option label="已取消" value="CANCELLED" />
      </el-select>
    </div>

    <div class="table-card glass-card" v-loading="loading">
      <el-table :data="registrationList" class="modern-table">
        <el-table-column label="活动名称" min-width="200">
          <template #default="{ row }">
            <span class="activity-title">{{ row.activity?.title }}</span>
          </template>
        </el-table-column>
        <el-table-column label="活动时间" width="140">
          <template #default="{ row }">
            {{ formatDate(row.activity?.eventDate) }}
          </template>
        </el-table-column>
        <el-table-column label="活动地点" width="120">
          <template #default="{ row }">
            {{ row.activity?.location || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="报名状态" width="120">
          <template #default="{ row }">
            <div class="status-badge" :class="getStatusClass(row.status)">
              <span class="status-dot"></span>
              {{ getStatusText(row.status) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="报名时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'PENDING'"
              type="danger"
              text
              size="small"
              @click="handleCancel(row)"
            >
              取消报名
            </el-button>
            <span v-else class="text-muted">-</span>
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
          @current-change="fetchRegistrations"
          @size-change="fetchRegistrations"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyRegistrations, cancelRegistration } from '@/api/registration'
import type { Registration } from '@/api/registration'

const loading = ref(false)
const selectedStatus = ref('')
const registrationList = ref<Registration[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
  }
  return map[status] || ''
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    CANCELLED: '已取消'
  }
  return map[status] || status
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const fetchRegistrations = async () => {
  loading.value = true
  try {
    const res = await getMyRegistrations({
      page: page.value,
      pageSize: pageSize.value,
      status: selectedStatus.value
    })
    registrationList.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('Failed to fetch registrations:', error)
    ElMessage.error('获取报名记录失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchRegistrations()
}

const handleCancel = (row: Registration) => {
  ElMessageBox.confirm('确定要取消报名吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await cancelRegistration(row.id)
      ElMessage.success('取消报名成功')
      fetchRegistrations()
    } catch (error) {
      console.error(error)
    }
  })
}

onMounted(() => {
  fetchRegistrations()
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
  margin-bottom: 20px;

  .el-select {
    width: 150px;
  }
}

.table-card {
  padding: 0;
  overflow: hidden;

  .activity-title {
    font-weight: 600;
    color: var(--text-primary);
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    &.pending {
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;

      .status-dot {
        background: #fbbf24;
      }
    }

    &.approved {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;

      .status-dot {
        background: #34d399;
      }
    }

    &.rejected {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;

      .status-dot {
        background: #f87171;
      }
    }

    &.cancelled {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-muted);

      .status-dot {
        background: var(--text-muted);
      }
    }
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
