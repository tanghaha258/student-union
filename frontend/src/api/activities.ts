import { get, post, put, del } from './request'
import type { ApiResponse } from './request'

export interface Activity {
  id: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  registrationStart?: string
  registrationEnd?: string
  location?: string
  status: string
  maxParticipants?: number
  participantCount: number
  requireApproval?: boolean
  creditEnabled?: boolean
  creditType?: string
  creditValue?: number
  organizer?: {
    id: string
    username: string
  }
  createdAt: string
  updatedAt: string
}

export interface ActivityListParams {
  page?: number
  pageSize?: number
  status?: string
}

export interface ActivityListResponse {
  list: Activity[]
  total: number
  page: number
  pageSize: number
}

export const getActivities = (params: ActivityListParams): Promise<ApiResponse<ActivityListResponse>> => {
  return get('/activities', params)
}

export const getActivityById = (id: string): Promise<ApiResponse<Activity>> => {
  return get(`/activities/${id}`)
}

export const createActivity = (data: Partial<Activity>): Promise<ApiResponse<Activity>> => {
  return post('/activities', data)
}

export const updateActivity = (id: string, data: Partial<Activity>): Promise<ApiResponse<Activity>> => {
  return put(`/activities/${id}`, data)
}

export const deleteActivity = (id: string): Promise<ApiResponse<null>> => {
  return del(`/activities/${id}`)
}
