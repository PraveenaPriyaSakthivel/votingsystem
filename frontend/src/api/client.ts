import axios from 'axios'

// Base URL — empty string means same origin, which Vite proxies to :8080 in dev
// and the deployed API URL in production (set via VITE_API_URL env var).
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// Attach JWT from localStorage to every request automatically.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('lp_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, clear stale token and redirect to login.
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lp_token')
      localStorage.removeItem('lp_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
