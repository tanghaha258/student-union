<template>
  <div class="layout-container">
    <el-container>
      <!-- 移动端菜单按钮 -->
      <div class="mobile-menu-btn" @click="mobileMenuVisible = true">
        <el-icon><Expand /></el-icon>
      </div>

      <!-- 桌面端侧边栏 -->
      <el-aside :width="isCollapse ? '72px' : '240px'" class="layout-aside hidden-sm-and-down">
        <div class="logo">
          <div class="logo-icon">
            <el-icon><UserFilled /></el-icon>
          </div>
          <transition name="fade">
            <span v-if="!isCollapse" class="logo-text">学生会管理系统</span>
          </transition>
        </div>
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :collapse-transition="false"
          router
          class="layout-menu"
        >
          <el-menu-item index="/dashboard">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          
          <!-- 用户管理 - 需要权限 -->
          <template v-if="hasPerm('user:list')">
            <el-sub-menu index="user-management">
              <template #title>
                <el-icon><User /></el-icon>
                <span>用户管理</span>
              </template>
              <el-menu-item index="/users" v-if="hasPerm('user:list')">用户列表</el-menu-item>
              <el-menu-item index="/roles" v-if="hasPerm('role:list')">角色管理</el-menu-item>
            </el-sub-menu>
          </template>
          
          <!-- 组织管理 - 需要权限 -->
          <template v-if="hasPerm('department:list') || hasPerm('member:list')">
            <el-sub-menu index="org-management">
              <template #title>
                <el-icon><OfficeBuilding /></el-icon>
                <span>组织管理</span>
              </template>
              <el-menu-item index="/departments" v-if="hasPerm('department:list')">部门管理</el-menu-item>
              <el-menu-item index="/members" v-if="hasPerm('member:list')">成员管理</el-menu-item>
            </el-sub-menu>
          </template>
          
          <!-- 活动管理 - 需要权限 -->
          <el-menu-item index="/activities" v-if="hasPerm('activity:list')">
            <el-icon><Calendar /></el-icon>
            <span>活动管理</span>
          </el-menu-item>
          
          <!-- 公告管理 - 需要权限 -->
          <el-menu-item index="/announcements" v-if="hasPerm('announcement:list')">
            <el-icon><Bell /></el-icon>
            <span>公告管理</span>
          </el-menu-item>
          
          <!-- 报名模块 - 所有用户可见 -->
          <el-sub-menu index="registration">
            <template #title>
              <el-icon><EditPen /></el-icon>
              <span>报名管理</span>
            </template>
            <el-menu-item index="/registration-center">报名中心</el-menu-item>
            <el-menu-item index="/my-registrations">我的报名</el-menu-item>
            <el-menu-item index="/registration-manage" v-if="hasPerm('registration:manage')">活动管理</el-menu-item>
          </el-sub-menu>
          
          <!-- 学分评优模块 -->
          <el-sub-menu index="evaluation">
            <template #title>
              <el-icon><Trophy /></el-icon>
              <span>学分评优</span>
            </template>
            <el-menu-item index="/credit-center">学分中心</el-menu-item>
            <el-menu-item index="/credit-manage" v-if="hasPerm('credit:manage')">学分管理</el-menu-item>
            <el-menu-item index="/evaluation-manage" v-if="hasPerm('evaluation:manage')">评优管理</el-menu-item>
          </el-sub-menu>
          
          <!-- 招新管理 - 需要权限 -->
          <el-menu-item index="/recruitment-manage" v-if="hasPerm('recruitment:list')">
            <el-icon><UserFilled /></el-icon>
            <span>招新活动</span>
          </el-menu-item>
          
          <!-- 通知管理 - 需要权限 -->
          <el-menu-item index="/notifications" v-if="hasPerm('notification:list')">
            <el-icon><Bell /></el-icon>
            <span>通知管理</span>
          </el-menu-item>
          
          <!-- 成员展示 - 所有用户可见 -->
          <el-menu-item index="/members-show">
            <el-icon><User /></el-icon>
            <span>成员展示</span>
          </el-menu-item>
          
          <!-- 学生端菜单 -->
          <template v-if="!isManager">
            <el-menu-item index="/notifications-center">
              <el-icon><Bell /></el-icon>
              <span>通知中心</span>
            </el-menu-item>
            <el-menu-item index="/profile">
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </el-menu-item>
          </template>
        </el-menu>
        
        <div class="collapse-btn" @click="toggleCollapse">
          <el-icon><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
        </div>
      </el-aside>

      <!-- 移动端抽屉菜单 -->
      <el-drawer
        v-model="mobileMenuVisible"
        direction="ltr"
        size="280px"
        :with-header="false"
        class="mobile-drawer"
        :modal-class="'mobile-drawer-modal'"
      >
        <div class="mobile-menu">
          <div class="logo">
            <div class="logo-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
            <span class="logo-text">学生会管理系统</span>
          </div>
          <el-menu
            :default-active="activeMenu"
            class="mobile-sidebar-menu"
            router
            @select="mobileMenuVisible = false"
          >
            <el-menu-item index="/dashboard">
              <el-icon><HomeFilled /></el-icon>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="/registration-center">
              <el-icon><EditPen /></el-icon>
              <span>报名中心</span>
            </el-menu-item>
            <el-menu-item index="/my-registrations">
              <el-icon><List /></el-icon>
              <span>我的报名</span>
            </el-menu-item>
            <el-menu-item index="/credit-center">
              <el-icon><Trophy /></el-icon>
              <span>学分中心</span>
            </el-menu-item>
            <el-menu-item index="/members-show">
              <el-icon><User /></el-icon>
              <span>成员展示</span>
            </el-menu-item>
            <el-menu-item index="/notifications-center">
              <el-icon><Bell /></el-icon>
              <span>通知中心</span>
            </el-menu-item>
            <el-menu-item index="/profile">
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-drawer>

      <el-container>
        <el-header class="layout-header">
          <div class="header-left">
            <div class="collapse-btn hidden-sm-and-down" @click="toggleCollapse">
              <el-icon><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
            </div>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-if="currentRoute.meta.title && currentRoute.path !== '/dashboard'">
                {{ currentRoute.meta.title }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <div class="theme-toggle" @click="themeStore.toggleTheme()">
              <el-icon v-if="themeStore.isDark"><Sunny /></el-icon>
              <el-icon v-else><Moon /></el-icon>
            </div>
            <NotificationCenter ref="notificationCenterRef" />
            <el-dropdown @command="handleCommand">
              <div class="user-info">
                <el-avatar :size="36" :src="userStore.userInfo?.avatar">
                  {{ userStore.username?.charAt(0)?.toUpperCase() }}
                </el-avatar>
                <div class="user-detail hidden-sm-and-down">
                  <span class="username">{{ userStore.username }}</span>
                  <span class="user-role">{{ getRoleName(userStore.role) }}</span>
                </div>
                <el-icon class="arrow"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="password">
                    <el-icon><Lock /></el-icon>
                    修改密码
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        <el-main class="layout-main">
          <router-view v-slot="{ Component }">
            <transition name="slide" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import NotificationCenter from '@/components/NotificationCenter.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const notificationCenterRef = ref()

const isCollapse = ref(false)
const mobileMenuVisible = ref(false)
const activeMenu = computed(() => route.path)
const currentRoute = computed(() => route)

// 权限检查函数
const hasPerm = (permission: string) => userStore.hasPermission(permission)

// 角色判断（保留用于特殊场景）
const isTopAdmin = computed(() => ['ADMIN', 'PRESIDENT'].includes(userStore.role || ''))
const isManager = computed(() => ['ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'].includes(userStore.role || ''))

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const getRoleName = (role: string) => {
  const map: Record<string, string> = {
    ADMIN: '超级管理员',
    PRESIDENT: '学生会主席',
    VICE_PRESIDENT: '副主席',
    MINISTER: '部长',
    MEMBER: '成员'
  }
  return map[role] || role
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'password':
      router.push('/profile')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        await userStore.logoutAction()
        ElMessage.success('退出成功')
        router.push('/login')
      })
      break
  }
}
</script>

