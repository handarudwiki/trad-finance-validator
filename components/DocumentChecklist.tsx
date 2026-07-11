import { useState, useEffect } from 'react'
import { DocumentUploader } from './DocumentUploader'
import { FormSection } from './FormSection'

interface RequiredDocument {
  documentType: string
  originals: number
  copies: number
  requirements?: string | null
}

interface DocumentChecklistProps {
  requiredDocuments: RequiredDocument[]
  uploadedDocs?: { documentType: string }[]
  transactionId: string
}

interface UploadSlot {
  document: RequiredDocument
  uploaded: boolean
  uploading: boolean
}

export function DocumentChecklist({
  requiredDocuments,
  uploadedDocs = [],
  transactionId,
}: DocumentChecklistProps) {
  const [slots, setSlots] = useState<UploadSlot[]>([])

  useEffect(() => {
    setSlots(
      requiredDocuments.map((doc) => ({
        document: doc,
        uploaded: uploadedDocs.some((ud) => ud.documentType === doc.documentType),
        uploading: false,
      }))
    )
  }, [requiredDocuments, uploadedDocs])

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
      <FormSection
        title="Required Documents Progress"
        badge={
          <span className="text-xs font-semibold text-zinc-650 bg-zinc-100 border border-zinc-200 px-3 py-1" style={{ borderRadius: '6px' }}>
            {uploadedCount} / {totalCount} uploaded
          </span>
        }
      >
        <p className="text-xs text-zinc-500 mb-4 mt-[-6px]">
          Upload all specified files below to complete the validation task.
        </p>

        {/* Progress bar */}
        <div className="w-full bg-zinc-150 rounded-full h-2" style={{ borderRadius: '8px', background: '#f4f4f5' }}>
          <div
            className="bg-zinc-800 h-2 transition-all duration-300"
            style={{ 
              width: `${totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0}%`,
              borderRadius: '8px'
            }}
          />
        </div>

        {/* Example Documents download links */}
        <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-3 text-xs text-zinc-500 font-medium">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          <span>Need test files? Download examples:</span>
          <div className="flex gap-2">
            <a href="/examples/commercial_invoice.pdf" download className="text-zinc-850 hover:underline font-bold">Invoice</a>
            <span className="text-zinc-300">•</span>
            <a href="/examples/bill_of_lading.pdf" download className="text-zinc-850 hover:underline font-bold">Bill of Lading</a>
            <span className="text-zinc-300">•</span>
            <a href="/examples/packing_list.pdf" download className="text-zinc-850 hover:underline font-bold">Packing List</a>
          </div>
        </div>
      </FormSection>

      {/* Upload slots - rendered as separate cards */}
      <div className="space-y-4">
        {slots.map((slot, index) => (
          <FormSection
            key={`${slot.document.documentType}-${index}`}
            title={slot.document.documentType}
            badge={
              slot.uploaded ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200" style={{ borderRadius: '6px' }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Uploaded
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-zinc-100 text-zinc-650 border border-zinc-200" style={{ borderRadius: '6px' }}>
                  Required
                </span>
              )
            }
            style={{
              borderColor: slot.uploaded ? '#bbf7d0' : 'var(--border)',
            }}
            bodyStyle={{
              background: slot.uploaded ? '#f0fdf4' : 'var(--surface)',
            }}
            headerStyle={{
              background: slot.uploaded ? '#f0fdf4' : '#FAFAFA',
              borderBottom: slot.uploaded ? '1px solid #bbf7d0' : '1px solid var(--border)',
            }}
          >
            <div className="space-y-2">
              {slot.document.requirements && (
                <p className="text-xs text-zinc-500 italic bg-zinc-50/40 p-2.5 border border-zinc-100" style={{ borderRadius: '6px', maxWidth: '640px' }}>
                  <span className="font-semibold not-italic text-zinc-650">Requirements:</span> {slot.document.requirements}
                </p>
              )}
            </div>

            {slot.uploaded ? (
              <div style={{ marginTop: '16px' }}>
                <button
                  onClick={() => {
                    setSlots((prev) =>
                      prev.map((s, i) => (i === index ? { ...s, uploaded: false } : s))
                    )
                  }}
                  className="btn btn-secondary h-8 px-3 text-xs"
                  style={{ borderRadius: '8px' }}
                >
                  Change File
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '20px' }}>
                <DocumentUploader
                  onUpload={handleUpload(index)}
                  label=""
                  disabled={slot.uploading}
                />
              </div>
            )}
          </FormSection>
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
