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
}

export function DocumentUploader({ onUpload, label }: DocumentUploaderProps) {
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
    setSelectedFile(null)
    setProgress(0)
    setIsUploading(false)
    setSuccess(false)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleFile = useCallback(async (file: File) => {
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
  }, [onUpload])

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleClick = () => {
    if (!isUploading && !success) {
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
        <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800">Berhasil diunggah</p>
              <p className="text-sm text-green-700 truncate">{selectedFile.name}</p>
              <p className="text-xs text-green-600">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              onClick={resetState}
              className="flex-shrink-0 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
              Ganti File
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
            className={`relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
              isDragOver
                ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 bg-white'
            } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS}
              onChange={handleInputChange}
              className="hidden"
              disabled={isUploading}
            />

            <div className="flex flex-col items-center gap-3">
              <div className={`h-14 w-14 rounded-full flex items-center justify-center ${
                isDragOver ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <svg
                  className={`h-7 w-7 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-blue-600 hover:text-blue-700">Klik untuk memilih file</span>{' '}
                  atau seret dan lepas di sini
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  PDF, JPEG, PNG, atau TIFF — Maks. 20 MB
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Uploading progress */}
      {isUploading && selectedFile && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <span className="text-sm font-medium text-blue-600">{progress}%</span>
          </div>
          <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={resetState}
              className="mt-2 text-xs font-medium text-red-600 hover:text-red-800 underline"
            >
              Coba lagi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
