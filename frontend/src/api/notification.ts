import { get, post, put, del } from './request'
import type { ApiResponse } from './request'

export interface Notification {
  id: string
  title: string
  content: string
  priority: number
  targetType: string
  targetIds?: string
  senderId: string
  sender: {
    id: string
    username: string
    realName?: string
    avatar?: string
  }
  isRead: boolean
  confirmed: boolean
  createdAt: string
  updatedAt: string
}

export interface UnreadCount {
  total: number
  urgent: number
  important: number
}

export const getNotifications = (): Promise<ApiResponse<Notification[]>> => {
  return get('/notifications')
}

export const getUnreadCount = (): Promise<ApiResponse<UnreadCount>> => {
  return get('/notifications/unread')
}

export const getPopupNotifications = (): Promise<ApiResponse<Notification[]>> => {
  return get('/notifications/popup')
}

export const getNotificationById = (id: string): Promise<ApiResponse<Notification>> => {
  return get(`/notifications/${id}`)
}

export const markAsRead = (id: string): Promise<ApiResponse<null>> => {
  return put(`/notifications/${id}/read`)
}

export const markAllAsRead = (): Promise<ApiResponse<null>> => {
  return put('/notifications/read-all')
}

export const confirmNotification = (id: string): Promise<ApiResponse<null>> => {
  return put(`/notifications/${id}/confirm`)
}

export const createNotification = (data: {
  title: string
  content: string
  priority?: number
  targetType?: string
  targetIds?: string[]
}): Promise<ApiResponse<Notification>> => {
  return post('/notifications', data)
}

export const deleteNotification = (id: string): Promise<ApiResponse<null>> => {
  return del(`/notifications/${id}`)
}

export const getAllNotifications = (): Promise<ApiResponse<Notification[]>> => {
  return get('/notifications/admin/all')
}

export const getNotificationReadStatus = (id: string): Promise<ApiResponse<{
  total: number
  readCount: number
  unreadCount: number
  users: any[]
}>> => {
  return get(`/notifications/${id}/read-status`)
}
