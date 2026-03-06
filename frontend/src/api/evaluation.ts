import { get, post, put, del } from './request'
import type { ApiResponse } from './request'

export interface EvaluationActivity {
  id: string
  title: string
  description?: string
  type: string
  startDate: string
  endDate: string
  reviewStartDate: string
  reviewEndDate: string
  announceDate: string
  status: string
  criteria?: string
  maxAwards: number
  requireMaterial: boolean
  createdAt: string
  organizer?: {
    id: string
    username: string
    nickname?: string
  }
  _count?: {
    applications: number
    reviewers: number
  }
}

export interface EvaluationApplication {
  id: string
  status: string
  materials?: string
  selfEvaluation?: string
  totalScore?: number
  rank?: number
  remark?: string
  createdAt: string
  activity: {
    id: string
    title: string
    type: string
    status: string
  }
  applicant: {
    id: string
    username: string
    nickname?: string
    studentId?: string
    className?: string
  }
  reviews?: EvaluationReview[]
}

export interface EvaluationReview {
  id: string
  score: number
  comment?: string
  createdAt: string
  reviewer: {
    id: string
    username: string
    nickname?: string
  }
}

export const getEvaluationActivities = (params?: {
  page?: number
  pageSize?: number
  status?: string
  type?: string
}): Promise<ApiResponse<{ list: EvaluationActivity[]; total: number; page: number; pageSize: number }>> => {
  return get('/evaluation-activities', params)
}

export const getEvaluationActivity = (id: string): Promise<ApiResponse<EvaluationActivity>> => {
  return get(`/evaluation-activities/${id}`)
}

export const createEvaluationActivity = (data: {
  title: string
  description?: string
  type: string
  startDate: string
  endDate: string
  reviewStartDate: string
  reviewEndDate: string
  announceDate: string
  criteria?: string
  maxAwards: number
  requireMaterial?: boolean
}): Promise<ApiResponse<EvaluationActivity>> => {
  return post('/evaluation-activities', data)
}

export const updateEvaluationActivity = (id: string, data: Partial<EvaluationActivity>): Promise<ApiResponse<EvaluationActivity>> => {
  return put(`/evaluation-activities/${id}`, data)
}

export const deleteEvaluationActivity = (id: string): Promise<ApiResponse<null>> => {
  return del(`/evaluation-activities/${id}`)
}

export const addReviewers = (id: string, userIds: string[]): Promise<ApiResponse<null>> => {
  return post(`/evaluation-activities/${id}/reviewers`, { userIds })
}

export const removeReviewer = (id: string, userId: string): Promise<ApiResponse<null>> => {
  return del(`/evaluation-activities/${id}/reviewers/${userId}`)
}

export const createEvaluationApplication = (data: {
  activityId: string
  materials?: any
  selfEvaluation?: string
}): Promise<ApiResponse<EvaluationApplication>> => {
  return post('/evaluation-applications', data)
}

export const getMyApplications = (params?: {
  page?: number
  pageSize?: number
  status?: string
}): Promise<ApiResponse<{ list: EvaluationApplication[]; total: number; page: number; pageSize: number }>> => {
  return get('/evaluation-applications/my', params)
}

export const getActivityApplications = (activityId: string, params?: {
  page?: number
  pageSize?: number
  status?: string
}): Promise<ApiResponse<{ list: EvaluationApplication[]; total: number; page: number; pageSize: number }>> => {
  return get(`/evaluation-applications/activity/${activityId}`, params)
}

export const updateEvaluationApplication = (id: string, data: {
  materials?: any
  selfEvaluation?: string
}): Promise<ApiResponse<EvaluationApplication>> => {
  return put(`/evaluation-applications/${id}`, data)
}

export const createEvaluationReview = (data: {
  applicationId: string
  score: number
  comment?: string
}): Promise<ApiResponse<EvaluationReview>> => {
  return post('/evaluation-reviews', data)
}

export const getMyReviews = (params?: {
  page?: number
  pageSize?: number
  status?: string
}): Promise<ApiResponse<{ list: EvaluationApplication[]; total: number; page: number; pageSize: number }>> => {
  return get('/evaluation-reviews/my', params)
}

export const updateEvaluationReview = (id: string, data: {
  score: number
  comment?: string
}): Promise<ApiResponse<EvaluationReview>> => {
  return put(`/evaluation-reviews/${id}`, data)
}
