import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Restore token from localStorage on module load
const token = localStorage.getItem('sa_token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sa_token')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  signup:  (data) => api.post('/signup', data),
  login:   (data) => api.post('/login', data),
  profile: ()     => api.get('/profile'),
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatAPI = {
  send:        (data)      => api.post('/chat', data),
  history:     (params)    => api.get('/chat-history', { params }),
  sessions:    ()          => api.get('/chat-sessions'),
  session:     (id)        => api.get(`/chat-session/${id}`),
  deleteChat:  (id)        => api.delete(`/chat/${id}`),
  upload:      (formData)  => api.post('/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  export:      (sessionId) => api.get(`/chat/export/${sessionId}`, { responseType: 'text' }),
}

// ── ML ────────────────────────────────────────────────────────────────────────
export const mlAPI = {
  classify:  (text)  => api.post('/predict-category', { text }),
  analytics: ()      => api.get('/analytics'),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  stats: () => api.get('/admin/stats'),
}

export default api
