'use client'

import * as React from 'react'
import { Upload, X, Camera, FileWarning } from 'lucide-react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UploadDropzoneProps {
  onFileSelected: (file: File, previewUrl: string) => void
  onAnalyze: () => void
  onClear: () => void
  previewUrl: string | null
  isUploading: boolean
}

export function UploadDropzone({
  onFileSelected,
  onAnalyze,
  onClear,
  previewUrl,
  isUploading,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, or WebP).')
      return
    }
    const url = URL.createObjectURL(file)
    onFileSelected(file, url)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  if (previewUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-xl border border-border bg-card"
      >
        <img
          src={previewUrl}
          alt="Uploaded preview"
          className="max-h-[400px] w-full object-contain"
        />
        <div className="absolute right-3 top-3 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5"
            onClick={onClear}
            disabled={isUploading}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
        <div className="border-t border-border bg-muted/30 p-4">
          <Button
            className="w-full gap-2 bg-lime-500 text-lime-950 hover:bg-lime-400"
            size="lg"
            disabled={isUploading}
            onClick={onAnalyze}
          >
            {isUploading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-lime-950/30 border-t-lime-950" />
                Analyzing...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Analyze for hazards
              </>
            )}
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Upload an image by clicking or dragging a file here"
      className={cn(
        'group relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
        isDragging
          ? 'border-lime-500 bg-lime-500/5'
          : 'border-border hover:border-lime-500/50 hover:bg-muted/30',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <motion.div
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-500/10 text-lime-600 dark:text-lime-400"
      >
        <Upload className="h-7 w-7" />
      </motion.div>
      <div>
        <p className="font-mono text-lg font-semibold">
          Drop a photo here, or click to browse
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          JPEG, PNG, or WebP — up to 10 MB
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <FileWarning className="h-3.5 w-3.5" />
        Photos are processed locally for preview; analysis runs on Nebius Token Factory.
      </div>
    </div>
  )
}
