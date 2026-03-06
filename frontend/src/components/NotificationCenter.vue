<template>
  <div class="notification-center">
    <el-popover
      ref="popoverRef"
      placement="bottom-end"
      :width="380"
      trigger="click"
      popper-class="notification-popover-dark"
      :teleported="true"
    >
      <template #reference>
        <el-badge 
          :value="unreadCount.total" 
          :hidden="unreadCount.total === 0"
          :type="badgeType"
          class="notification-badge"
        >
          <el-button circle class="notification-btn">
            <el-icon :class="{ 'has-urgent': unreadCount.urgent > 0 }">
              <Bell />
            </el-icon>
          </el-button>
        </el-badge>
      </template>
      
      <div class="notification-dropdown">
        <div class="dropdown-header">
          <span class="title">通知中心</span>
          <el-button type="primary" text size="small" @click="handleMarkAllRead" :disabled="unreadCount.total === 0">
            全部已读
          </el-button>
        </div>

        <div class="notification-list" v-loading="loading">
          <template v-if="notifications.length > 0">
            <div 
              v-for="item in notifications.slice(0, 5)" 
              :key="item.id" 
              class="notification-item"
              :class="{ unread: !item.isRead, [`priority-${item.priority}`]: true }"
              @click="handleViewDetail(item)"
            >
              <div class="item-icon">
                <el-icon v-if="item.priority === 1" class="urgent"><WarningFilled /></el-icon>
                <el-icon v-else-if="item.priority === 2" class="important"><InfoFilled /></el-icon>
                <el-icon v-else class="normal"><Bell /></el-icon>
              </div>
              <div class="item-content">
                <div class="item-title">
                  <span>{{ item.title }}</span>
                  <el-tag v-if="item.priority === 1" type="danger" size="small" effect="dark">紧急</el-tag>
                  <el-tag v-else-if="item.priority === 2" type="warning" size="small" effect="dark">重要</el-tag>
                </div>
                <div class="item-desc">{{ item.content }}</div>
                <div class="item-time">{{ formatTime(item.createdAt) }}</div>
              </div>
              <div v-if="!item.isRead" class="unread-dot"></div>
            </div>
          </template>
          <el-empty v-else description="暂无通知" :image-size="80" />
        </div>

        <div class="dropdown-footer">
          <el-button type="primary" text @click="goToNotificationList">
            查看全部通知
          </el-button>
        </div>
      </div>
    </el-popover>

    <el-dialog 
      v-model="detailVisible" 
      :title="currentNotification?.title"
      width="500px"
      class="notification-detail-dialog"
      append-to-body
    >
      <div class="detail-content" v-if="currentNotification">
        <div class="detail-meta">
          <el-tag 
            :type="currentNotification.priority === 1 ? 'danger' : currentNotification.priority === 2 ? 'warning' : 'info'"
            effect="dark"
          >
            {{ currentNotification.priority === 1 ? '紧急' : currentNotification.priority === 2 ? '重要' : '普通' }}
          </el-tag>
          <span class="sender">
            发布者：{{ currentNotification.sender?.realName || currentNotification.sender?.username }}
          </span>
          <span class="time">{{ formatTime(currentNotification.createdAt) }}</span>
        </div>
        <div class="detail-body">{{ currentNotification.content }}</div>
      </div>
      <template #footer>
        <el-button v-if="currentNotification?.priority === 1 && !currentNotification?.confirmed" type="danger" @click="handleConfirm">
          我已知晓
        </el-button>
        <el-button v-else @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="popupVisible"
      :title="popupNotifications[0]?.title || '系统通知'"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="currentPopup?.priority !== 1"
      class="notification-popup-dialog"
      append-to-body
    >
      <div class="popup-content" v-if="currentPopup">
        <div class="popup-meta">
          <el-tag 
            :type="currentPopup.priority === 1 ? 'danger' : 'warning'"
            effect="dark"
          >
            {{ currentPopup.priority === 1 ? '紧急通知' : '重要通知' }}
          </el-tag>
          <span class="time">{{ formatTime(currentPopup.createdAt) }}</span>
        </div>
        <div class="popup-body">{{ currentPopup.content }}</div>
        <div class="popup-sender">
          发布者：{{ currentPopup.sender?.realName || currentPopup.sender?.username }}
        </div>
      </div>
      <template #footer>
        <el-button v-if="currentPopup?.priority === 1" type="danger" @click="handlePopupConfirm">
          我已知晓
        </el-button>
        <el-button v-else type="primary" @click="handlePopupClose">
          我知道了
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Bell, WarningFilled, InfoFilled } from '@element-plus/icons-vue'
import { 
  getNotifications, 
  getUnreadCount, 
  getPopupNotifications,
  markAsRead, 
  markAllAsRead, 
  confirmNotification 
} from '@/api/notification'
import type { Notification, UnreadCount } from '@/api/notification'

const router = useRouter()
const popoverRef = ref()
const loading = ref(false)
const notifications = ref<Notification[]>([])
const unreadCount = ref<UnreadCount>({ total: 0, urgent: 0, important: 0 })
const detailVisible = ref(false)
const currentNotification = ref<Notification | null>(null)
const popupVisible = ref(false)
const popupNotifications = ref<Notification[]>([])
const currentPopupIndex = ref(0)

const currentPopup = computed(() => popupNotifications.value[currentPopupIndex.value])

