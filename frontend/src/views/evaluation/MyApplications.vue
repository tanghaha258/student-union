<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>我的申请</h1>
        <p>查看评优申请记录和状态</p>
      </div>
    </div>

    <div class="filter-card glass-card">
      <el-select v-model="selectedStatus" placeholder="申请状态" clearable @change="handleSearch">
        <el-option label="全部" value="" />
        <el-option label="待审核" value="PENDING" />
        <el-option label="评审中" value="REVIEWING" />
        <el-option label="已通过" value="APPROVED" />
        <el-option label="未通过" value="REJECTED" />
      </el-select>
    </div>

    <div class="table-card glass-card" v-loading="loading">
      <el-table :data="applicationList" class="modern-table">
        <el-table-column label="评优名称" min-width="200">
          <template #default="{ row }">
            <div class="activity-info">
              <span class="type-tag" :class="row.activity?.type">{{ getTypeText(row.activity?.type) }}</span>
              <span class="title">{{ row.activity?.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <div class="status-badge" :class="row.status">
              <span class="status-dot"></span>
              {{ getStatusText(row.status) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="得分" width="100">
          <template #default="{ row }">
            <span class="score" v-if="row.totalScore">{{ row.totalScore.toFixed(1) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="排名" width="80">
          <template #default="{ row }">
            <span class="rank" v-if="row.rank">{{ row.rank }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="handleViewDetail(row)">查看详情</el-button>
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
          @current-change="fetchApplications"
          @size-change="fetchApplications"
        />
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="申请详情" width="600px" class="modern-dialog">
      <div class="detail-content" v-if="currentApplication">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="info-row">
            <span class="label">评优名称：</span>
            <span class="value">{{ currentApplication.activity?.title }}</span>
          </div>
          <div class="info-row">
            <span class="label">评优类型：</span>
            <span class="type-tag" :class="currentApplication.activity?.type">{{ getTypeText(currentApplication.activity?.type) }}</span>
          </div>
          <div class="info-row">
            <span class="label">当前状态：</span>
            <div class="status-badge" :class="currentApplication.status">
              <span class="status-dot"></span>
              {{ getStatusText(currentApplication.status) }}
            </div>
          </div>
          <div class="info-row" v-if="currentApplication.totalScore">
            <span class="label">评审得分：</span>
            <span class="score">{{ currentApplication.totalScore.toFixed(1) }}</span>
          </div>
          <div class="info-row" v-if="currentApplication.rank">
            <span class="label">最终排名：</span>
            <span class="rank">第 {{ currentApplication.rank }} 名</span>
          </div>
        </div>
        <div class="detail-section">
          <h4>自我评价</h4>
          <p class="evaluation-text">{{ currentApplication.selfEvaluation || '暂无' }}</p>
        </div>
        <div class="detail-section" v-if="currentApplication.reviews?.length">
          <h4>评审记录</h4>
          <div class="review-list">
            <div class="review-item" v-for="review in currentApplication.reviews" :key="review.id">
              <div class="reviewer">{{ review.reviewer?.nickname || review.reviewer?.username }}</div>
              <div class="review-score">{{ review.score }}分</div>
              <div class="review-comment" v-if="review.comment">{{ review.comment }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyApplications } from '@/api/evaluation'
import type { EvaluationApplication } from '@/api/evaluation'

const loading = ref(false)
const selectedStatus = ref('')
const detailDialogVisible = ref(false)
const currentApplication = ref<EvaluationApplication | null>(null)

const applicationList = ref<EvaluationApplication[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const getTypeText = (type?: string) => {
  if (!type) return '-'
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
    PENDING: '待审核',
    REVIEWING: '评审中',
    APPROVED: '已通过',
    REJECTED: '未通过'
  }
  return map[status] || status
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const fetchApplications = async () => {
  loading.value = true
  try {
    const res = await getMyApplications({
      page: page.value,
      pageSize: pageSize.value,
      status: selectedStatus.value
    })
    applicationList.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('Failed to fetch applications:', error)
    ElMessage.error('获取申请列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchApplications()
}

const handleViewDetail = (row: EvaluationApplication) => {
  currentApplication.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
  fetchApplications()
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

  .activity-info {
    display: flex;
    align-items: center;
    gap: 10px;

    .type-tag {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
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

    .title {
      font-weight: 600;
      color: var(--text-primary);
    }
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

    &.PENDING {
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;

      .status-dot {
        background: #fbbf24;
      }
    }

    &.REVIEWING {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;

      .status-dot {
        background: #60a5fa;
      }
    }

    &.APPROVED {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;

      .status-dot {
        background: #34d399;
      }
    }

    &.REJECTED {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;

      .status-dot {
        background: #f87171;
      }
    }
  }

  .score {
    font-weight: 700;
    color: var(--primary-light);
  }

  .rank {
    font-weight: 700;
    color: #fbbf24;
  }

  .text-muted {
    color: var(--text-muted);
  }
}

.pagination-wrapper {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-content {
  .detail-section {
    margin-bottom: 24px;

    h4 {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 12px;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .label {
        color: var(--text-muted);
        font-size: 14px;
      }

      .value {
        color: var(--text-primary);
        font-size: 14px;
      }
    }

    .evaluation-text {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.8;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: var(--radius-md);
    }

    .review-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .review-item {
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: var(--radius-md);

        .reviewer {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .review-score {
          font-weight: 700;
          color: var(--primary-light);
          margin-bottom: 4px;
        }

        .review-comment {
          font-size: 13px;
          color: var(--text-secondary);
        }
      }
    }
  }
}
</style>
