import { get, post } from './request'
import type { ApiResponse } from './request'

export interface Recruitment {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  status: string
  banner?: string
  intro?: string
  requirements?: string
  benefits?: string
  process?: string
  createdAt: string
  _count?: { applications: number }
}

export interface RecruitmentApplication {
  id: string
  name: string
  studentId: string
  className: string
  phone: string
  email?: string
  qq?: string
  gender?: string
  birthday?: string
  skills?: string
  experience?: string
  reason?: string
  expectation?: string
  department1?: string
  department2?: string
  isAdjusted: boolean
  status: string
  interviewTime?: string
  interviewLocation?: string
  remark?: string
  createdAt: string
}

export const getCurrentRecruitment = (): Promise<ApiResponse<Recruitment>> => {
  return get('/public/recruitment/current')
}

export const getRecruitmentById = (id: string): Promise<ApiResponse<Recruitment>> => {
  return get(`/public/recruitment/${id}`)
}

export const submitRecruitmentApplication = (id: string, data: {
  name: string
  studentId: string
  className: string
  phone: string
  email?: string
  qq?: string
  gender?: string
  birthday?: string
  skills?: string
  experience?: string
  reason?: string
  expectation?: string
  department1?: string
  department2?: string
  isAdjusted?: boolean
}): Promise<ApiResponse<{ id: string }>> => {
  return post(`/public/recruitment/${id}/apply`, data)
}

export const getApplicationStatus = (id: string): Promise<ApiResponse<Partial<RecruitmentApplication>>> => {
  return get(`/public/recruitment/application/${id}`)
}

export const getRecruitments = (params?: {
  page?: number
  pageSize?: number
  status?: string
  keyword?: string
}): Promise<ApiResponse<{ list: Recruitment[]; total: number; page: number; pageSize: number }>> => {
  return get('/recruitments', params)
}

export const getRecruitmentApplications = (id: string, params?: {
  page?: number
  pageSize?: number
  status?: string
  department?: string
  keyword?: string
}): Promise<ApiResponse<{ list: RecruitmentApplication[]; total: number }>> => {
  return get(`/recruitments/${id}/applications`, params)
}

export const updateApplicationStatus = (applicationId: string, data: {
  status?: string
  interviewTime?: string
  interviewLocation?: string
  remark?: string
}): Promise<ApiResponse<RecruitmentApplication>> => {
  return post(`/recruitments/applications/${applicationId}`, data)
}

export const createRecruitment = (data: {
  title: string
  description?: string
  startDate: string
  endDate: string
  banner?: string
  intro?: string
  requirements?: string
  benefits?: string
  process?: string
}): Promise<ApiResponse<Recruitment>> => {
  return post('/recruitments', data)
}

export const updateRecruitment = (id: string, data: Partial<Recruitment>): Promise<ApiResponse<Recruitment>> => {
  return post(`/recruitments/${id}`, data)
}

export const deleteRecruitment = (id: string): Promise<ApiResponse<null>> => {
  return post(`/recruitments/${id}/delete`)
}

export const publishRecruitment = (id: string): Promise<ApiResponse<Recruitment>> => {
  return post(`/recruitments/${id}/publish`)
}

export const closeRecruitment = (id: string): Promise<ApiResponse<Recruitment>> => {
  return post(`/recruitments/${id}/close`)
}

export interface RecruitmentStats {
  total: number
  pending: number
  approved: number
  rejected: number
  interview: number
  hired: number
  failed: number
  departmentStats: { department: string; count: number }[]
}

export const getRecruitmentStats = (id: string): Promise<ApiResponse<RecruitmentStats>> => {
  return get(`/recruitments/${id}/stats`)
}

export const getApplicationDetail = (applicationId: string): Promise<ApiResponse<RecruitmentApplication & { recruitment: Recruitment }>> => {
  return get(`/recruitments/applications/${applicationId}`)
}

export const batchUpdateApplications = (ids: string[], status: string): Promise<ApiResponse<{ count: number }>> => {
  return post('/recruitments/applications/batch', { ids, status })
}

export const arrangeInterview = (applicationId: string, data: {
  interviewTime: string
  interviewLocation: string
  remark?: string
}): Promise<ApiResponse<RecruitmentApplication>> => {
  return post(`/recruitments/applications/${applicationId}/interview`, data)
}

export const exportRecruitmentApplications = async (id: string): Promise<Blob> => {
  const response = await fetch(`/api/recruitments/${id}/export`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  return response.blob()
}
