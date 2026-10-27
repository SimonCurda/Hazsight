'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Send, Bot, User, Loader2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

/** Simple markdown renderer: bold (**text**), line breaks, emoji support */
function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Render **bold** segments
        const parts = line.split(/(\*\*[^*]+\*\*)/g)
        return (
          <p key={i} className={line.startsWith('**') || line.startsWith('-') || line.startsWith('🔥') || line.startsWith('🛠') || line.startsWith('📈') ? 'font-medium' : ''}>
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="font-bold text-lime-400">{part.slice(2, -2)}</strong>
              }
              return <span key={j}>{part}</span>
            })}
          </p>
        )
      })}
    </div>
  )
}

export function ChatPanel({ result, jurisdiction }: ChatPanelProps) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const sendMessage = async (msg?: string) => {
    const message = (msg || input).trim()
    if (!message || loading) return

    const userMsg: Message = { role: 'user', content: message }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: messages.slice(-6),
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
  }, [messages, loading])

  const suggestions = [
    'What are the biggest risks here?',
    'How can I improve the safety score?',
    'What regulations apply to fire safety?',
    'Explain the safety score',
  ]

  return (
    <Card className="hazsight-glass border-border/40 bg-card/70 shadow-lg shadow-black/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-wide">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-500/15 text-lime-400">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
          Ask Hazsight AI
          <span className="text-[10px] font-normal text-muted-foreground">
            · Nemotron Lightning · Tavily
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Messages */}
        <div ref={scrollRef} className="max-h-80 space-y-3 overflow-y-auto rounded-lg bg-black/20 p-3">
          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="text-center text-xs text-muted-foreground">
                Ask about hazards, regulations, or how to fix issues.
              </p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {suggestions.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/40 px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-all hover:border-lime-500/30 hover:text-lime-400"
                  >
                    <Sparkles className="h-3 w-3 flex-shrink-0 text-lime-500/60" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-lime-500/15">
                  <Bot className="h-3.5 w-3.5 text-lime-400" />
                </div>
              )}
              <div className={cn(
                'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                msg.role === 'user' ? 'bg-lime-500/15 text-foreground' : 'bg-muted/50 text-foreground'
              )}>
                {msg.role === 'assistant' ? <FormattedText text={msg.content} /> : msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-500/15">
                <Bot className="h-3.5 w-3.5 text-lime-400" />
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-muted/50 px-3 py-2">
                <Loader2 className="h-3 w-3 animate-spin text-lime-400" />
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Ask about hazards, regulations, fixes..."
            className="flex-1 rounded-lg border border-border/40 bg-background/50 px-3 py-2 text-sm outline-none focus:border-lime-500/30"
            disabled={loading}
          />
          <Button
            size="icon"
            className="h-9 w-9 flex-shrink-0 bg-lime-500/15 text-lime-400 hover:bg-lime-500/25"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
