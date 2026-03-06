<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>通知管理</h1>
        <p>管理系统通知，支持紧急、重要、普通三种优先级</p>
      </div>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        发布通知
      </el-button>
    </div>

    <div class="table-card glass-card">
      <el-table :data="notificationList" v-loading="loading" style="width: 100%">
        <el-table-column label="通知信息" min-width="250">
          <template #default="{ row }">
            <div class="notification-cell">
              <div class="notification-title">
                <span>{{ row.title }}</span>
                <el-tag 
                  :type="row.priority === 1 ? 'danger' : row.priority === 2 ? 'warning' : 'info'"
                  effect="dark"
                  size="small"
                >
                  {{ row.priority === 1 ? '紧急' : row.priority === 2 ? '重要' : '普通' }}
                </el-tag>
              </div>
              <div class="notification-content">{{ row.content }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="接收对象" width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">
              {{ getTargetTypeName(row.targetType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布者" width="120">
          <template #default="{ row }">
            {{ row.sender?.realName || row.sender?.username }}
          </template>
        </el-table-column>
        <el-table-column label="已读/发送" width="120">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="handleViewReadStatus(row)">
              {{ row._count?.reads || 0 }} 人已读
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发布时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="100">
          <template #default="{ row }">
            <el-button type="danger" text size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" title="发布通知" width="550px" class="modern-dialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入通知标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input 
            v-model="formData.content" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入通知内容"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="formData.priority">
            <el-radio :value="1">
              <el-tag type="danger" effect="dark" size="small">紧急</el-tag>
              <span class="priority-desc">登录后强制弹窗，必须确认</span>
            </el-radio>
            <el-radio :value="2">
              <el-tag type="warning" effect="dark" size="small">重要</el-tag>
              <span class="priority-desc">登录后弹窗提醒</span>
            </el-radio>
            <el-radio :value="3">
              <el-tag type="info" effect="dark" size="small">普通</el-tag>
              <span class="priority-desc">仅显示在通知中心</span>
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="接收对象" prop="targetType">
          <el-select v-model="formData.targetType" placeholder="请选择接收对象" style="width: 100%">
            <el-option label="全体成员" value="ALL" />
            <el-option label="指定角色" value="ROLE" />
            <el-option label="指定部门" value="DEPARTMENT" />
            <el-option label="指定用户" value="USER" />
          </el-select>
        </el-form-item>
        <el-form-item 
          v-if="formData.targetType === 'ROLE'" 
          label="选择角色" 
          prop="targetIds"
        >
          <el-select v-model="formData.targetIds" multiple placeholder="请选择角色" style="width: 100%">
            <el-option label="超级管理员" value="ADMIN" />
            <el-option label="学生会主席" value="PRESIDENT" />
            <el-option label="副主席" value="VICE_PRESIDENT" />
            <el-option label="部长" value="MINISTER" />
            <el-option label="成员" value="MEMBER" />
          </el-select>
        </el-form-item>
        <el-form-item 
          v-if="formData.targetType === 'DEPARTMENT'" 
          label="选择部门" 
          prop="targetIds"
        >
          <el-select v-model="formData.targetIds" multiple placeholder="请选择部门" style="width: 100%">
            <el-option 
              v-for="dept in departmentList" 
              :key="dept.id" 
              :label="dept.name" 
              :value="dept.id" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">发布</el-button>
      </template>
    </el-dialog>

    <!-- 已读回执弹窗 -->
    <el-dialog v-model="readStatusDialogVisible" title="已读回执" width="800px" class="modern-dialog">
      <div class="read-status-summary">
        <div class="summary-item">
          <span class="label">发送人数</span>
          <span class="value">{{ readStatusData.total }}</span>
        </div>
        <div class="summary-item success">
          <span class="label">已读人数</span>
          <span class="value">{{ readStatusData.readCount }}</span>
        </div>
        <div class="summary-item warning">
          <span class="label">未读人数</span>
          <span class="value">{{ readStatusData.unreadCount }}</span>
        </div>
      </div>
      <el-table :data="readStatusData.users" max-height="400" v-loading="readStatusLoading">
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="realName" label="姓名" width="100">
          <template #default="{ row }">
            {{ row.realName || row.username }}
          </template>
        </el-table-column>
        <el-table-column prop="className" label="班级" width="120" />
        <el-table-column prop="department.name" label="部门" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isRead ? 'success' : 'warning'" size="small">
              {{ row.isRead ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="readAt" label="阅读时间" width="160">
          <template #default="{ row }">
            {{ row.readAt ? formatTime(row.readAt) : '-' }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { getAllNotifications, createNotification, deleteNotification, getNotificationReadStatus } from '@/api/notification'
import { getDepartmentList } from '@/api/departments'

const loading = ref(false)
const submitting = ref(false)
const readStatusLoading = ref(false)
const dialogVisible = ref(false)
const readStatusDialogVisible = ref(false)
const notificationList = ref<any[]>([])
const departmentList = ref<any[]>([])
const readStatusData = ref<{
  total: number
  readCount: number
  unreadCount: number
  users: any[]
}>({
  total: 0,
  readCount: 0,
  unreadCount: 0,
  users: []
})
const formRef = ref<FormInstance>()

const formData = reactive({
  title: '',
  content: '',
  priority: 3,
  targetType: 'ALL',
  targetIds: [] as string[]
})

const formRules: FormRules = {
  title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  targetType: [{ required: true, message: '请选择接收对象', trigger: 'change' }]
}

const getTargetTypeName = (type: string) => {
  const map: Record<string, string> = {
    ALL: '全体成员',
    ROLE: '指定角色',
    DEPARTMENT: '指定部门',
    USER: '指定用户'
  }
  return map[type] || type
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    const res = await getAllNotifications()
    notificationList.value = res.data || []
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    ElMessage.error('获取通知列表失败')
  } finally {
    loading.value = false
  }
}

const fetchDepartments = async () => {
  try {
    const res = await getDepartmentList()
    departmentList.value = res.data || []
  } catch (error) {
    console.error('Failed to fetch departments:', error)
  }
}

const handleCreate = () => {
  Object.assign(formData, {
    title: '',
    content: '',
    priority: 3,
    targetType: 'ALL',
    targetIds: []
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await createNotification({
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          targetType: formData.targetType,
          targetIds: formData.targetIds
        })
        ElMessage.success('发布成功')
        dialogVisible.value = false
        fetchNotifications()
      } catch (error) {
        console.error('Failed to create notification:', error)
        ElMessage.error('发布失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleViewReadStatus = async (notification: any) => {
  readStatusLoading.value = true
  readStatusDialogVisible.value = true
  readStatusData.value = { total: 0, readCount: 0, unreadCount: 0, users: [] }
  
  try {
    const res = await getNotificationReadStatus(notification.id)
    readStatusData.value = res.data
  } catch (error) {
    console.error('Failed to fetch read status:', error)
    ElMessage.error('获取已读状态失败')
  } finally {
    readStatusLoading.value = false
  }
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除通知"${row.title}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteNotification(row.id)
      ElMessage.success('删除成功')
      fetchNotifications()
    } catch (error) {
      console.error('Failed to delete notification:', error)
      ElMessage.error('删除失败')
    }
  })
}

onMounted(() => {
  fetchNotifications()
  fetchDepartments()
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

.table-card {
  padding: 0;
  overflow: hidden;
}

.notification-cell {
  .notification-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    span {
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .notification-content {
    font-size: 13px;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 400px;
  }
}

.priority-desc {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.read-status-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;

  .summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .label {
      font-size: 13px;
      color: var(--text-muted);
    }

    .value {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }

    &.success .value {
      color: #22c55e;
    }

    &.warning .value {
      color: #f59e0b;
    }
  }
}

:deep(.el-radio) {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
</style>
