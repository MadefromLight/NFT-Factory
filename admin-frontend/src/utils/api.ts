import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const login = async (email: string, password: string) => {
  try {
    return await api.post('/api/admin/login', { email, password });
  } catch (error: any) {
    // Re-throw with enhanced error information
    throw error;
  }
}

export const signup = async (data: { name: string; email: string; password: string; role: string }) => {
  try {
    return await api.post('/api/admin/signup', data);
  } catch (error: any) {
    // Re-throw with enhanced error information
    throw error;
  }
}

export const getPendingStatus = () => api.get('/api/admin/me/status')

// User Management (Super Admin only)
export const getPendingUsers = () => api.get('/api/admin/users/pending')
export const approveUser = (userId: string) => api.post(`/api/admin/users/${userId}/approve`)
export const rejectUser = (userId: string, reason: string) => 
  api.post(`/api/admin/users/${userId}/reject`, { reason })

// Submissions
export const getSubmissions = (params?: {
  status?: string
  organizationTier?: number
  requestedProductClass?: number
  page?: number
  limit?: number
}) => api.get('/api/admin/submissions', { params })

export const getSubmission = (id: string) =>
  api.get(`/api/admin/submissions/${id}`)

export const approveSubmission = (id: string, assignedDesigner?: string) =>
  api.post(`/api/admin/submissions/${id}/approve`, { assignedDesigner })

export const rejectSubmission = (id: string, reason: string) =>
  api.post(`/api/admin/submissions/${id}/reject`, { reason })

export const assignDesigner = (id: string, designerId: string) =>
  api.post(`/api/admin/submissions/${id}/assign-designer`, { designerId })

export const uploadArtwork = (id: string, file: File) => {
  const formData = new FormData()
  formData.append('artwork', file)
  return api.post(`/api/admin/submissions/${id}/upload-artwork`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const generateMetadata = (id: string) =>
  api.post(`/api/admin/submissions/${id}/generate-metadata`)

// Analytics
export const getAnalytics = () => api.get('/api/admin/analytics')

export default api
