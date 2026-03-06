import { get } from './request'
import type { ApiResponse } from './request'

export interface DashboardStats {
  userCount: number
  departmentCount: number
  activityCount: number
  announcementCount: number
}

export interface RecentActivity {
  id: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  location?: string
  status: string
  participantCount: number
  organizer?: {
    id: string
    username: string
  }
  createdAt: string
}

export interface RecentAnnouncement {
  id: string
  title: string
  content?: string
  priority: number
  isPublished: boolean
  author?: {
    id: string
    username: string
  }
  createdAt: string
}

export interface DepartmentStats {
  id: string
  name: string
  description?: string
  memberCount: number
}

export const getDashboardStats = (): Promise<ApiResponse<DashboardStats>> => {
  return get('/dashboard/stats')
}

export const getRecentActivities = (limit: number = 5): Promise<ApiResponse<RecentActivity[]>> => {
  return get('/dashboard/recent-activities', { limit })
}

export const getRecentAnnouncements = (limit: number = 5): Promise<ApiResponse<RecentAnnouncement[]>> => {
  return get('/dashboard/recent-announcements', { limit })
}

export const getDepartmentStats = (): Promise<ApiResponse<DepartmentStats[]>> => {
  return get('/dashboard/department-stats')
}
