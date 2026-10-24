/* ── Navbar ──────────────────────────────────────────────────────────────── */
import ThemeToggle from './ThemeToggle'

export default function Navbar({ title, onMenuClick }) {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-white/10
                       glass-dark backdrop-blur-xl sticky top-0 z-30">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-btn"
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-xl glass flex items-center justify-center
                     hover:bg-white/10 transition-all"
        >
          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="text-white font-semibold text-sm">{title}</h2>
      </div>

      {/* Right: theme toggle */}
      <ThemeToggle />
    </header>
  )
}
