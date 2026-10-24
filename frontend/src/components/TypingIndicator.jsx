/* ── Typing Indicator ─────────────────────────────────────────────────────── */
export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500
                      flex items-center justify-center text-sm flex-shrink-0 shadow-lg">
        🤖
      </div>

      {/* Bubble */}
      <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="text-slate-400 text-xs mr-1">SmartAssist AI is typing</span>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}
