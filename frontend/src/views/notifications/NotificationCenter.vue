<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>通知中心</h1>
        <p>查看系统通知和公告</p>
      </div>
      <el-button type="primary" text @click="handleMarkAllRead" :disabled="unreadCount === 0">
        <el-icon><Check /></el-icon>
        全部已读
      </el-button>
    </div>

    <div class="notification-tabs glass-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane name="all">
          <template #label>
            <span>全部通知 <el-badge :value="total" :max="99" class="tab-badge" /></span>
          </template>
        </el-tab-pane>
        <el-tab-pane name="unread">
          <template #label>
            <span>未读 <el-badge :value="unreadCount" :max="99" class="tab-badge" type="danger" /></span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="紧急" name="urgent" />
        <el-tab-pane label="重要" name="important" />
      </el-tabs>
    </div>

    <div class="notification-list glass-card">
      <div v-if="loading" class="loading-wrapper">
        <el-skeleton :rows="3" animated />
      </div>
      <div v-else-if="notifications.length === 0" class="empty-wrapper">
        <el-empty description="暂无通知" />
      </div>
      <div v-else class="notification-items">
        <div 
          v-for="item in notifications" 
          :key="item.id" 
          class="notification-item"
          :class="{ unread: !item.isRead }"
          @click="handleViewDetail(item)"
        >
          <div class="item-icon">
            <el-icon :class="getPriorityClass(item.priority)">
              <Bell />
            </el-icon>
          </div>
          <div class="item-content">
            <div class="item-header">
              <span class="item-title">{{ item.title }}</span>
              <el-tag 
                :type="item.priority === 1 ? 'danger' : item.priority === 2 ? 'warning' : 'info'"
                size="small"
                effect="dark"
              >
                {{ item.priority === 1 ? '紧急' : item.priority === 2 ? '重要' : '普通' }}
              </el-tag>
            </div>
            <div class="item-desc">{{ item.content }}</div>
            <div class="item-footer">
              <span class="item-time">{{ formatTime(item.createdAt) }}</span>
              <span class="item-sender" v-if="item.sender">发布者：{{ item.sender.realName || item.sender.username }}</span>
            </div>
          </div>
          <div class="item-action">
            <el-icon v-if="!item.isRead"><View /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <el-dialog 
      v-model="detailVisible" 
      :title="currentNotification?.title"
      width="600px"
      class="modern-dialog"
      append-to-body
    >
      <div class="notification-detail" v-if="currentNotification">
        <div class="detail-meta">
          <el-tag 
            :type="currentNotification.priority === 1 ? 'danger' : currentNotification.priority === 2 ? 'warning' : 'info'"
            effect="dark"
          >
            {{ currentNotification.priority === 1 ? '紧急' : currentNotification.priority === 2 ? '重要' : '普通' }}
          </el-tag>
          <span class="detail-time">{{ formatTime(currentNotification.createdAt) }}</span>
        </div>
        <el-divider />
        <div class="detail-content">{{ currentNotification.content }}</div>
        <div class="detail-footer" v-if="currentNotification.sender">
          <span>发布者：{{ currentNotification.sender.realName || currentNotification.sender.username }}</span>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="detailVisible = false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getNotifications, markAsRead, markAllAsRead } from '@/api/notification'

interface Notification {
  id: string
  title: string
  content: string
  priority: number
  isRead: boolean
  createdAt: string
  sender?: {
    id: string
    username: string
    realName?: string
  }
}

const loading = ref(false)
const activeTab = ref('all')
const notifications = ref<Notification[]>([])
const total = ref(0)
const unreadCount = ref(0)
const detailVisible = ref(false)
const currentNotification = ref<Notification | null>(null)

const getPriorityClass = (priority: number) => {
  if (priority === 1) return 'urgent'
  if (priority === 2) return 'important'
  return 'normal'
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 1 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    const res = await getNotifications()
    notifications.value = res.data || []
    total.value = notifications.value.length
    unreadCount.value = notifications.value.filter(n => !n.isRead).length
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    ElMessage.error('获取通知失败')
  } finally {
    loading.value = false
  }
}

const handleTabChange = (tab: string) => {
  // 根据tab过滤通知
}

const handleViewDetail = async (item: Notification) => {
  currentNotification.value = item
  detailVisible.value = true
  
  if (!item.isRead) {
    try {
      await markAsRead(item.id)
      item.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }
}

const handleMarkAllRead = async () => {
  try {
    await markAllAsRead()
    notifications.value.forEach(n => n.isRead = true)
    unreadCount.value = 0
    ElMessage.success('已全部标记为已读')
  } catch (error) {
    console.error('Failed to mark all as read:', error)
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  fetchNotifications()
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

.notification-tabs {
  padding: 16px 20px 0;
  margin-bottom: 20px;

  .tab-badge {
    margin-left: 6px;
  }
}

.notification-list {
  padding: 0;
  min-height: 400px;
}

.loading-wrapper, .empty-wrapper {
  padding: 40px;
}

.notification-items {
  .notification-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    &.unread {
      background: rgba(64, 158, 255, 0.05);
    }

    .item-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);

      .el-icon {
        font-size: 20px;

        &.urgent {
          color: #f56c6c;
        }

        &.important {
          color: #e6a23c;
        }

        &.normal {
          color: #909399;
        }
      }
    }

    .item-content {
      flex: 1;

      .item-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .item-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }
      }

      .item-desc {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 500px;
      }

      .item-footer {
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: var(--text-muted);
      }
    }

    .item-action {
      .el-icon {
        color: var(--primary-color);
      }
    }
  }
}

.notification-detail {
  .detail-meta {
    display: flex;
    align-items: center;
    gap: 12px;

    .detail-time {
      font-size: 14px;
      color: var(--text-muted);
    }
  }

  .detail-content {
    font-size: 15px;
    line-height: 1.8;
    color: var(--text-primary);
    white-space: pre-wrap;
  }

  .detail-footer {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 13px;
    color: var(--text-muted);
  }
}
</style>
