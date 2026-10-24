/* ── Sidebar ─────────────────────────────────────────────────────────────── */
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { chatAPI } from '../services/api'

const NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/chat',      icon: '💬', label: 'New Chat'  },
  { to: '/admin',     icon: '📊', label: 'Analytics' },
  { to: '/profile',   icon: '👤', label: 'Profile'   },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    chatAPI.sessions()
      .then(r => setSessions(r.data.slice(0, 8)))
      .catch(() => {})
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const content = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600
                          flex items-center justify-center text-lg shadow-lg shadow-brand-500/30">
            🤖
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-none">SmartAssist AI</h1>
            <p className="text-slate-500 text-[10px] mt-0.5">Powered by Gemini + ML</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="p-3 space-y-1">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
               transition-all duration-200
               ${isActive
                 ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                 : 'text-slate-400 hover:text-white hover:bg-white/5'}`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="px-3 mt-2">
          <p className="text-slate-600 text-[10px] uppercase tracking-widest px-3 mb-2 font-semibold">
            Recent Chats
          </p>
          <div className="space-y-0.5 max-h-56 overflow-y-auto">
            {sessions.map(s => (
              <NavLink
                key={s.id}
                to={`/chat/${s.id}`}
                onClick={onClose}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-xs truncate transition-all
                   ${isActive ? 'bg-brand-600/15 text-brand-300' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`
                }
              >
                💬 {s.title}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* User + Logout */}
      <div className="mt-auto p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600
                          flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-slate-500 text-[10px] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                     text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 glass-dark h-full border-r border-white/10">
        {content}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-64 glass-dark z-50 lg:hidden border-r border-white/10"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
