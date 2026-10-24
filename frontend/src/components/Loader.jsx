/* ── Loader Component ──────────────────────────────────────────────────────── */
export default function Loader({ fullscreen = false }) {
  const wrapper = fullscreen
    ? 'fixed inset-0 mesh-bg flex items-center justify-center z-50'
    : 'flex items-center justify-center py-12'

  return (
    <div className={wrapper}>
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-purple-400 animate-spin [animation-duration:0.7s]" />
        </div>
        <p className="text-slate-400 text-sm font-medium animate-pulse-slow">
          SmartAssist AI loading…
        </p>
      </div>
    </div>
  )
}
