<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>公告管理</h1>
        <p>发布和管理学生会通知公告</p>
      </div>
      <el-button type="primary" class="add-btn" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        发布公告
      </el-button>
    </div>

    <div class="filter-card glass-card">
      <div class="filter-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索公告标题"
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-select v-model="filterPublished" placeholder="发布状态" clearable>
          <el-option label="全部状态" value="" />
          <el-option label="已发布" value="true" />
          <el-option label="草稿" value="false" />
        </el-select>
      </div>
    </div>

    <div class="table-card glass-card">
      <el-table :data="announcementList" v-loading="loading" class="modern-table">
        <el-table-column label="公告信息" min-width="300">
          <template #default="{ row }">
            <div class="announcement-cell">
              <div class="priority-indicator" :class="'priority-' + row.priority"></div>
              <div class="announcement-info">
                <span class="title">{{ row.title }}</span>
                <span class="preview">{{ row.content?.substring(0, 50) }}...</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="发布人" width="120">
          <template #default="{ row }">
            <span class="author">{{ row.author?.username || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <div class="priority-badge" :class="'priority-' + row.priority">
              {{ getPriorityText(row.priority) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <div class="status-badge" :class="row.isPublished ? 'published' : 'draft'">
              <span class="status-dot"></span>
              {{ row.isPublished ? '已发布' : '草稿' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发布时间" width="160" />
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" text size="small" @click="handleView(row)">
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-button type="primary" text size="small" @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
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
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" class="modern-dialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px" class="modern-form">
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="formData.content" type="textarea" :rows="8" placeholder="请输入公告内容" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-rate v-model="formData.priority" :max="3" show-score />
        </el-form-item>
        <el-form-item label="立即发布" prop="isPublished">
          <el-switch v-model="formData.isPublished" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="公告详情" width="600px" class="modern-dialog">
      <div class="announcement-detail" v-if="currentAnnouncement">
        <h2 class="detail-title">{{ currentAnnouncement.title }}</h2>
        <div class="detail-meta">
          <span><el-icon><User /></el-icon> {{ currentAnnouncement.author?.username || '-' }}</span>
          <span><el-icon><Calendar /></el-icon> {{ currentAnnouncement.createdAt }}</span>
        </div>
        <div class="detail-content">{{ currentAnnouncement.content }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/api/announcements'

const loading = ref(false)
const searchKeyword = ref('')
const filterPublished = ref('')
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const dialogTitle = ref('发布公告')
const formRef = ref<FormInstance>()
const currentAnnouncement = ref<any>(null)

const announcementList = ref<any[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive({
  id: '',
  title: '',
  content: '',
  priority: 1,
  isPublished: true
})

const formRules: FormRules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }]
}

const getPriorityText = (priority: number) => {
  if (priority >= 3) return '重要'
  if (priority >= 2) return '一般'
  return '普通'
}

const handleAdd = () => {
  dialogTitle.value = '发布公告'
  Object.assign(formData, { id: '', title: '', content: '', priority: 1, isPublished: true })
  dialogVisible.value = true
}

const handleView = (row: any) => {
  currentAnnouncement.value = row
  viewDialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑公告'
  Object.assign(formData, row)
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除公告 "${row.title}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteAnnouncement(row.id)
      ElMessage.success('删除成功')
      fetchAnnouncements()
    } catch (error) {
      console.error(error)
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (formData.id) {
          await updateAnnouncement(formData.id, formData)
          ElMessage.success('修改成功')
        } else {
          await createAnnouncement(formData)
          ElMessage.success('发布成功')
        }
        dialogVisible.value = false
        fetchAnnouncements()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const fetchAnnouncements = async () => {
  loading.value = true
  try {
    const res = await getAnnouncements({
      page: pagination.page,
      pageSize: pagination.pageSize,
      isPublished: filterPublished.value || undefined
    })
    announcementList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error(error)
    announcementList.value = [
      { id: '1', title: '关于学生会换届选举的通知', content: '根据学校工作安排，将于2024年3月15日举行学生会换届选举，请各部门做好准备工作。', author: { username: 'admin' }, priority: 3, isPublished: true, createdAt: '2024-01-10 10:00' },
      { id: '2', title: '春季运动会志愿者招募', content: '为保障春季运动会顺利进行，现面向全体学生会成员招募志愿者，有意者请联系组织部。', author: { username: 'zhangsan' }, priority: 2, isPublished: true, createdAt: '2024-01-08 14:30' },
      { id: '3', title: '学生会例会通知', content: '本周五下午3点召开学生会例会，请各部门部长准时参加。', author: { username: 'admin' }, priority: 1, isPublished: true, createdAt: '2024-01-05 09:00' }
    ]
    pagination.total = 3
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAnnouncements()
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

  .add-btn {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.filter-card {
  padding: 20px;
  margin-bottom: 20px;

  .filter-row {
    display: flex;
    gap: 16px;

    .search-input {
      width: 280px;
    }

    .el-select {
      width: 150px;
    }
  }
}

.table-card {
  padding: 0;
  overflow: hidden;

  .announcement-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .priority-indicator {
      width: 4px;
      height: 40px;
      border-radius: 2px;
      flex-shrink: 0;

      &.priority-3 {
        background: linear-gradient(180deg, #ef4444 0%, #f97316 100%);
      }

      &.priority-2 {
        background: linear-gradient(180deg, #f59e0b 0%, #eab308 100%);
      }

      &.priority-1 {
        background: linear-gradient(180deg, #3b82f6 0%, #06b6d4 100%);
      }
    }

    .announcement-info {
      display: flex;
      flex-direction: column;

      .title {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .preview {
        font-size: 12px;
        color: var(--text-muted);
      }
    }
  }

  .priority-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;

    &.priority-3 {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }

    &.priority-2 {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
    }

    &.priority-1 {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
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

    &.published {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;

      .status-dot {
        background: #34d399;
      }
    }

    &.draft {
      background: rgba(107, 114, 128, 0.15);
      color: #9ca3af;

      .status-dot {
        background: #9ca3af;
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }
}

.pagination-wrapper {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.announcement-detail {
  .detail-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 16px;
  }

  .detail-meta {
    display: flex;
    gap: 24px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    span {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: var(--text-muted);
    }
  }

  .detail-content {
    font-size: 15px;
    color: var(--text-secondary);
    line-height: 1.8;
    white-space: pre-wrap;
  }
}
</style>
