import { get } from './request'
import type { ApiResponse } from './request'

export const exportCredits = (params?: {
  startDate?: string
  endDate?: string
  type?: string
}): Promise<Blob> => {
  return get('/export/credits', params, { responseType: 'blob' }) as Promise<Blob>
}

export const exportRegistrations = (params?: {
  activityId?: string
}): Promise<Blob> => {
  return get('/export/registrations', params, { responseType: 'blob' }) as Promise<Blob>
}

export const exportEvaluationResults = (periodId: string): Promise<Blob> => {
  return get(`/export/evaluations/${periodId}`, {}, { responseType: 'blob' }) as Promise<Blob>
}

export const exportUsers = (): Promise<Blob> => {
  return get('/export/users', {}, { responseType: 'blob' }) as Promise<Blob>
}

export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
