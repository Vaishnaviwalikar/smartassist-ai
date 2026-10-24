/* ── Chat Bubble ─────────────────────────────────────────────────────────── */
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { motion } from 'framer-motion'

const SENTIMENT_BADGE = {
  positive: <span className="sentiment-positive">😊 Positive</span>,
  negative: <span className="sentiment-negative">😟 Negative</span>,
  neutral:  <span className="sentiment-neutral">😐 Neutral</span>,
}

export default function ChatBubble({ role, content, sentiment, category, timestamp }) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                       flex-shrink-0 shadow-lg
                       ${isUser
                         ? 'bg-gradient-to-br from-brand-500 to-purple-600'
                         : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-3 shadow-lg
          ${isUser
            ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-br-sm'
            : 'glass text-slate-100 rounded-bl-sm'}`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="chat-prose text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className="!rounded-xl !my-2 !text-xs"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>{children}</code>
                    )
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {timestamp && (
            <span className="text-slate-600 text-[10px]">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {!isUser && sentiment && SENTIMENT_BADGE[sentiment]}
          {!isUser && category && (
            <span className="text-brand-500 text-[10px] bg-brand-500/10 px-2 py-0.5 rounded-full">
              {category}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
