import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getUserInfo } from '@/api/user'
import type { UserInfo, LoginForm } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const permissions = ref<string[]>([])

  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username || '')
  const role = computed(() => userInfo.value?.role || '')
  
  const hasPermission = computed(() => (permission: string) => {
    if (role.value === 'ADMIN') return true
    return permissions.value.includes(permission)
  })

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const clearToken = () => {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    localStorage.removeItem('token')
  }

  const loginAction = async (loginForm: LoginForm) => {
    try {
      const res = await login(loginForm)
      setToken(res.data.token)
      await getUserInfoAction()
      return res
    } catch (error) {
      throw error
    }
  }

  const logoutAction = async () => {
    try {
      await logout()
    } finally {
      clearToken()
    }
  }

  const getUserInfoAction = async () => {
    try {
      const res = await getUserInfo()
      userInfo.value = res.data
      permissions.value = res.data?.permissions || []
      return res
    } catch (error) {
      throw error
    }
  }

  return {
    token,
    userInfo,
    permissions,
    isLoggedIn,
    username,
    role,
    hasPermission,
    setToken,
    clearToken,
    loginAction,
    logoutAction,
    getUserInfoAction
  }
})
