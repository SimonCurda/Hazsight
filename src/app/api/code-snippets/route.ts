/**
 * GET /api/code-snippets
 *
 * Reads actual source files from the project and returns random code snippets.
 * The CodeBackground component fetches from this endpoint to display REAL
 * code from the codebase in the background.
 *
 * Falls back to hardcoded snippets if file reading fails.
 */

import { NextResponse } from 'next/server'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SOURCE_DIRS = [
  'src/lib',
  'src/app/api',
  'src/components/hazsight',
  'src/app',
  'backend-snippets', // Python backend code (mix of frontend + backend in background)
]

const FILE_EXTENSIONS = ['.ts', '.tsx', '.py']

const FALLBACK_SNIPPETS: string[][] = [
  ["// nebius.ts", "const client = new OpenAI({", '  baseURL: "https://api.tokenfactory.nebius.com/v1/",', "});"],
  ["// tavily.ts", "export async function searchAllRegulations(hazards) {", "  for (const h of uniqueCategories) {", "    const results = await searchRegulations(h.category);", "  }", "}"],
  ["// /api/analyze", "const jobId = createJob(imageUrl, imageBase64);", "await runAnalysis(jobId, imageBase64);"],
  ["// pdf-report.tsx", "const pdfBuffer = await renderToBuffer(", "  React.createElement(PdfReport, { score, hazards })", ");"],
  ["# schemas.py", "class BoundingBox(BaseModel):", "    x: float = Field(ge=0, le=100)", "    y: float = Field(ge=0, le=100)"],
]

function readSourceFiles(basePath: string): string[][] {
  const snippets: string[][] = []

  for (const dir of SOURCE_DIRS) {
    const fullPath = join(basePath, dir)
    if (!existsSync(fullPath)) continue

    let files: string[]
    try {
      files = readdirSync(fullPath).filter((f) => FILE_EXTENSIONS.some((ext) => f.endsWith(ext)))
    } catch {
      continue
    }

    for (const file of files) {
      try {
        const content = readFileSync(join(fullPath, file), 'utf-8')
        const lines = content.split('\n').filter((l) => l.trim().length > 0)

        if (lines.length < 3) continue
        const snippetLen = Math.min(3 + Math.floor(Math.random() * 5), lines.length)
        const startIdx = Math.floor(Math.random() * (lines.length - snippetLen + 1))
        const snippet = lines.slice(startIdx, startIdx + snippetLen)
        // Comment prefix matches file extension: // for TS, # for Python
        const commentPrefix = file.endsWith('.py') ? '#' : '//'
        snippet.unshift(`${commentPrefix} ${file}`)
        snippets.push(snippet)
      } catch {
        continue
      }
    }
  }

  return snippets.length > 0 ? snippets : FALLBACK_SNIPPETS
}

export async function GET() {
  const basePath = process.cwd()
  const allSnippets = readSourceFiles(basePath)

  const selected: string[][] = []
  for (let i = 0; i < Math.min(4, allSnippets.length); i++) {
    let idx: number
    let tries = 0
    do {
      idx = Math.floor(Math.random() * allSnippets.length)
      tries++
    } while (selected.includes(allSnippets[idx]) && tries < 20)
    selected.push(allSnippets[idx])
  }

  return NextResponse.json({
    snippets: selected.length > 0 ? selected : FALLBACK_SNIPPETS,
  })
}
