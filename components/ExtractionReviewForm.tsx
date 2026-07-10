'use client'

import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { ExtractedLCFieldsSchema, type ExtractedLCFields } from '@/schema/extraction'
import { LowConfidenceConfirmCheckbox } from './LowConfidenceConfirmCheckbox'

const LOW_CONFIDENCE_THRESHOLD = 0.85

interface ExtractionReviewFormProps {
  initialValues: ExtractedLCFields
  confidence: Record<string, number>
  transactionId: string
}

function getFieldConfidence(confidence: Record<string, number>, fieldName: string): number | undefined {
  return confidence[fieldName]
}

function isLowConfidence(confidence: Record<string, number>, fieldName: string): boolean {
  const score = getFieldConfidence(confidence, fieldName)
  return score !== undefined && score < LOW_CONFIDENCE_THRESHOLD
}

interface FieldWrapperProps {
  fieldName: string
  label: string
  confidence: Record<string, number>
  confirmedFields: Set<string>
  onConfirm: (fieldName: string) => void
  extractedValue: string
  children: React.ReactNode
  error?: string
}

function FieldWrapper({
  fieldName,
  label,
  confidence,
  confirmedFields,
  onConfirm,
  extractedValue,
  children,
  error,
}: FieldWrapperProps) {
  const lowConf = isLowConfidence(confidence, fieldName)

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className={lowConf ? 'rounded-md border-2 border-amber-400 p-2' : ''}>
        {children}
        {lowConf && !confirmedFields.has(fieldName) && (
          <div className="mt-2">
            <LowConfidenceConfirmCheckbox
              fieldName={fieldName}
              extractedValue={extractedValue}
              confidence={confidence[fieldName]}
              onConfirm={onConfirm}
            />
          </div>
        )}
        {lowConf && confirmedFields.has(fieldName) && (
          <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Dikonfirmasi
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function ExtractionReviewForm({
  initialValues,
  confidence,
  transactionId,
}: ExtractionReviewFormProps) {
  const router = useRouter()
  const [confirmedFields, setConfirmedFields] = useState<Set<string>>(new Set())
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<ExtractedLCFields>({
    resolver: zodResolver(ExtractedLCFieldsSchema),
    defaultValues: initialValues,
  })

  const { fields: docFields, append: appendDoc, remove: removeDoc } = useFieldArray({
    control,
    name: 'requiredDocuments',
  })

  // Gather all low-confidence fields
  const lowConfidenceFields = Object.entries(confidence)
    .filter(([, score]) => score < LOW_CONFIDENCE_THRESHOLD)
    .map(([field]) => field)

  const allLowConfirmed = lowConfidenceFields.every((f) => confirmedFields.has(f))

  const handleConfirm = (fieldName: string) => {
    setConfirmedFields((prev) => new Set(prev).add(fieldName))
  }

  const onSubmit = async (data: ExtractedLCFields) => {
    setApiError(null)

    try {
      const response = await fetch(`/api/transactions/${transactionId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.status === 400) {
        const result = await response.json()
        if (result.details && Array.isArray(result.details)) {
          result.details.forEach((err: { path?: string[]; message?: string }) => {
            if (err.path && err.path.length > 0) {
              const fieldPath = err.path.join('.') as keyof ExtractedLCFields
              setFieldError(fieldPath, { message: err.message || 'Nilai tidak valid' })
            }
          })
        }
        setApiError(result.error || 'Validasi skema gagal. Periksa kembali isian Anda.')
        return
      }

      if (!response.ok) {
        setApiError('Terjadi kesalahan saat menyimpan. Silakan coba lagi.')
        return
      }

      router.push(`/old/transactions/${transactionId}/documents`)
    } catch {
      setApiError('Gagal terhubung ke server. Periksa koneksi internet Anda.')
    }
  }

  const inputClass =
    'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Section 1: Transaction Identity */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          Identitas Transaksi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldWrapper
            fieldName="lcNumber"
            label="Nomor LC/SKBDN"
            confidence={confidence}
            confirmedFields={confirmedFields}
            onConfirm={handleConfirm}
            extractedValue={String(initialValues.lcNumber || '')}
            error={errors.lcNumber?.message}
          >
            <input {...register('lcNumber')} className={inputClass} />
          </FieldWrapper>

          <FieldWrapper
            fieldName="issueDate"
            label="Tanggal Terbit"
            confidence={confidence}
            confirmedFields={confirmedFields}
            onConfirm={handleConfirm}
            extractedValue={String(initialValues.issueDate || '')}
            error={errors.issueDate?.message}
          >
            <input {...register('issueDate')} type="date" className={inputClass} />
          </FieldWrapper>

          <FieldWrapper
            fieldName="expiryDate"
            label="Tanggal Berakhir"
            confidence={confidence}
            confirmedFields={confirmedFields}
            onConfirm={handleConfirm}
            extractedValue={String(initialValues.expiryDate || '')}
            error={errors.expiryDate?.message}
          >
            <input {...register('expiryDate')} type="date" className={inputClass} />
          </FieldWrapper>

          <FieldWrapper
            fieldName="expiryPlace"
            label="Tempat Berakhir"
            confidence={confidence}
            confirmedFields={confirmedFields}
            onConfirm={handleConfirm}
            extractedValue={String(initialValues.expiryPlace || '')}
            error={errors.expiryPlace?.message}
          >
            <input {...register('expiryPlace')} className={inputClass} />
          </FieldWrapper>
        </div>
      </section>

      {/* Section 2: Parties */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          Pihak-pihak
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Issuing Bank */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-800">Bank Penerbit</h4>
            <FieldWrapper
              fieldName="issuingBank.name"
              label="Nama"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.issuingBank?.name || '')}
              error={errors.issuingBank?.name?.message}
            >
              <input {...register('issuingBank.name')} className={inputClass} />
            </FieldWrapper>
            <FieldWrapper
              fieldName="issuingBank.address"
              label="Alamat"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.issuingBank?.address || '')}
              error={errors.issuingBank?.address?.message}
            >
              <input {...register('issuingBank.address')} className={inputClass} />
            </FieldWrapper>
            <FieldWrapper
              fieldName="issuingBank.swiftCode"
              label="Kode SWIFT"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.issuingBank?.swiftCode || '')}
              error={errors.issuingBank?.swiftCode?.message}
            >
              <input {...register('issuingBank.swiftCode')} className={inputClass} />
            </FieldWrapper>
          </div>

          {/* Advising Bank */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-800">Bank Penerus</h4>
            <FieldWrapper
              fieldName="advisingBank.name"
              label="Nama"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.advisingBank?.name || '')}
              error={errors.advisingBank?.name?.message}
            >
              <input {...register('advisingBank.name')} className={inputClass} />
            </FieldWrapper>
            <FieldWrapper
              fieldName="advisingBank.address"
              label="Alamat"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.advisingBank?.address || '')}
              error={errors.advisingBank?.address?.message}
            >
              <input {...register('advisingBank.address')} className={inputClass} />
            </FieldWrapper>
            <FieldWrapper
              fieldName="advisingBank.swiftCode"
              label="Kode SWIFT"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.advisingBank?.swiftCode || '')}
              error={errors.advisingBank?.swiftCode?.message}
            >
              <input {...register('advisingBank.swiftCode')} className={inputClass} />
            </FieldWrapper>
          </div>

          {/* Applicant */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-800">Pemohon (Applicant)</h4>
            <FieldWrapper
              fieldName="applicant.name"
              label="Nama"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.applicant?.name || '')}
              error={errors.applicant?.name?.message}
            >
              <input {...register('applicant.name')} className={inputClass} />
            </FieldWrapper>
            <FieldWrapper
              fieldName="applicant.address"
              label="Alamat"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.applicant?.address || '')}
              error={errors.applicant?.address?.message}
            >
              <input {...register('applicant.address')} className={inputClass} />
            </FieldWrapper>
          </div>

          {/* Beneficiary */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-800">Penerima Manfaat (Beneficiary)</h4>
            <FieldWrapper
              fieldName="beneficiary.name"
              label="Nama"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.beneficiary?.name || '')}
              error={errors.beneficiary?.name?.message}
            >
              <input {...register('beneficiary.name')} className={inputClass} />
            </FieldWrapper>
            <FieldWrapper
              fieldName="beneficiary.address"
              label="Alamat"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.beneficiary?.address || '')}
              error={errors.beneficiary?.address?.message}
            >
              <input {...register('beneficiary.address')} className={inputClass} />
            </FieldWrapper>
          </div>
        </div>
      </section>

      {/* Section 3: Financial Terms */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          Ketentuan Keuangan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FieldWrapper
            fieldName="currency"
            label="Mata Uang"
            confidence={confidence}
            confirmedFields={confirmedFields}
            onConfirm={handleConfirm}
            extractedValue={String(initialValues.currency || '')}
            error={errors.currency?.message}
          >
            <input {...register('currency')} className={inputClass} maxLength={3} />
          </FieldWrapper>

          <FieldWrapper
            fieldName="amount"
            label="Jumlah"
            confidence={confidence}
            confirmedFields={confirmedFields}
            onConfirm={handleConfirm}
            extractedValue={String(initialValues.amount || '')}
            error={errors.amount?.message}
          >
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  step="0.01"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : '')}
                  className={inputClass}
                />
              )}
            />
          </FieldWrapper>

          <FieldWrapper
            fieldName="tolerancePct"
            label="Toleransi (%)"
            confidence={confidence}
            confirmedFields={confirmedFields}
            onConfirm={handleConfirm}
            extractedValue={String(initialValues.tolerancePct ?? '')}
            error={errors.tolerancePct?.message}
          >
            <Controller
              name="tolerancePct"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  step="0.1"
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                  }
                  className={inputClass}
                />
              )}
            />
          </FieldWrapper>

          <FieldWrapper
            fieldName="paymentTenor"
            label="Tenor Pembayaran"
            confidence={confidence}
            confirmedFields={confirmedFields}
            onConfirm={handleConfirm}
            extractedValue={String(initialValues.paymentTenor || '')}
            error={errors.paymentTenor?.message}
          >
            <input {...register('paymentTenor')} className={inputClass} />
          </FieldWrapper>

          <FieldWrapper
            fieldName="availableWith"
            label="Tersedia Pada"
            confidence={confidence}
            confirmedFields={confirmedFields}
            onConfirm={handleConfirm}
            extractedValue={String(initialValues.availableWith || '')}
            error={errors.availableWith?.message}
          >
            <input {...register('availableWith')} className={inputClass} />
          </FieldWrapper>

          <FieldWrapper
            fieldName="availableBy"
            label="Tersedia Dengan"
            confidence={confidence}
            confirmedFields={confirmedFields}
            onConfirm={handleConfirm}
            extractedValue={String(initialValues.availableBy || '')}
            error={errors.availableBy?.message}
          >
            <input {...register('availableBy')} className={inputClass} />
          </FieldWrapper>
        </div>
      </section>

      {/* Section 4: Goods & Shipment */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          Barang &amp; Pengiriman
        </h3>
        <div className="space-y-4">
          <FieldWrapper
            fieldName="goodsDescription"
            label="Deskripsi Barang"
            confidence={confidence}
            confirmedFields={confirmedFields}
            onConfirm={handleConfirm}
            extractedValue={String(initialValues.goodsDescription || '')}
            error={errors.goodsDescription?.message}
          >
            <textarea {...register('goodsDescription')} rows={3} className={inputClass} />
          </FieldWrapper>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldWrapper
              fieldName="quantity"
              label="Kuantitas"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.quantity ?? '')}
              error={errors.quantity?.message}
            >
              <input {...register('quantity')} className={inputClass} />
            </FieldWrapper>

            <FieldWrapper
              fieldName="incoterms"
              label="Incoterms"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.incoterms || '')}
              error={errors.incoterms?.message}
            >
              <input {...register('incoterms')} className={inputClass} />
            </FieldWrapper>

            <FieldWrapper
              fieldName="latestShipmentDate"
              label="Tanggal Pengiriman Terakhir"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.latestShipmentDate || '')}
              error={errors.latestShipmentDate?.message}
            >
              <input {...register('latestShipmentDate')} type="date" className={inputClass} />
            </FieldWrapper>

            <FieldWrapper
              fieldName="portOfLoading"
              label="Pelabuhan Muat"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.portOfLoading || '')}
              error={errors.portOfLoading?.message}
            >
              <input {...register('portOfLoading')} className={inputClass} />
            </FieldWrapper>

            <FieldWrapper
              fieldName="portOfDischarge"
              label="Pelabuhan Bongkar"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.portOfDischarge || '')}
              error={errors.portOfDischarge?.message}
            >
              <input {...register('portOfDischarge')} className={inputClass} />
            </FieldWrapper>

            <FieldWrapper
              fieldName="presentationPeriodDays"
              label="Periode Penyerahan (hari)"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.presentationPeriodDays ?? '')}
              error={errors.presentationPeriodDays?.message}
            >
              <Controller
                name="presentationPeriodDays"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)
                    }
                    className={inputClass}
                  />
                )}
              />
            </FieldWrapper>

            <FieldWrapper
              fieldName="partialShipment"
              label="Pengiriman Parsial"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.partialShipment || '')}
              error={errors.partialShipment?.message}
            >
              <select {...register('partialShipment')} className={inputClass}>
                <option value="ALLOWED">Diizinkan</option>
                <option value="NOT_ALLOWED">Tidak Diizinkan</option>
                <option value="NOT_SPECIFIED">Tidak Ditentukan</option>
              </select>
            </FieldWrapper>

            <FieldWrapper
              fieldName="transshipment"
              label="Transshipment"
              confidence={confidence}
              confirmedFields={confirmedFields}
              onConfirm={handleConfirm}
              extractedValue={String(initialValues.transshipment || '')}
              error={errors.transshipment?.message}
            >
              <select {...register('transshipment')} className={inputClass}>
                <option value="ALLOWED">Diizinkan</option>
                <option value="NOT_ALLOWED">Tidak Diizinkan</option>
                <option value="NOT_SPECIFIED">Tidak Ditentukan</option>
              </select>
            </FieldWrapper>
          </div>
        </div>
      </section>

      {/* Section 5: Required Documents (dynamic table) */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          Dokumen yang Diperlukan
        </h3>
        <div className="space-y-3">
          {docFields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border rounded-md p-3 bg-gray-50"
            >
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Jenis Dokumen
                </label>
                <input
                  {...register(`requiredDocuments.${index}.documentType`)}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Asli</label>
                <Controller
                  name={`requiredDocuments.${index}.originals`}
                  control={control}
                  render={({ field: f }) => (
                    <input
                      type="number"
                      min={0}
                      value={f.value ?? 0}
                      onChange={(e) => f.onChange(parseInt(e.target.value, 10) || 0)}
                      className={inputClass}
                    />
                  )}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Salinan</label>
                <Controller
                  name={`requiredDocuments.${index}.copies`}
                  control={control}
                  render={({ field: f }) => (
                    <input
                      type="number"
                      min={0}
                      value={f.value ?? 0}
                      onChange={(e) => f.onChange(parseInt(e.target.value, 10) || 0)}
                      className={inputClass}
                    />
                  )}
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Persyaratan
                </label>
                <input
                  {...register(`requiredDocuments.${index}.requirements`)}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeDoc(index)}
                  className="rounded-md bg-red-50 p-2 text-red-600 hover:bg-red-100"
                  title="Hapus"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              appendDoc({ documentType: '', originals: 0, copies: 0, requirements: '' })
            }
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Tambah Dokumen
          </button>
        </div>
      </section>

      {/* Section 6: Additional Conditions */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          Syarat Tambahan
        </h3>
        <FieldWrapper
          fieldName="additionalConditions"
          label="Syarat Tambahan"
          confidence={confidence}
          confirmedFields={confirmedFields}
          onConfirm={handleConfirm}
          extractedValue={String(initialValues.additionalConditions ?? '')}
          error={errors.additionalConditions?.message}
        >
          <textarea {...register('additionalConditions')} rows={4} className={inputClass} />
        </FieldWrapper>
      </section>

      {/* API Error */}
      {apiError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      {/* Low confidence warning */}
      {!allLowConfirmed && lowConfidenceFields.length > 0 && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800">
            Terdapat {lowConfidenceFields.length - confirmedFields.size} kolom dengan tingkat
            kepercayaan rendah yang belum dikonfirmasi. Konfirmasi semua kolom tersebut untuk
            melanjutkan.
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting || !allLowConfirmed}
          className="rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Menyimpan...
            </span>
          ) : (
            'Konfirmasi & Lanjut ke Unggah Dokumen'
          )}
        </button>
      </div>
    </form>
  )
}