<style scoped lang="scss">
.layout-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  background-attachment: fixed;
}

.el-container {
  height: 100%;
}

.layout-aside {
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  transition: width 0.3s ease;
  overflow: hidden;

  .logo {
    height: 72px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);

    .logo-icon {
      width: 40px;
      height: 40px;
      min-width: 40px;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
      
      .el-icon {
        font-size: 22px;
        color: white;
      }
    }

    .logo-text {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      margin-left: 14px;
      white-space: nowrap;
      letter-spacing: 1px;
    }
  }

  .layout-menu {
    border-right: none !important;
    background: transparent !important;
    padding: 12px 8px;
    
    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
      height: 48px;
      line-height: 48px;
      border-radius: var(--radius-md);
      margin: 4px 0;
      color: var(--text-secondary);
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: var(--text-primary);
      }
    }
    
    :deep(.el-menu-item.is-active) {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      color: white !important;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    }
    
    :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
      color: var(--primary-light);
    }
    
    :deep(.el-menu--collapse) {
      .el-menu-item,
      .el-sub-menu__title {
        justify-content: center;
        padding: 0 !important;
      }
    }
  }
}

.layout-header {
  height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 24px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;

    .collapse-btn {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.05);
      
      .el-icon {
        font-size: 20px;
        color: var(--text-secondary);
      }
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        .el-icon {
          color: var(--primary-light);
        }
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .theme-toggle {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.05);
      
      .el-icon {
        font-size: 20px;
        color: var(--text-secondary);
        transition: all 0.3s ease;
      }
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        .el-icon {
          color: #fbbf24;
          transform: rotate(180deg);
        }
      }
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 8px 16px;
      border-radius: var(--radius-lg);
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      .user-detail {
        display: flex;
        flex-direction: column;
        
        .username {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .user-role {
          font-size: 12px;
          color: var(--text-muted);
        }
      }
      
      .arrow {
        color: var(--text-muted);
        transition: transform 0.3s ease;
      }
    }
  }
}

