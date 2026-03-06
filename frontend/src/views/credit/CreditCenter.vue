<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>学分中心</h1>
        <p>查看个人学分记录和评优结果</p>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <el-icon><Trophy /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalCredits.toFixed(1) }}</div>
          <div class="stat-label">总学分</div>
        </div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ getCreditByType('COMPREHENSIVE').toFixed(1) }}</div>
          <div class="stat-label">综合测评</div>
        </div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <el-icon><Reading /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ getCreditByType('SECOND_CLASSROOM').toFixed(1) }}</div>
          <div class="stat-label">第二课堂</div>
        </div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ (getCreditByType('VOLUNTEER') + getCreditByType('SPORTS_CULTURE')).toFixed(1) }}</div>
          <div class="stat-label">志愿/文体</div>
        </div>
      </div>
    </div>

    <div class="content-row">
      <div class="credit-list glass-card">
        <div class="card-header">
          <h3>学分明细</h3>
          <div class="filter-group">
            <el-select v-model="selectedType" placeholder="学分类型" clearable size="small" @change="fetchMyCredits">
              <el-option label="全部" value="" />
              <el-option label="综合测评" value="COMPREHENSIVE" />
              <el-option label="第二课堂" value="SECOND_CLASSROOM" />
              <el-option label="志愿服务" value="VOLUNTEER" />
              <el-option label="文体活动" value="SPORTS_CULTURE" />
            </el-select>
          </div>
        </div>
        <el-table :data="creditRecords" v-loading="loading" style="width: 100%">
          <el-table-column label="来源" min-width="200">
            <template #default="{ row }">
              <div class="source-cell">
                <el-tag :type="getSourceType(row.source)" size="small" effect="dark">
                  {{ getSourceText(row.source) }}
                </el-tag>
                <span class="source-desc">{{ row.description || row.activity?.title || '手动添加' }}</span>
              </div>
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
              <span class="credit-value">+{{ row.value }}</span>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="ranking-card glass-card">
        <div class="card-header">
          <h3>学分排行</h3>
        </div>
        <div class="ranking-list" v-loading="rankingLoading">
          <div 
            v-for="(item, index) in rankings" 
            :key="item.userId" 
            class="ranking-item"
            :class="{ 'is-me': item.userId === userId }"
          >
            <div class="rank-badge" :class="getRankClass(index)">
              {{ index + 1 }}
            </div>
            <div class="rank-info">
              <span class="rank-name">{{ item.realName || item.username }}</span>
              <span class="rank-class">{{ item.className }}</span>
            </div>
            <div class="rank-credit">{{ item.totalCredit.toFixed(1) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="evaluation-section glass-card">
      <div class="card-header">
        <h3>我的评优结果</h3>
      </div>
      <el-table :data="evaluationResults" v-loading="evaluationLoading" style="width: 100%">
        <el-table-column prop="period.name" label="评优周期" min-width="150" />
        <el-table-column label="周期类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getPeriodTypeName(row.period?.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalCredit" label="总学分" width="100" align="center" />
        <el-table-column prop="rank" label="排名" width="100" align="center" />
        <el-table-column label="等级" width="120">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small" effect="dark">
              {{ getLevelName(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { getMyCredits, getCreditRanking, getMyEvaluationResults } from '@/api/credit'
import type { CreditRecord, CreditStats, EvaluationResult } from '@/api/credit'

const userStore = useUserStore()
const userId = computed(() => userStore.userInfo?.id)

const loading = ref(false)
const rankingLoading = ref(false)
const evaluationLoading = ref(false)
const creditRecords = ref<CreditRecord[]>([])
const creditStats = ref<CreditStats[]>([])
const totalCredits = ref(0)
const rankings = ref<any[]>([])
const evaluationResults = ref<EvaluationResult[]>([])
const selectedType = ref('')

const getCreditByType = (type: string) => {
  const stat = creditStats.value.find(s => s.type === type)
  return stat?.value || 0
}

const getSourceType = (source: string) => {
  return source === 'ACTIVITY' ? 'success' : 'primary'
}

const getSourceText = (source: string) => {
  return source === 'ACTIVITY' ? '活动' : '手动'
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

const getRankClass = (index: number) => {
  if (index === 0) return 'gold'
  if (index === 1) return 'silver'
  if (index === 2) return 'bronze'
  return ''
}

const getPeriodTypeName = (type?: string) => {
  const map: Record<string, string> = {
    SEMESTER: '学期评优',
    YEAR: '年度评优',
    CUSTOM: '自定义评优'
  }
  return map[type || ''] || type
}

const getLevelType = (level: string) => {
  const map: Record<string, string> = {
    EXCELLENT: 'success',
    GOOD: 'primary',
    QUALIFIED: 'warning',
    UNQUALIFIED: 'danger'
  }
  return map[level] || ''
}

const getLevelName = (level: string) => {
  const map: Record<string, string> = {
    EXCELLENT: '优秀',
    GOOD: '良好',
    QUALIFIED: '合格',
    UNQUALIFIED: '不合格'
  }
  return map[level] || level
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const fetchMyCredits = async () => {
  loading.value = true
  try {
    const res = await getMyCredits({ type: selectedType.value || undefined })
    creditRecords.value = res.data?.records || []
    creditStats.value = res.data?.stats || []
    totalCredits.value = res.data?.totalCredits || 0
  } catch (error) {
    console.error('Failed to fetch credits:', error)
  } finally {
    loading.value = false
  }
}

const fetchRankings = async () => {
  rankingLoading.value = true
  try {
    const res = await getCreditRanking({ limit: 10 })
    rankings.value = res.data || []
  } catch (error) {
    console.error('Failed to fetch rankings:', error)
  } finally {
    rankingLoading.value = false
  }
}

const fetchEvaluationResults = async () => {
  evaluationLoading.value = true
  try {
    const res = await getMyEvaluationResults()
    evaluationResults.value = res.data || []
  } catch (error) {
    console.error('Failed to fetch evaluation results:', error)
  } finally {
    evaluationLoading.value = false
  }
}

onMounted(() => {
  fetchMyCredits()
  fetchRankings()
  fetchEvaluationResults()
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

.content-row {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  margin-bottom: 24px;
}

.credit-list, .ranking-card, .evaluation-section {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
}

.source-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .source-desc {
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.credit-value {
  color: #10b981;
  font-weight: 600;
  font-size: 15px;
}

.ranking-list {
  max-height: 400px;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &.is-me {
    background: rgba(64, 158, 255, 0.1);
    border: 1px solid rgba(64, 158, 255, 0.3);
  }

  .rank-badge {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-secondary);

    &.gold {
      background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
      color: #000;
    }

    &.silver {
      background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%);
      color: #000;
    }

    &.bronze {
      background: linear-gradient(135deg, #cd7f32 0%, #b87333 100%);
      color: #fff;
    }
  }

  .rank-info {
    flex: 1;

    .rank-name {
      display: block;
      font-weight: 500;
      color: var(--text-primary);
    }

    .rank-class {
      font-size: 12px;
      color: var(--text-muted);
    }
  }

  .rank-credit {
    font-weight: 600;
    color: var(--primary-color);
  }
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .content-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
