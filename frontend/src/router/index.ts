import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/recruitment/:id?',
    name: 'RecruitmentLanding',
    component: () => import('@/views/recruitment/LandingPage.vue'),
    meta: { title: '学生会招新报名', requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/UserList.vue'),
        meta: { title: '用户管理', icon: 'User', permission: 'user:list' }
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('@/views/roles/RoleList.vue'),
        meta: { title: '角色管理', icon: 'UserFilled', permission: 'role:list' }
      },
      {
        path: 'departments',
        name: 'Departments',
        component: () => import('@/views/departments/DepartmentList.vue'),
        meta: { title: '部门管理', icon: 'OfficeBuilding', permission: 'department:list' }
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/members/MemberList.vue'),
        meta: { title: '成员管理', icon: 'Avatar', permission: 'member:list' }
      },
      {
        path: 'members-show',
        name: 'MemberShow',
        component: () => import('@/views/members/MemberShow.vue'),
        meta: { title: '成员展示', icon: 'User' }
      },
      {
        path: 'activities',
        name: 'Activities',
        component: () => import('@/views/activities/ActivityList.vue'),
        meta: { title: '活动管理', icon: 'Calendar', permission: 'activity:list' }
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: () => import('@/views/announcements/AnnouncementList.vue'),
        meta: { title: '公告管理', icon: 'Bell', permission: 'announcement:list' }
      },
      {
        path: 'registration-center',
        name: 'RegistrationCenter',
        component: () => import('@/views/registration/RegistrationCenter.vue'),
        meta: { title: '报名中心', icon: 'EditPen' }
      },
      {
        path: 'my-registrations',
        name: 'MyRegistrations',
        component: () => import('@/views/registration/MyRegistrations.vue'),
        meta: { title: '我的报名', icon: 'List' }
      },
      {
        path: 'registration-manage',
        name: 'RegistrationManage',
        component: () => import('@/views/registration/RegistrationManage.vue'),
        meta: { title: '报名管理', icon: 'Setting', permission: 'registration:manage' }
      },
      {
        path: 'evaluation-center',
        name: 'EvaluationCenter',
        component: () => import('@/views/evaluation/EvaluationCenter.vue'),
        meta: { title: '评优中心', icon: 'Trophy' }
      },
      {
        path: 'my-applications',
        name: 'MyApplications',
        component: () => import('@/views/evaluation/MyApplications.vue'),
        meta: { title: '我的申请', icon: 'Document' }
      },
      {
        path: 'recruitment-manage',
        name: 'RecruitmentManage',
        component: () => import('@/views/recruitment/RecruitmentActivityList.vue'),
        meta: { title: '招新活动', icon: 'UserFilled', permission: 'recruitment:list' }
      },
      {
        path: 'recruitment-applications/:id',
        name: 'RecruitmentApplications',
        component: () => import('@/views/recruitment/RecruitmentApplicationManage.vue'),
        meta: { title: '报名管理', icon: 'UserFilled', permission: 'recruitment:review' }
      },
      {
        path: 'notifications',
        name: 'NotificationList',
        component: () => import('@/views/notifications/NotificationList.vue'),
        meta: { title: '通知管理', icon: 'Bell', permission: 'notification:list' }
      },
      {
        path: 'credit-center',
        name: 'CreditCenter',
        component: () => import('@/views/credit/CreditCenter.vue'),
        meta: { title: '学分中心', icon: 'Trophy' }
      },
      {
        path: 'credit-manage',
        name: 'CreditManage',
        component: () => import('@/views/credit/CreditManage.vue'),
        meta: { title: '学分管理', icon: 'Document', permission: 'credit:manage' }
      },
      {
        path: 'evaluation-manage',
        name: 'EvaluationManage',
        component: () => import('@/views/credit/EvaluationManage.vue'),
        meta: { title: '评优管理', icon: 'Medal', permission: 'evaluation:manage' }
      },
      {
        path: 'notifications-center',
        name: 'NotificationsCenter',
        component: () => import('@/views/notifications/NotificationCenter.vue'),
        meta: { title: '通知中心', icon: 'Bell' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心', icon: 'UserFilled' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
    meta: { title: '404' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  document.title = `${to.meta.title || '学生会管理系统'} - 学生会信息管理系统`

  const userStore = useUserStore()
  const token = userStore.token || localStorage.getItem('token')

  if (to.meta.requiresAuth !== false && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    if (token && !userStore.userInfo) {
      try {
        await userStore.getUserInfoAction()
      } catch (error) {
        userStore.clearToken()
        next('/login')
        return
      }
    }
    
    // 权限检查
    const permission = to.meta.permission as string | undefined
    if (permission && !userStore.hasPermission(permission) && userStore.role !== 'ADMIN') {
      next('/dashboard')
      return
    }
    
    next()
  }
})

export default router
