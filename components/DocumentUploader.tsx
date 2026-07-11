'use client'

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
]

const ALLOWED_EXTENSIONS = '.pdf, .jpg, .jpeg, .png, .tiff, .tif'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface DocumentUploaderProps {
  onUpload: (file: File) => Promise<void>
  label?: string
  disabled?: boolean
}

export function DocumentUploader({ onUpload, label, disabled = false }: DocumentUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `Tipe file tidak didukung: "${file.type || 'tidak diketahui'}". Format yang diterima: PDF, JPEG, PNG, TIFF.`
    }
    return null
  }

  const resetState = () => {
    if (isUploading || disabled) return
    setSelectedFile(null)
    setProgress(0)
    setIsUploading(false)
    setSuccess(false)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleFile = useCallback(async (file: File) => {
    if (isUploading || disabled) return
    setError(null)
    setSuccess(false)
    setProgress(0)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setIsUploading(true)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 200)

    try {
      await onUpload(file)
      clearInterval(progressInterval)
      setProgress(100)
      setSuccess(true)
    } catch (err) {
      clearInterval(progressInterval)
      setProgress(0)
      const message =
        err instanceof Error ? err.message : 'Gagal mengunggah file. Silakan coba lagi.'
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }, [onUpload, isUploading, disabled])

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (isUploading || disabled) return
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (isUploading || disabled) return
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isUploading || disabled) return
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleClick = () => {
    if (!isUploading && !success && !disabled) {
      inputRef.current?.click()
    }
  }

  return (
    <div className="w-full">
      {label && (
        <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      )}

      {/* Success state */}
      {success && selectedFile ? (
        <div className="border border-green-200 bg-green-50/30 p-4" style={{ borderRadius: '8px' }}>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Uploaded successfully</p>
              <p className="text-sm font-semibold text-green-950 truncate mt-0.5">{selectedFile.name}</p>
              <p className="text-xs text-green-600/80 mt-0.5">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              onClick={resetState}
              className="btn btn-secondary h-8 px-3 text-xs font-semibold border border-green-200 hover:bg-green-100/50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: '8px' }}
              disabled={isUploading || disabled}
            >
              Change File
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`relative cursor-pointer border border-dashed p-6 text-center transition-all ${
              isDragOver
                ? 'border-zinc-800 bg-zinc-50/60'
                : 'border-zinc-300 hover:border-zinc-650 bg-zinc-50/20'
            } ${(isUploading || disabled) ? 'pointer-events-none opacity-60' : ''}`}
            style={{ borderRadius: '8px' }}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS}
              onChange={handleInputChange}
              className="hidden"
              disabled={isUploading || disabled}
            />

            <div className="flex flex-col items-center gap-3">
              <div className={`h-11 w-11 rounded-full flex items-center justify-center border ${
                isDragOver ? 'bg-zinc-100 border-zinc-300' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <svg
                  className={`h-5 w-5 ${isDragOver ? 'text-zinc-800' : 'text-zinc-500'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-zinc-600 font-medium">
                  <span className="font-bold text-zinc-900 hover:underline">Click to upload</span> or drag and drop file here
                </p>
                <p className="mt-1 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  PDF, JPEG, PNG, or TIFF — Max. 20 MB
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Uploading progress */}
      {isUploading && selectedFile && (
        <div className="mt-3 border border-zinc-200 p-4" style={{ borderRadius: '8px', background: 'var(--surface)' }}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 h-9 w-9 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate">{selectedFile.name}</p>
              <p className="text-xs text-zinc-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <span className="text-xs font-bold text-zinc-700">{progress}%</span>
          </div>
          <div className="mt-3 w-full bg-zinc-100 rounded-full h-1.5">
            <div
              className="bg-zinc-800 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 alert alert-error flex items-start gap-3" style={{ borderRadius: '8px' }}>
          <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div className="flex-1">
            <p className="text-xs font-semibold text-red-800">{error}</p>
            <button
              onClick={resetState}
              className="mt-1.5 text-xs font-bold text-red-700 hover:text-red-900 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
