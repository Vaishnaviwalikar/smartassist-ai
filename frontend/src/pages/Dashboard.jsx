/* ── Dashboard Page ──────────────────────────────────────────────────────── */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { mlAPI, chatAPI } from '../services/api'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import AnalyticsCard from '../components/AnalyticsCard'
import Loader from '../components/Loader'

const SENTIMENT_COLORS = { positive: '#34d399', negative: '#f87171', neutral: '#94a3b8' }
const CATEGORY_COLORS  = ['#6366f1','#a78bfa','#c084fc','#f472b6','#60a5fa']

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [analytics, setAnalytics]     = useState(null)
  const [sessions, setSessions]       = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([mlAPI.analytics(), chatAPI.sessions()])
      .then(([aRes, sRes]) => {
        setAnalytics(aRes.data)
        setSessions(sRes.data.slice(0, 5))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader fullscreen />

  const sentimentData = analytics
    ? Object.entries(analytics.sentiment_breakdown).map(([name, value]) => ({ name, value }))
    : []

  const categoryData = analytics
    ? Object.entries(analytics.category_breakdown).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="flex h-screen mesh-bg overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Dashboard" onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 flex items-center justify-between"
          >
            <div>
              <h2 className="text-xl font-bold text-white">
                Welcome back, <span className="gradient-text">{user?.name} 👋</span>
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Here's your AI conversation overview.
              </p>
            </div>
            <button
              id="dashboard-new-chat"
              onClick={() => navigate('/chat')}
              className="btn-primary hidden sm:flex items-center gap-2"
            >
              <span>💬</span> New Chat
            </button>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsCard
              title="Total Chats"
              value={analytics?.total_chats ?? 0}
              icon="💬" color="brand"
              subtitle="All time conversations"
            />
            <AnalyticsCard
              title="Positive"
              value={analytics?.sentiment_breakdown?.positive ?? 0}
              icon="😊" color="emerald"
              subtitle="Positive messages"
            />
            <AnalyticsCard
              title="Negative"
              value={analytics?.sentiment_breakdown?.negative ?? 0}
              icon="😟" color="rose"
              subtitle="Negative messages"
            />
            <AnalyticsCard
              title="Neutral"
              value={analytics?.sentiment_breakdown?.neutral ?? 0}
              icon="😐" color="amber"
              subtitle="Neutral messages"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Pie */}
            <div className="card">
              <h3 className="text-white font-semibold mb-4 text-sm">Sentiment Distribution</h3>
              {sentimentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={sentimentData} dataKey="value" nameKey="name"
                         cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) =>
                           `${name} ${(percent * 100).toFixed(0)}%`
                         }>
                      {sentimentData.map((entry) => (
                        <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name] || '#6366f1'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-sm text-center py-16">No data yet. Start chatting!</p>
              )}
            </div>

            {/* Category Bar */}
            <div className="card">
              <h3 className="text-white font-semibold mb-4 text-sm">Topic Categories</h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryData} barSize={28}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-sm text-center py-16">No data yet. Start chatting!</p>
              )}
            </div>
          </div>

          {/* Recent Sessions */}
          {sessions.length > 0 && (
            <div className="card">
              <h3 className="text-white font-semibold mb-4 text-sm">Recent Conversations</h3>
              <div className="space-y-2">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/chat/${s.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                               hover:bg-white/5 transition-all text-left group"
                  >
                    <span className="text-xl">💬</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate group-hover:text-brand-300 transition-colors">
                        {s.title}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-slate-600 text-xs group-hover:text-brand-400 transition-colors">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
