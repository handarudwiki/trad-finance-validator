'use client'

import { useMemo, useState } from 'react'
import { createWorker } from 'tesseract.js'

type OcrStatus = 'idle' | 'reading' | 'done' | 'error'

const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/tiff']

export function OcrUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [status, setStatus] = useState<OcrStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const canRun = useMemo(() => Boolean(file) && status !== 'reading', [file, status])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    setText('')
    setProgress(0)
    setError(null)
    setStatus('idle')

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    if (!selectedFile) {
      setFile(null)
      return
    }

    if (!SUPPORTED_TYPES.includes(selectedFile.type)) {
      setFile(null)
      setError('Format belum didukung. Gunakan PNG, JPG, WEBP, BMP, atau TIFF.')
      return
    }

    setFile(selectedFile)
    setPreviewUrl(URL.createObjectURL(selectedFile))
  }

  const runOcr = async () => {
    if (!file) return

    setStatus('reading')
    setProgress(0)
    setText('')
    setError(null)

    let worker: Awaited<ReturnType<typeof createWorker>> | null = null

    try {
      worker = await createWorker('eng+ind', 1, {
        logger: (message) => {
          if (message.status === 'recognizing text') {
            setProgress(Math.round(message.progress * 100))
          }
        },
      })

      const result = await worker.recognize(file)
      setText(result.data.text.trim())
      setProgress(100)
      setStatus('done')
    } catch (err) {
      console.error('OCR failed:', err)
      setError('OCR gagal diproses. Coba gambar yang lebih jelas atau format file lain.')
      setStatus('error')
    } finally {
      await worker?.terminate()
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-50 text-slate-950 lg:grid-cols-[420px_1fr]">
      <aside className="border-b border-slate-200 bg-white px-6 py-6 lg:border-b-0 lg:border-r lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-700">New OCR Flow</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Upload dokumen untuk OCR</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Pilih gambar dokumen, jalankan OCR, lalu lihat teks mentah hasil pembacaan library.
          </p>
        </div>

        <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-blue-400 hover:bg-blue-50">
          <span className="block text-sm font-medium text-slate-900">Pilih file gambar</span>
          <span className="mt-1 block text-xs text-slate-500">PNG, JPG, WEBP, BMP, TIFF</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        {file && (
          <div className="mt-4 rounded-md border border-slate-200 bg-white p-3 text-sm">
            <p className="font-medium text-slate-900">{file.name}</p>
            <p className="mt-1 text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={runOcr}
          disabled={!canRun}
          className="mt-5 w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {status === 'reading' ? `Membaca OCR ${progress}%` : 'Jalankan OCR'}
        </button>

        {status === 'reading' && (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </aside>

      <main className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-2 lg:p-8">
        <section className="min-h-[360px] rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Preview</h2>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Preview dokumen OCR" className="max-h-[72vh] w-full rounded-md object-contain" />
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500">
              Belum ada dokumen dipilih
            </div>
          )}
        </section>

        <section className="min-h-[360px] rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Output OCR</h2>
            {text && <span className="text-xs text-slate-500">{text.length} karakter</span>}
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Hasil OCR akan muncul di sini setelah file diproses."
            className="h-[72vh] min-h-[320px] w-full resize-none rounded-md border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
          />
        </section>
      </main>
    </div>
  )
}