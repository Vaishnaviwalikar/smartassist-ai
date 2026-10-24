/* ── Profile Page ────────────────────────────────────────────────────────── */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { mlAPI } from '../services/api'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* ── Quick classify demo ── */
  const [classifyText, setClassifyText]     = useState('')
  const [classifyResult, setClassifyResult] = useState(null)
  const [classifyLoading, setClassifyLoading] = useState(false)

  async function handleClassify(e) {
    e.preventDefault()
    if (!classifyText.trim()) return
    setClassifyLoading(true)
    try {
      const res = await mlAPI.classify(classifyText)
      setClassifyResult(res.data)
    } catch {
      setClassifyResult({ error: true })
    } finally {
      setClassifyLoading(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'N/A'

  return (
    <div className="flex h-screen mesh-bg overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Profile" onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl mx-auto w-full">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600
                              flex items-center justify-center text-3xl font-bold text-white
                              shadow-xl shadow-brand-500/30 flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>
                <p className="text-slate-600 text-xs mt-1">Member since {joined}</p>
              </div>
            </div>
          </motion.div>

          {/* ML Classifier Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h3 className="text-white font-semibold mb-1 text-sm">🧠 ML Classifier — Live Demo</h3>
            <p className="text-slate-500 text-xs mb-4">
              Test the TF-IDF + Logistic Regression model that classifies your questions.
            </p>
            <form onSubmit={handleClassify} className="flex gap-3">
              <input
                id="classify-input"
                type="text"
                value={classifyText}
                onChange={e => setClassifyText(e.target.value)}
                placeholder="Type any question…"
                className="input-field flex-1"
              />
              <button
                id="classify-btn"
                type="submit"
                disabled={classifyLoading}
                className="btn-primary flex-shrink-0 disabled:opacity-60"
              >
                {classifyLoading ? '…' : 'Classify'}
              </button>
            </form>

            {classifyResult && !classifyResult.error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 glass rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Category</span>
                  <span className="text-brand-300 font-semibold text-sm capitalize">
                    {classifyResult.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Confidence</span>
                  <span className="text-emerald-400 font-semibold text-sm">
                    {(classifyResult.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Sentiment</span>
                  <span className={`text-sm font-semibold capitalize
                    ${classifyResult.sentiment === 'positive' ? 'text-emerald-400' :
                      classifyResult.sentiment === 'negative' ? 'text-rose-400' : 'text-slate-400'}`}>
                    {classifyResult.sentiment}
                  </span>
                </div>
                {/* Confidence bar */}
                <div className="mt-2">
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${classifyResult.confidence * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-purple-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Account Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="text-white font-semibold mb-4 text-sm">Account</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <span className="text-slate-400 text-sm">Email</span>
                <span className="text-white text-sm font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <span className="text-slate-400 text-sm">Role</span>
                <span className="text-brand-400 text-sm font-medium">Student</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <span className="text-slate-400 text-sm">Plan</span>
                <span className="text-emerald-400 text-sm font-medium">Free</span>
              </div>
            </div>
          </motion.div>

          {/* Logout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              id="profile-logout-btn"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3
                         bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30
                         text-rose-400 rounded-xl transition-all duration-200 text-sm font-medium"
            >
              🚪 Sign Out
            </button>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
