import { get, post, put, del } from './request'
import type { ApiResponse } from './request'

export interface Department {
  id: string
  name: string
  description?: string
  memberCount?: number
  members?: any[]
  createdAt: string
  updatedAt: string
}

export const getDepartments = (): Promise<ApiResponse<Department[]>> => {
  return get('/departments')
}

export const getDepartmentList = (): Promise<ApiResponse<Department[]>> => {
  return get('/departments')
}

export const getDepartmentById = (id: string): Promise<ApiResponse<Department>> => {
  return get(`/departments/${id}`)
}

export const createDepartment = (data: Partial<Department>): Promise<ApiResponse<Department>> => {
  return post('/departments', data)
}

export const updateDepartment = (id: string, data: Partial<Department>): Promise<ApiResponse<Department>> => {
  return put(`/departments/${id}`, data)
}

export const deleteDepartment = (id: string): Promise<ApiResponse<null>> => {
  return del(`/departments/${id}`)
}
