import { get, post, put, del } from './request'
import type { ApiResponse } from './request'

export interface Announcement {
  id: string
  title: string
  content: string
  priority: number
  isPublished: boolean
  author?: {
    id: string
    username: string
  }
  createdAt: string
  updatedAt: string
}

export interface AnnouncementListParams {
  page?: number
  pageSize?: number
  isPublished?: boolean
}

export interface AnnouncementListResponse {
  list: Announcement[]
  total: number
  page: number
  pageSize: number
}

export const getAnnouncements = (params: AnnouncementListParams): Promise<ApiResponse<AnnouncementListResponse>> => {
  return get('/announcements', params)
}

export const getAnnouncementById = (id: string): Promise<ApiResponse<Announcement>> => {
  return get(`/announcements/${id}`)
}

export const createAnnouncement = (data: Partial<Announcement>): Promise<ApiResponse<Announcement>> => {
  return post('/announcements', data)
}

export const updateAnnouncement = (id: string, data: Partial<Announcement>): Promise<ApiResponse<Announcement>> => {
  return put(`/announcements/${id}`, data)
}

export const deleteAnnouncement = (id: string): Promise<ApiResponse<null>> => {
  return del(`/announcements/${id}`)
}
