/* ── Chat Page ───────────────────────────────────────────────────────────── */
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { chatAPI } from '../services/api'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import ChatBubble from '../components/ChatBubble'
import TypingIndicator from '../components/TypingIndicator'

export default function Chat() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [messages, setMessages]       = useState([])   // { role, content, sentiment, category, timestamp }
  const [input, setInput]             = useState('')
  const [typing, setTyping]           = useState(false)
  const [currentSession, setSession]  = useState(sessionId || null)
  const [error, setError]             = useState('')
  const [listening, setListening]     = useState(false)

  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)
  const recognition = useRef(null)

  // Load existing session messages
  useEffect(() => {
    if (sessionId) {
      chatAPI.session(sessionId).then(res => {
        const loaded = res.data.flatMap(c => [
          { role: 'user',      content: c.message,  timestamp: c.created_at },
          { role: 'assistant', content: c.response, sentiment: c.sentiment, category: c.category, timestamp: c.created_at },
        ])
        setMessages(loaded)
        setSession(sessionId)
      }).catch(console.error)
    } else {
      setMessages([])
      setSession(null)
    }
    inputRef.current?.focus()
  }, [sessionId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Voice input (Web Speech API)
  function toggleVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Voice input not supported in this browser.')
      return
    }
    if (listening) {
      recognition.current?.stop()
      setListening(false)
      return
    }
    const rec = new SpeechRecognition()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.onresult = e => {
      setInput(prev => prev + e.results[0][0].transcript)
      setListening(false)
    }
    rec.onerror = () => setListening(false)
    rec.onend   = () => setListening(false)
    recognition.current = rec
    rec.start()
    setListening(true)
  }

  // Text-to-speech
  function speak(text) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text.slice(0, 400))
    utt.rate = 1.0
    window.speechSynthesis.speak(utt)
  }

  async function sendMessage(e) {
    e?.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || typing) return

    setError('')
    const userMsg = { role: 'user', content: trimmed, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    const token = localStorage.getItem('sa_token')
    const wsUrl = `ws://localhost:8000/api/chat/stream`
    const ws = new WebSocket(wsUrl)
    let aiContent = ''
    let meta = {}

    ws.onopen = () => {
      ws.send(JSON.stringify({ token, message: trimmed, session_id: currentSession }))
    }

    // Add empty assistant bubble immediately
    setMessages(prev => [...prev, { role: 'assistant', content: '', sentiment: '', category: '', timestamp: new Date().toISOString(), streaming: true }])

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.error) {
        setError(data.error)
        setTyping(false)
        return
      }
      if (data.type === 'meta') {
        meta = data
        if (!currentSession) {
          setSession(data.session_id)
          navigate(`/chat/${data.session_id}`, { replace: true })
        }
      }
      if (data.type === 'chunk') {
        aiContent += data.text
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: aiContent,
            sentiment: meta.sentiment,
            category: meta.category,
            timestamp: new Date().toISOString(),
            streaming: true,
          }
          return updated
        })
      }
      if (data.type === 'done') {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...updated[updated.length - 1], streaming: false }
          return updated
        })
        speak(aiContent)
        setTyping(false)
        ws.close()
      }
    }

    ws.onerror = () => {
      setError('Connection error. Please try again.')
      setTyping(false)
    }

    ws.onclose = () => setTyping(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setTyping(true)
    try {
      const res = await chatAPI.upload(formData)
      const aiMsg = {
        role: 'assistant',
        content: `**📄 Document: ${res.data.filename}**\n\n${res.data.summary}`,
        sentiment: 'neutral',
        category: 'general',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch {
      setError('File upload failed.')
    } finally {
      setTyping(false)
      e.target.value = ''
    }
  }

  async function handleExport() {
    if (!currentSession) return
    const res = await chatAPI.export(currentSession)
    const blob = new Blob([res.data], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'chat-export.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-screen mesh-bg overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <div className="flex items-center gap-2 pr-3">
          <div className="flex-1">
            <Navbar title="Chat" onMenuClick={() => setSidebarOpen(true)} />
          </div>
          {currentSession && (
            <button
              onClick={handleExport}
              title="Export chat"
              className="btn-ghost text-xs flex items-center gap-1 py-1.5"
            >
              <span>⬇️</span> Export
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && !typing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-white text-lg font-semibold">Start a Conversation</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-xs">
                Ask me anything — technology, education, health, finance, or general topics.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {[
                  'Explain machine learning simply',
                  'Give me study tips for exams',
                  'How to invest wisely?',
                  'Write a Python function for sorting',
                ].map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); inputRef.current?.focus() }}
                    className="glass text-slate-300 text-xs px-4 py-2 rounded-xl hover:bg-white/10
                               transition-all hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((m, i) => (
              <ChatBubble
                key={i}
                role={m.role}
                content={m.content}
                sentiment={m.sentiment}
                category={m.category}
                timestamp={m.timestamp}
              />
            ))}
          </AnimatePresence>

          {typing && <TypingIndicator />}

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-rose-400 text-xs text-center"
            >
              ⚠️ {error}
            </motion.p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/10 glass-dark">
          <form onSubmit={sendMessage} className="flex items-end gap-3">
            {/* File upload */}
            <label
              htmlFor="file-upload"
              title="Upload PDF / DOCX"
              className="btn-ghost p-2.5 rounded-xl cursor-pointer flex-shrink-0"
            >
              📎
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              id="chat-input"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message SmartAssist AI…"
              className="input-field resize-none flex-1 max-h-32 overflow-y-auto py-3 leading-relaxed"
              style={{ height: 'auto', minHeight: '48px' }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`
              }}
            />

            {/* Voice */}
            <button
              type="button"
              id="voice-btn"
              onClick={toggleVoice}
              title="Voice input"
              className={`p-2.5 rounded-xl transition-all flex-shrink-0
                ${listening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'btn-ghost'}`}
            >
              🎤
            </button>

            {/* Send */}
            <button
              id="send-btn"
              type="submit"
              disabled={!input.trim() || typing}
              className="btn-primary p-3 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {typing ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
          <p className="text-slate-600 text-[10px] text-center mt-2">
            Press Enter to send • Shift+Enter for new line • 🎤 for voice input
          </p>
        </div>
      </div>
    </div>
  )
}
