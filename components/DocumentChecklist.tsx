'use client'

import { useState } from 'react'
import { DocumentUploader } from './DocumentUploader'

interface RequiredDocument {
  documentType: string
  originals: number
  copies: number
  requirements?: string | null
}

interface DocumentChecklistProps {
  requiredDocuments: RequiredDocument[]
  transactionId: string
}

interface UploadSlot {
  document: RequiredDocument
  uploaded: boolean
  uploading: boolean
}

export function DocumentChecklist({
  requiredDocuments,
  transactionId,
}: DocumentChecklistProps) {
  const [slots, setSlots] = useState<UploadSlot[]>(
    requiredDocuments.map((doc) => ({
      document: doc,
      uploaded: false,
      uploading: false,
    }))
  )

  const handleUpload = (index: number) => async (file: File) => {
    setSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, uploading: true } : slot))
    )

    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', slots[index].document.documentType)

    const response = await fetch(
      `/api/transactions/${transactionId}/supporting-documents`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      setSlots((prev) =>
        prev.map((slot, i) => (i === index ? { ...slot, uploading: false } : slot))
      )
      const data = await response.json().catch(() => ({}))
      throw new Error(
        data.error || 'Gagal mengunggah dokumen pendukung. Silakan coba lagi.'
      )
    }

    setSlots((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, uploaded: true, uploading: false } : slot
      )
    )
  }

  const uploadedCount = slots.filter((s) => s.uploaded).length
  const totalCount = slots.length

  return (
    <div className="space-y-6">
      {/* Overall completion progress card */}
      <div className="card" style={{ boxShadow: 'none', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <div className="card-body" style={{ padding: '20px' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Required Documents Progress</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Upload all specified files below to complete the validation task.
              </p>
            </div>
            <span className="text-xs font-semibold text-zinc-650 bg-zinc-100 border border-zinc-200 px-3 py-1" style={{ borderRadius: '6px' }}>
              {uploadedCount} / {totalCount} uploaded
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-zinc-150 rounded-full h-2 mt-4" style={{ borderRadius: '8px', background: '#f4f4f5' }}>
            <div
              className="bg-zinc-800 h-2 transition-all duration-300"
              style={{ 
                width: `${totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0}%`,
                borderRadius: '8px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Upload slots - rendered as separate cards */}
      <div className="space-y-4">
        {slots.map((slot, index) => (
          <div
            key={`${slot.document.documentType}-${index}`}
            className="card"
            style={{ 
              borderColor: slot.uploaded ? '#bbf7d0' : 'var(--border)',
              background: slot.uploaded ? '#f0fdf4' : 'var(--surface)',
              boxShadow: 'none',
              borderRadius: '8px'
            }}
          >
            <div className="card-body" style={{ padding: '20px' }}>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {slot.uploaded ? (
                      <div className="bg-emerald-100 text-emerald-700 p-0.5 rounded-full flex items-center justify-center">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="bg-zinc-100 text-zinc-500 p-0.5 rounded-full flex items-center justify-center border border-zinc-200">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    )}
                    <h4 className="text-sm font-bold text-zinc-900">
                      {slot.document.documentType}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-semibold">
                    <span className="bg-zinc-100/60 border border-zinc-200/50 px-2 py-0.5" style={{ borderRadius: '4px' }}>Originals: {slot.document.originals}</span>
                    <span className="bg-zinc-100/60 border border-zinc-200/50 px-2 py-0.5" style={{ borderRadius: '4px' }}>Copies: {slot.document.copies}</span>
                  </div>
                  
                  {slot.document.requirements && (
                    <p className="text-xs text-zinc-500 italic bg-zinc-50/40 p-2.5 border border-zinc-100" style={{ borderRadius: '6px', maxWidth: '640px' }}>
                      <span className="font-semibold not-italic text-zinc-650">Requirements:</span> {slot.document.requirements}
                    </p>
                  )}
                </div>
              </div>

              {!slot.uploaded && (
                <div style={{ marginTop: '20px' }}>
                  <DocumentUploader
                    onUpload={handleUpload(index)}
                    label=""
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalCount === 0 && (
        <div className="card text-center py-8" style={{ border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'none' }}>
          <p className="text-sm text-zinc-500">Tidak ada dokumen pendukung yang diperlukan.</p>
        </div>
      )}
    </div>
  )
}
