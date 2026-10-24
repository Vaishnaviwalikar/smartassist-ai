/* ── Analytics Card ──────────────────────────────────────────────────────── */
import { motion } from 'framer-motion'

export default function AnalyticsCard({ title, value, icon, color = 'brand', subtitle }) {
  const colors = {
    brand:   'from-brand-600/20 to-brand-500/5 border-brand-500/20',
    emerald: 'from-emerald-600/20 to-emerald-500/5 border-emerald-500/20',
    rose:    'from-rose-600/20 to-rose-500/5 border-rose-500/20',
    amber:   'from-amber-600/20 to-amber-500/5 border-amber-500/20',
    purple:  'from-purple-600/20 to-purple-500/5 border-purple-500/20',
  }
  const textColors = {
    brand:   'text-brand-400',
    emerald: 'text-emerald-400',
    rose:    'text-rose-400',
    amber:   'text-amber-400',
    purple:  'text-purple-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${textColors[color]}`}>{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`text-3xl opacity-80`}>{icon}</div>
      </div>
    </motion.div>
  )
}
