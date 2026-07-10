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
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Dokumen Pendukung</h3>
        <span className="text-sm text-gray-500">
          {uploadedCount} / {totalCount} diunggah
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      {/* Upload slots */}
      <div className="space-y-4">
        {slots.map((slot, index) => (
          <div
            key={`${slot.document.documentType}-${index}`}
            className={`rounded-lg border p-4 ${
              slot.uploaded ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  {slot.uploaded && (
                    <svg
                      className="h-5 w-5 text-green-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <h4 className="text-sm font-medium text-gray-900">
                    {slot.document.documentType}
                  </h4>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span>Asli: {slot.document.originals}</span>
                  <span>Salinan: {slot.document.copies}</span>
                </div>
                {slot.document.requirements && (
                  <p className="mt-1 text-xs text-gray-600 italic">
                    Persyaratan: {slot.document.requirements}
                  </p>
                )}
              </div>
            </div>

            {!slot.uploaded && (
              <DocumentUploader
                onUpload={handleUpload(index)}
                label={`Unggah ${slot.document.documentType}`}
              />
            )}
          </div>
        ))}
      </div>

      {totalCount === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Tidak ada dokumen pendukung yang diperlukan.</p>
        </div>
      )}
    </div>
  )
}
