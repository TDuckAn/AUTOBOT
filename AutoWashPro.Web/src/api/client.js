import axios from 'axios'

const client = axios.create({ baseURL: '/api' })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('aw_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('aw_token')
      localStorage.removeItem('aw_display')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export function unwrapPaged(data) {
  return Array.isArray(data) ? data : data?.items ?? []
}

export function getApiError(error, fallback = 'Request failed.') {
  const data = error.response?.data
  if (typeof data === 'string') return data
  return data?.detail ?? data?.title ?? data?.error ?? fallback
}

export default client
