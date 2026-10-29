import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import CodeBackground from '@/components/hazsight/code-background'
import { DebugPanel } from '@/components/hazsight/debug-panel'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Hazsight — AI Safety Inspector',
  description:
    'Hazsight analyzes photos of rooms, workspaces, and industrial sites to detect occupational hazards, evaluate risk severity, and generate automated safety audit reports. Powered by NVIDIA Nemotron on Nebius Token Factory.',
  keywords: [
    'Hazsight',
    'Nebius Token Factory',
    'NVIDIA Nemotron',
    'AI safety inspector',
    'hazard detection',
    'OHS compliance',
    'EHS monitoring',
    'Next.js',
    'TypeScript',
  ],
  authors: [{ name: 'Team DAMR58H' }],
  openGraph: {
    title: 'Hazsight — AI Safety Inspector',
    description:
      'Upload a photo. Get an annotated risk report in 30 seconds. Powered by NVIDIA Nemotron on Nebius Token Factory.',
    siteName: 'Hazsight',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hazsight — AI Safety Inspector',
    description:
      'Upload a photo. Get an annotated risk report in 30 seconds. Powered by NVIDIA Nemotron on Nebius Token Factory.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <CodeBackground />
          {children}
          <Toaster />
          <DebugPanel />
        </ThemeProvider>
      </body>
    </html>
  )
}
