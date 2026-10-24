/* ── Admin Dashboard ─────────────────────────────────────────────────────── */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { adminAPI } from '../services/api'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import AnalyticsCard from '../components/AnalyticsCard'
import Loader from '../components/Loader'

const SENTIMENT_COLORS = { positive: '#34d399', negative: '#f87171', neutral: '#94a3b8' }
const CATEGORY_COLORS  = ['#6366f1', '#a78bfa', '#c084fc', '#f472b6', '#60a5fa']

export default function Admin() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats]             = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  useEffect(() => {
    adminAPI.stats()
      .then(r => setStats(r.data))
      .catch(() => setError('Failed to load admin stats.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader fullscreen />

  const sentimentData = stats
    ? Object.entries(stats.sentiment_breakdown).map(([name, value]) => ({ name, value }))
    : []

  const categoryData = stats
    ? Object.entries(stats.category_breakdown).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="flex h-screen mesh-bg overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Analytics Dashboard" onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Header card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-white">📊 Platform Analytics</h2>
            <p className="text-slate-400 text-sm mt-1">
              Real-time statistics and insights across all users.
            </p>
          </motion.div>

          {/* Top stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsCard title="Total Users" value={stats?.total_users ?? 0}
              icon="👥" color="brand" subtitle="Registered accounts" />
            <AnalyticsCard title="Total Chats" value={stats?.total_chats ?? 0}
              icon="💬" color="purple" subtitle="All messages sent" />
            <AnalyticsCard title="Positive"
              value={stats?.sentiment_breakdown?.positive ?? 0} icon="😊" color="emerald" />
            <AnalyticsCard title="Negative"
              value={stats?.sentiment_breakdown?.negative ?? 0} icon="😟" color="rose" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-white font-semibold mb-4 text-sm">Sentiment Distribution</h3>
              {sentimentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={sentimentData} dataKey="value" nameKey="name"
                         cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                         label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {sentimentData.map(e => (
                        <Cell key={e.name} fill={SENTIMENT_COLORS[e.name] || '#6366f1'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-sm text-center py-20">No chat data yet.</p>
              )}
            </div>

            <div className="card">
              <h3 className="text-white font-semibold mb-4 text-sm">Topic Categories</h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={categoryData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }}
                           axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }}
                           axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                    }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-sm text-center py-20">No chat data yet.</p>
              )}
            </div>
          </div>

          {/* Most active users */}
          {stats?.most_active_users?.length > 0 && (
            <div className="card">
              <h3 className="text-white font-semibold mb-4 text-sm">🏆 Most Active Users</h3>
              <div className="space-y-3">
                {stats.most_active_users.map((u, i) => (
                  <motion.div
                    key={u.email}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600
                                    flex items-center justify-center text-xs font-bold text-white">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{u.name}</p>
                      <p className="text-slate-500 text-xs truncate">{u.email}</p>
                    </div>
                    <span className="text-brand-400 font-bold text-sm">
                      {u.message_count} msgs
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
