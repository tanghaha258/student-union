import { get, post, put } from './request'
import type { ApiResponse } from './request'

export interface Role {
  id: string
  code: string
  name: string
  description: string
  icon: string
  gradient: string
  permissions?: string
  userCount: number
  permissionCount: number
}

export interface RoleDetail extends Role {
  users: {
    id: string
    username: string
    email: string | null
    phone: string | null
    department: { name: string } | null
  }[]
}

export const getRoles = (): Promise<ApiResponse<Role[]>> => {
  return get('/roles')
}

export const getRoleByCode = (code: string): Promise<ApiResponse<RoleDetail>> => {
  return get(`/roles/${code}`)
}

export const createRole = (data: {
  code: string
  name: string
  description: string
  icon: string
  gradient: string
}): Promise<ApiResponse<Role>> => {
  return post('/roles', data)
}

export const updateRole = (code: string, data: {
  name?: string
  description?: string
  icon?: string
  gradient?: string
  permissions?: string
}): Promise<ApiResponse<Role>> => {
  return put(`/roles/${code}`, data)
}
