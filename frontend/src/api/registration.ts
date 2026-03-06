import { get, post, put, del } from './request'
import type { ApiResponse } from './request'

export interface RegistrationActivity {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  eventDate: string
  location?: string
  maxParticipants?: number
  status: string
  requireApproval: boolean
  createdAt: string
  organizer?: {
    id: string
    username: string
    nickname?: string
  }
  _count?: {
    registrations: number
  }
  registrations?: { id: string; status: string }[]
}

export interface Registration {
  id: string
  status: string
  remark?: string
  reviewedAt?: string
  createdAt: string
  activity: {
    id: string
    title: string
    eventDate: string
    location?: string
    status: string
  }
  user?: {
    id: string
    username: string
    nickname?: string
    studentId?: string
    className?: string
    phone?: string
    email?: string
  }
  reviewer?: {
    id: string
    username: string
    nickname?: string
  }
}

export const getRegistrationActivities = (params?: {
  page?: number
  pageSize?: number
  status?: string
  keyword?: string
}): Promise<ApiResponse<{ list: RegistrationActivity[]; total: number; page: number; pageSize: number }>> => {
  return get('/registration-activities', params)
}

export const getRegistrationActivityById = (id: string): Promise<ApiResponse<RegistrationActivity>> => {
  return get(`/registration-activities/${id}`)
}

export const createRegistrationActivity = (data: {
  title: string
  description?: string
  startDate: string
  endDate: string
  eventDate: string
  location?: string
  maxParticipants?: number
  requireApproval?: boolean
}): Promise<ApiResponse<RegistrationActivity>> => {
  return post('/registration-activities', data)
}

export const updateRegistrationActivity = (id: string, data: Partial<RegistrationActivity>): Promise<ApiResponse<RegistrationActivity>> => {
  return put(`/registration-activities/${id}`, data)
}

export const deleteRegistrationActivity = (id: string): Promise<ApiResponse<null>> => {
  return del(`/registration-activities/${id}`)
}

export const createRegistration = (data: {
  activityId: string
  remark?: string
}): Promise<ApiResponse<Registration>> => {
  return post('/registrations', data)
}

export const getMyRegistrations = (params?: {
  page?: number
  pageSize?: number
  status?: string
}): Promise<ApiResponse<{ list: Registration[]; total: number; page: number; pageSize: number }>> => {
  return get('/registrations/my', params)
}

export const getActivityRegistrations = (activityId: string, params?: {
  page?: number
  pageSize?: number
  status?: string
}): Promise<ApiResponse<{ list: Registration[]; total: number; page: number; pageSize: number }>> => {
  return get(`/registrations/activity/${activityId}`, params)
}

export const reviewRegistration = (id: string, data: {
  status: 'APPROVED' | 'REJECTED'
  remark?: string
}): Promise<ApiResponse<Registration>> => {
  return put(`/registrations/${id}/review`, data)
}

export const cancelRegistration = (id: string): Promise<ApiResponse<null>> => {
  return del(`/registrations/${id}`)
}