.layout-main {
  padding: 24px;
  background: transparent;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

// 移动端菜单按钮
.mobile-menu-btn {
  display: none;
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1000;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  align-items: center;
  justify-content: center;

  .el-icon {
    font-size: 24px;
    color: var(--text-primary);
  }

  &:hover {
    background: rgba(99, 102, 241, 0.3);
  }
}

// 移动端抽屉遮罩
:global(.mobile-drawer-modal) {
  background: rgba(0, 0, 0, 0.5) !important;
}

// 移动端抽屉菜单
.mobile-drawer {
  :deep(.el-drawer) {
    background: transparent !important;
    box-shadow: none !important;
  }

  :deep(.el-drawer__body) {
    padding: 0;
    background: transparent;
  }

  .mobile-menu {
    height: 100%;
    background: var(--body-bg);
    background-attachment: fixed;

    .logo {
      height: 72px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);

      .logo-icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        .el-icon {
          font-size: 22px;
          color: white;
        }
      }

      .logo-text {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
        margin-left: 14px;
      }
    }

    .mobile-sidebar-menu {
      border-right: none !important;
      background: transparent !important;
      padding: 12px 8px;

      :deep(.el-menu-item) {
        height: 48px;
        line-height: 48px;
        border-radius: var(--radius-md);
        margin: 4px 0;
        color: var(--text-secondary);

        .el-icon {
          color: var(--text-secondary);
        }

        span {
          color: var(--text-secondary);
        }

        &:hover {
          background: var(--bg-glass-light);
          color: var(--text-primary);

          .el-icon,
          span {
            color: var(--text-primary);
          }
        }

        &.is-active {
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
          color: white !important;

          .el-icon,
          span {
            color: white !important;
          }
        }
      }
    }
  }
}

// 响应式断点
@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }

  .layout-aside {
    display: none !important;
  }

  .layout-header {
    padding: 0 16px;
    padding-left: 72px;

    .header-left {
      .collapse-btn {
        display: none;
      }

      .el-breadcrumb {
        display: none;
      }
    }

    .header-right {
      .user-detail {
        display: none !important;
      }
    }
  }

  .layout-main {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .layout-header {
    .header-right {
      gap: 8px;
    }
  }
}
</style>
