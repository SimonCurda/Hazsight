'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { JobResult } from '@/lib/mock-data'

interface ChatPanelProps {
  result: JobResult
  jurisdiction: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function ChatPanel({ result, jurisdiction }: ChatPanelProps) {
  const [open, setOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages.slice(-6), // last 3 exchanges for context
          context: {
            sceneDescription: result.scene_description,
            hazards: result.hazards,
            safetyScore: result.overall_safety_score,
            regulations: result.regulations,
          },
          jurisdiction,
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'No response' }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + (err instanceof Error ? err.message : 'unknown') }])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <>
      {/* Floating chat button — big and visible */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-lime-500 text-black shadow-2xl shadow-lime-500/30 transition-all hover:scale-110 hover:bg-lime-400"
        aria-label="Chat with Hazsight AI"
        title="Chat with Hazsight AI about this scene"
      >
        <MessageSquare className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
          AI
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:bg-transparent md:backdrop-blur-0"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl border-t border-lime-500/30 bg-card shadow-2xl md:bottom-4 md:left-4 md:right-auto md:max-w-md md:rounded-2xl md:border"
              style={{ maxHeight: '70vh', height: '70vh' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/40 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-500/15 text-lime-400">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-semibold">Hazsight AI</h3>
                    <p className="text-[10px] text-muted-foreground">Ask about this scene · Powered by Nemotron</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-500/10">
                      <MessageSquare className="h-6 w-6 text-lime-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Ask me anything about this scene</p>
                      <p className="mt-1 text-xs text-muted-foreground">I can explain hazards, recommend fixes, or search for regulations</p>
                    </div>
                    {/* Suggested questions */}
                    <div className="flex flex-col gap-1.5 pt-2">
                      {[
                        'What are the biggest risks here?',
                        'How do I fix the fire hazard?',
                        'What Czech law applies to blocked exits?',
                        'Explain the safety score',
                      ].map(q => (
                        <button
                          key={q}
                          onClick={() => { setInput(q); }}
                          className="rounded-lg border border-border/40 bg-card/50 px-3 py-1.5 text-left text-xs text-muted-foreground transition-all hover:border-lime-500/30 hover:text-lime-400"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-lime-500/15">
                        <Bot className="h-3.5 w-3.5 text-lime-400" />
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[80%] rounded-xl px-3 py-2 text-sm',
                      msg.role === 'user' ? 'bg-lime-500/15 text-foreground' : 'bg-muted/50 text-foreground'
                    )}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-500/15">
                      <Bot className="h-3.5 w-3.5 text-lime-400" />
                    </div>
                    <div className="flex items-center gap-1 rounded-xl bg-muted/50 px-3 py-2">
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border/40 p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
                    placeholder="Ask about hazards, regulations, fixes..."
                    className="flex-1 rounded-lg border border-border/40 bg-background/50 px-3 py-2 text-sm outline-none focus:border-lime-500/30"
                    disabled={loading}
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 flex-shrink-0 bg-lime-500/15 text-lime-400 hover:bg-lime-500/25"
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