const badgeType = computed(() => {
  if (unreadCount.value.urgent > 0) return 'danger'
  if (unreadCount.value.important > 0) return 'warning'
  return 'primary'
})

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    const [listRes, countRes] = await Promise.all([
      getNotifications(),
      getUnreadCount()
    ])
    notifications.value = listRes.data || []
    unreadCount.value = countRes.data || { total: 0, urgent: 0, important: 0 }
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
  } finally {
    loading.value = false
  }
}

const fetchPopupNotifications = async () => {
  try {
    const res = await getPopupNotifications()
    popupNotifications.value = res.data || []
    if (popupNotifications.value.length > 0) {
      currentPopupIndex.value = 0
      popupVisible.value = true
    }
  } catch (error) {
    console.error('Failed to fetch popup notifications:', error)
  }
}

const handleViewDetail = async (item: Notification) => {
  currentNotification.value = item
  detailVisible.value = true
  
  if (!item.isRead) {
    try {
      await markAsRead(item.id)
      item.isRead = true
      unreadCount.value.total = Math.max(0, unreadCount.value.total - 1)
      if (item.priority === 1) unreadCount.value.urgent = Math.max(0, unreadCount.value.urgent - 1)
      if (item.priority === 2) unreadCount.value.important = Math.max(0, unreadCount.value.important - 1)
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }
}

const handleMarkAllRead = async () => {
  try {
    await markAllAsRead()
    notifications.value.forEach(n => n.isRead = true)
    unreadCount.value = { total: 0, urgent: 0, important: 0 }
    ElMessage.success('已全部标记为已读')
  } catch (error) {
    console.error('Failed to mark all as read:', error)
    ElMessage.error('操作失败')
  }
}

const handleConfirm = async () => {
  if (!currentNotification.value) return
  try {
    await confirmNotification(currentNotification.value.id)
    currentNotification.value.confirmed = true
    currentNotification.value.isRead = true
    ElMessage.success('已确认')
    detailVisible.value = false
  } catch (error) {
    console.error('Failed to confirm:', error)
    ElMessage.error('操作失败')
  }
}

const handlePopupConfirm = async () => {
  if (!currentPopup.value) return
  try {
    await confirmNotification(currentPopup.value.id)
    const notification = notifications.value.find(n => n.id === currentPopup.value?.id)
    if (notification) {
      notification.confirmed = true
      notification.isRead = true
    }
    unreadCount.value.urgent = Math.max(0, unreadCount.value.urgent - 1)
    unreadCount.value.total = Math.max(0, unreadCount.value.total - 1)
    handleNextPopup()
  } catch (error) {
    console.error('Failed to confirm popup:', error)
    ElMessage.error('操作失败')
  }
}

const handlePopupClose = async () => {
  if (!currentPopup.value) return
  try {
    await markAsRead(currentPopup.value.id)
    const notification = notifications.value.find(n => n.id === currentPopup.value?.id)
    if (notification) {
      notification.isRead = true
    }
    unreadCount.value.important = Math.max(0, unreadCount.value.important - 1)
    unreadCount.value.total = Math.max(0, unreadCount.value.total - 1)
    handleNextPopup()
  } catch (error) {
    console.error('Failed to close popup:', error)
  }
}

const handleNextPopup = () => {
  if (currentPopupIndex.value < popupNotifications.value.length - 1) {
    currentPopupIndex.value++
  } else {
    popupVisible.value = false
  }
}

const goToNotificationList = () => {
  popoverRef.value?.hide?.()
  router.push('/notifications')
}

onMounted(() => {
  fetchNotifications()
  setTimeout(() => {
    fetchPopupNotifications()
  }, 1000)
})

defineExpose({
  fetchNotifications,
  fetchPopupNotifications
})
</script>

<style scoped lang="scss">
.notification-center {
  position: relative;

  .notification-badge {
    :deep(.el-badge__content) {
      font-size: 10px;
      height: 16px;
      line-height: 16px;
      padding: 0 5px;
    }
  }

  .notification-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: var(--text-primary);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      color: var(--text-primary);
    }

    .el-icon {
      font-size: 20px;
      transition: all 0.3s;

      &.has-urgent {
        animation: shake 0.5s ease-in-out infinite;
        color: #f56c6c;
      }
    }
  }
}

@keyframes shake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.notification-dropdown {
  padding: 0;

  .dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color-light);
    margin-bottom: 12px;

    .title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .notification-list {
    max-height: 400px;
    overflow-y: auto;

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      &.unread {
        background: rgba(64, 158, 255, 0.05);
      }

      &.priority-1 {
        .item-icon { color: #f56c6c; }
      }

      &.priority-2 {
        .item-icon { color: #e6a23c; }
      }

      .item-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .item-content {
        flex: 1;
        min-width: 0;

        .item-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;

          span {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        .item-desc {
          font-size: 12px;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 4px;
        }

        .item-time {
          font-size: 12px;
          color: var(--text-muted);
        }
      }

      .unread-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #409eff;
        flex-shrink: 0;
      }
    }
  }

  .dropdown-footer {
    padding-top: 12px;
    border-top: 1px solid var(--border-color-light);
    margin-top: 12px;
    text-align: center;
  }
}

.detail-content, .popup-content {
  .detail-meta, .popup-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    .sender, .time {
      font-size: 13px;
      color: var(--text-secondary);
    }
  }

  .detail-body, .popup-body {
    font-size: 15px;
    line-height: 1.8;
    color: var(--text-primary);
    white-space: pre-wrap;
  }

  .popup-sender {
    margin-top: 16px;
    font-size: 13px;
    color: var(--text-muted);
  }
}
</style>

<style>
.notification-popover-dark {
  background: #1a1a2e !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
}

.notification-popover-dark .el-popper__arrow::before {
  background: #1a1a2e !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}
</style>
