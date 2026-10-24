/* ── Theme Toggle Button ─────────────────────────────────────────────────── */
import { useTheme } from '../context/ThemeContext'
import { motion } from 'framer-motion'

export default function ThemeToggle() {
  const { dark, toggle } = useTheme()

  return (
    <button
      id="theme-toggle"
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-10 h-10 rounded-xl glass flex items-center justify-center
                 hover:bg-white/10 transition-all duration-200"
    >
      <motion.span
        key={dark ? 'moon' : 'sun'}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0,   opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="text-lg"
      >
        {dark ? '🌙' : '☀️'}
      </motion.span>
    </button>
  )
}
