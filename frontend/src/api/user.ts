import { get, post, put, del } from './request'
import type { ApiResponse } from './request'

export interface UserInfo {
  id: string
  username: string
  realName?: string
  nickname?: string
  email: string
  phone?: string
  avatar?: string
  role: string
  position?: string
  status?: string
  departmentId?: string
  department?: {
    id: string
    name: string
  }
  studentId?: string
  className?: string
  politicalStatus?: string
  qq?: string
  address?: string
  bio?: string
  enrollmentYear?: string
  permissions?: string[]
  createdAt: string
  updatedAt: string
}

export interface LoginForm {
  username: string
  password: string
}

export interface RegisterForm {
  username: string
  realName: string
  password: string
  email: string
  phone?: string
  studentId?: string
  className?: string
  politicalStatus?: string
  qq?: string
  address?: string
  bio?: string
  enrollmentYear?: string
}

export interface UserListParams {
  page?: number
  pageSize?: number
  keyword?: string
  role?: string
  departmentId?: string
}

export interface UserListResponse {
  list: UserInfo[]
  total: number
  page: number
  pageSize: number
}

export const login = (data: LoginForm): Promise<ApiResponse<{ token: string }>> => {
  return post('/auth/login', data)
}

export const register = (data: RegisterForm): Promise<ApiResponse<UserInfo>> => {
  return post('/auth/register', data)
}

export const logout = (): Promise<ApiResponse<null>> => {
  return post('/auth/logout')
}

export const getUserInfo = (): Promise<ApiResponse<UserInfo>> => {
  return get('/auth/me')
}

export const getUserList = (params: UserListParams): Promise<ApiResponse<UserListResponse>> => {
  return get('/users', params)
}

export const getUserById = (id: string): Promise<ApiResponse<UserInfo>> => {
  return get(`/users/${id}`)
}

export const createUser = (data: RegisterForm): Promise<ApiResponse<UserInfo>> => {
  return post('/users', data)
}

export const updateUser = (id: string, data: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> => {
  return put(`/users/${id}`, data)
}

export const deleteUser = (id: string): Promise<ApiResponse<null>> => {
  return del(`/users/${id}`)
}

export const updatePassword = (data: { oldPassword: string; newPassword: string }): Promise<ApiResponse<null>> => {
  return put('/users/password', data)
}

export const updateUserStatus = (id: string, status: string): Promise<ApiResponse<UserInfo>> => {
  return put(`/users/${id}/status`, { status })
}

export const updateAvatar = (file: File): Promise<ApiResponse<{ url: string }>> => {
  const formData = new FormData()
  formData.append('avatar', file)
  return fetch(import.meta.env.VITE_API_URL + '/upload/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  }).then(res => res.json())
}
