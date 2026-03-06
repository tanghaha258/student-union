import { get, post, put, del } from './request'
import type { ApiResponse } from './request'

export interface CreditRecord {
  id: string
  userId: string
  type: string
  value: number
  source: string
  activityId?: string
  activity?: {
    id: string
    title: string
  }
  description?: string
  operatorId?: string
  createdAt: string
}

export interface CreditStats {
  type: string
  value: number
}

export interface EvaluationPeriod {
  id: string
  name: string
  type: string
  startDate: string
  endDate: string
  status: string
  createdAt: string
  _count?: {
    results: number
  }
}

export interface EvaluationResult {
  id: string
  periodId: string
  userId: string
  totalCredit: number
  rank: number
  level: string
  remark?: string
  createdAt: string
  user?: {
    id: string
    username: string
    realName?: string
    studentId?: string
    className?: string
    department?: {
      name: string
    }
  }
  period?: {
    name: string
    type: string
    startDate: string
    endDate: string
  }
}

export const getMyCredits = (params?: { type?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<{
  records: CreditRecord[]
  stats: CreditStats[]
  totalCredits: number
}>> => {
  return get('/credits/my', params)
}

export const getCreditList = (params?: { page?: number; pageSize?: number; userId?: string; type?: string }): Promise<ApiResponse<{
  list: CreditRecord[]
  total: number
  page: number
  pageSize: number
}>> => {
  return get('/credits', params)
}

export const addCredit = (data: { userId: string; type: string; value: number; description?: string }): Promise<ApiResponse<CreditRecord>> => {
  return post('/credits', data)
}

export const getCreditRanking = (params?: { type?: string; startDate?: string; endDate?: string; limit?: number }): Promise<ApiResponse<{
  rank: number
  userId: string
  username: string
  realName?: string
  className?: string
  department?: string
  totalCredit: number
}[]>> => {
  return get('/credits/ranking', params)
}

export const getEvaluationPeriods = (): Promise<ApiResponse<EvaluationPeriod[]>> => {
  return get('/evaluation-periods')
}

export const createEvaluationPeriod = (data: { name: string; type: string; startDate: string; endDate: string }): Promise<ApiResponse<EvaluationPeriod>> => {
  return post('/evaluation-periods', data)
}

export const calculateEvaluation = (id: string): Promise<ApiResponse<{ totalUsers: number }>> => {
  return post(`/evaluation-periods/${id}/calculate`)
}

export const getEvaluationResults = (id: string, params?: { level?: string; page?: number; pageSize?: number }): Promise<ApiResponse<{
  list: EvaluationResult[]
  total: number
  page: number
  pageSize: number
}>> => {
  return get(`/evaluation-periods/${id}/results`, params)
}

export const updateEvaluationResult = (id: string, data: { level?: string; remark?: string }): Promise<ApiResponse<EvaluationResult>> => {
  return put(`/evaluation-periods/results/${id}`, data)
}

export const getMyEvaluationResults = (): Promise<ApiResponse<EvaluationResult[]>> => {
  return get('/evaluation-periods/my/results')
}

export const deleteEvaluationPeriod = (id: string): Promise<ApiResponse<null>> => {
  return del(`/evaluation-periods/${id}`)
}
