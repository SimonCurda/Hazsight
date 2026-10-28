/**
 * POST /api/chat
 *
 * Chat with Nemotron about the analyzed scene + safety regulations.
 * Uses Nemotron 3 Super (fast model) for responsive conversation.
 * Context: the analysis result (hazards, scene description, score).
 * Can also search Tavily for specific law/regulation questions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { nebiusAvailable, NEBIUS_FAST_MODEL, getNebiusClient } from '@/lib/nebius'
import { tavilyAvailable, searchRegulations } from '@/lib/tavily'

export const runtime = 'nodejs'
export const maxDuration = 30

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequestBody {
  message: string
  history?: ChatMessage[]
  context?: {
    sceneDescription?: string
    hazards?: Array<{
      category: string
      severity: string
      description: string
      affected_area: string
      recommendation: string
      confidence: number
    }>
    safetyScore?: number
    regulations?: Array<{
      hazard_category: string
      jurisdiction: string
      results: Array<{ title: string; url: string; content: string }>
    }>
  }
  jurisdiction?: string
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body: ChatRequestBody = await req.json().catch(() => ({}))
  const { message, history = [], context, jurisdiction = 'CZECH' } = body

  if (!message) {
    return NextResponse.json({ error: 'No message provided' }, { status: 400 })
  }

  if (!nebiusAvailable()) {
    return NextResponse.json({
      reply: 'I need a Nebius API key to answer questions. Please set NEBIUS_API_KEY.',
    })
  }

  // Build system prompt with analysis context
  const hazardsSummary = context?.hazards?.map((h, i) =>
    `${i + 1}. ${h.category} (${h.severity}): ${h.description} — ${h.affected_area} — ${h.recommendation} (${Math.round(h.confidence * 100)}% confidence)`
  ).join('\n') || 'No hazards data available.'

  // Extract fire-specific data for the chatbot context
  const fireHazards = context?.hazards?.filter(h => h.category === 'FIRE_SMOKE') || []
  const fireSummary = fireHazards.length > 0
    ? fireHazards.map((h, i) =>
        `Fire ${i + 1}:\n` +
        `- Severity: ${h.severity}\n` +
        `- Status: ${(h as any).fire_severity_level || 'unknown'}\n` +
        `- Origin point: ${(h as any).fire_origin_point ? `x=${(h as any).fire_origin_point.x}%, y=${(h as any).fire_origin_point.y}%` : 'not pinpointed'}\n` +
        `- Likely cause: ${(h as any).fire_cause || 'cause not determined — infer from the scene description and affected_area'}\n` +
        `- What's burning: ${h.description}\n` +
        `- Location: ${h.affected_area}`
      ).join('\n\n')
    : 'No fire hazards detected in this scene.'

  const regulationsSummary = context?.regulations?.map(r =>
    `${r.hazard_category}: ${r.results.map(res => res.title).join(', ')}`
  ).join('\n') || 'No regulations data available.'

  const systemPrompt = `You are Hazsight AI, a workplace safety assistant. You help users understand safety hazards in their analyzed photos.

SCENE ANALYSIS CONTEXT:
- Scene: ${context?.sceneDescription || 'No scene description available.'}
- Safety Score: ${context?.safetyScore || '?'}/100

FIRE ANALYSIS (if fire was detected):
${fireSummary}

DETECTED HAZARDS:
${hazardsSummary}

REGULATION CITATIONS FOUND:
${regulationsSummary}

You can:
1. Answer questions about the hazards detected in this specific scene
2. Explain safety recommendations
3. Discuss the safety score and what it means
4. If asked about fire origin or cause, use the FIRE ANALYSIS section above — mention the origin point coordinates, severity level, and likely cause
5. If asked about specific laws/regulations, mention what was already found via Tavily

Be concise, helpful, and reference specific hazards from the analysis when relevant. Use simple language.

IMPORTANT: Do NOT show your reasoning process, thinking steps, or chain-of-thought. Do NOT write "Here's a thinking process" or numbered analysis steps. Just give the direct answer to the user's question as if you're a human safety expert talking to them.`

  try {
    // Check if the user is asking about laws/regulations — if so, search Tavily
    const lawKeywords = ['law', 'regulation', 'vyhláška', 'zákon', 'legal', 'compliance', 'requirement', 'standard', 'osha', 'iso', 'directive']
    const isLawQuestion = lawKeywords.some(kw => message.toLowerCase().includes(kw))

    let tavilyContext = ''
    if (isLawQuestion && tavilyAvailable()) {
      const results = await searchRegulations(
        'OTHER',
        message.slice(0, 200),
        jurisdiction,
      )
      if (results.length > 0) {
        tavilyContext = '\n\nAdditional regulation search results:\n' +
          results.map(r => `- ${r.title} (${r.url})\n  ${r.content?.slice(0, 200)}`).join('\n')
      }
    }

    const client = getNebiusClient()
    if (!client) {
      return NextResponse.json({ reply: 'Nebius API key not configured.' })
    }

    const response = await client.chat.completions.create({
      model: 'nvidia/Nemotron-3_5-Lightning',
      messages: [
        { role: 'system', content: systemPrompt + tavilyContext },
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    })

    let reply = response.choices[0]?.message?.content || 'I could not generate a response.'

    // Strip thinking/reasoning that Nemotron models sometimes leak
    // Remove <think>...</think> blocks
    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    // Remove "Here's a thinking process:" preamble
    const thinkingIdx = reply.toLowerCase().indexOf("here's a thinking process")
    if (thinkingIdx >= 0) {
      // Find where the actual answer starts (after the reasoning)
      const afterThinking = reply.slice(thinkingIdx)
      // Look for a double newline after the reasoning section
      const answerMatch = afterThinking.match(/\n\n([A-Z][\s\S]+)/)
      if (answerMatch) {
        reply = answerMatch[1].trim()
      }
    }
    // Remove numbered reasoning steps (1. Analyze... 2. Identify... etc.)
    reply = reply.replace(/^(\d+\.\s+(Analyze|Identify|Check|Determine|Formulate|Review|Let|Important|Based|I need|I should|I can|Step)\b[\s\S]*?)(?=\n\n[A-Z]|\n\nBased|\n\nAccording|\n\nThe |\n\nHere|\n\nFrom)/m, '').trim()
    // If reply still starts with reasoning, try to find the actual answer
    if (reply.match(/^\d+\.\s/) || reply.toLowerCase().startsWith('here\'s') || reply.toLowerCase().startsWith('let me')) {
      const lines = reply.split('\n\n')
      // Find first line that looks like an actual answer (not a step)
      const answerLine = lines.find(l => !l.match(/^\d+\./) && !l.toLowerCase().startsWith('here\'s') && !l.toLowerCase().startsWith('let me') && l.length > 20)
      if (answerLine) reply = answerLine.trim()
    }

    return NextResponse.json({
      reply,
      tavily_searched: isLawQuestion && tavilyAvailable(),
      tavily_results: isLawQuestion && tavilyAvailable() ? tavilyContext.length > 0 : false,
    })
  } catch (err) {
    console.error('[chat] error:', err)
    return NextResponse.json({
      reply: 'Sorry, I encountered an error. Please try again.',
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}
