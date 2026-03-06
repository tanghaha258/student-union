import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    if (res.code && res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    const status = error.response?.status
    let message = '请求失败'
    
    switch (status) {
      case 401:
        message = '登录已过期，请重新登录'
        localStorage.removeItem('token')
        window.location.href = '/login'
        break
      case 403:
        message = '没有权限访问'
        break
      case 404:
        message = '请求的资源不存在'
        break
      case 500:
        message = '服务器错误'
        break
      default:
        message = error.message || '请求失败'
    }
    
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export const request = <T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  return service.request<any, ApiResponse<T>>(config)
}

export const get = <T = any>(url: string, params?: any): Promise<ApiResponse<T>> => {
  return request<T>({ method: 'GET', url, params })
}

export const post = <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
  return request<T>({ method: 'POST', url, data })
}

export const put = <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
  return request<T>({ method: 'PUT', url, data })
}

export const del = <T = any>(url: string, params?: any): Promise<ApiResponse<T>> => {
  return request<T>({ method: 'DELETE', url, params })
}

export default service
