'use client'

import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { ExtractedLCFieldsSchema, type ExtractedLCFields } from '@/schema/extraction'

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
  children: React.ReactNode
  error?: string
}

function FieldWrapper({
  fieldName,
  label,
  confidence,
  children,
  error,
}: FieldWrapperProps) {
  const lowConf = isLowConfidence(confidence, fieldName)
  const score = getFieldConfidence(confidence, fieldName)

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {lowConf && score !== undefined && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            ⚠️ {(score * 100).toFixed(0)}% — perlu diisi manual
          </span>
        )}
      </div>
      <div className={lowConf ? 'rounded-md border-2 border-amber-400 bg-amber-50/30 p-1' : ''}>
        {children}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

// Human-readable labels for field names
const FIELD_LABELS: Record<string, string> = {
  lcNumber: 'Nomor LC/SKBDN',
  issueDate: 'Tanggal Terbit',
  expiryDate: 'Tanggal Berakhir',
  expiryPlace: 'Tempat Berakhir',
  'issuingBank.name': 'Bank Penerbit - Nama',
  'issuingBank.address': 'Bank Penerbit - Alamat',
  'issuingBank.swiftCode': 'Bank Penerbit - SWIFT',
  'advisingBank.name': 'Bank Penerus - Nama',
  'advisingBank.address': 'Bank Penerus - Alamat',
  'advisingBank.swiftCode': 'Bank Penerus - SWIFT',
  'applicant.name': 'Pemohon - Nama',
  'applicant.address': 'Pemohon - Alamat',
  'beneficiary.name': 'Penerima - Nama',
  'beneficiary.address': 'Penerima - Alamat',
  currency: 'Mata Uang',
  amount: 'Jumlah',
  tolerancePct: 'Toleransi (%)',
  paymentTenor: 'Tenor Pembayaran',
  availableWith: 'Tersedia Pada',
  availableBy: 'Tersedia Dengan',
  goodsDescription: 'Deskripsi Barang',
  quantity: 'Kuantitas',
  incoterms: 'Incoterms',
  portOfLoading: 'Pelabuhan Muat',
  portOfDischarge: 'Pelabuhan Bongkar',
  latestShipmentDate: 'Tgl Pengiriman Terakhir',
  partialShipment: 'Pengiriman Parsial',
  transshipment: 'Transshipment',
  presentationPeriodDays: 'Periode Penyerahan',
  additionalConditions: 'Syarat Tambahan',
  requiredDocuments: 'Dokumen Diperlukan',
}

export function ExtractionReviewForm({
  initialValues,
  confidence,
  transactionId,
}: ExtractionReviewFormProps) {
  const router = useRouter()
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

      router.push(`/dashboard/trade-validator/${transactionId}/documents`)
    } catch {
      setApiError('Gagal terhubung ke server. Periksa koneksi internet Anda.')
    }
  }

  const inputClass =
    'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Low Confidence Fields Summary */}
      {lowConfidenceFields.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-amber-800">
                {lowConfidenceFields.length} kolom dengan kepercayaan rendah
              </h3>
              <p className="text-xs text-amber-700">
                Field berikut memiliki confidence score di bawah {(LOW_CONFIDENCE_THRESHOLD * 100).toFixed(0)}%.
                Silakan periksa dan isi manual jika diperlukan.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {lowConfidenceFields.map((field) => {
                  const score = confidence[field]
                  return (
                    <span
                      key={field}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-800"
                    >
                      {FIELD_LABELS[field] || field}
                      <span className="text-[10px] opacity-70">({(score * 100).toFixed(0)}%)</span>
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

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
            error={errors.lcNumber?.message}
          >
            <input {...register('lcNumber')} className={inputClass} />
          </FieldWrapper>

          <FieldWrapper
            fieldName="issueDate"
            label="Tanggal Terbit"
            confidence={confidence}
            error={errors.issueDate?.message}
          >
            <input {...register('issueDate')} type="date" className={inputClass} />
          </FieldWrapper>

          <FieldWrapper
            fieldName="expiryDate"
            label="Tanggal Berakhir"
            confidence={confidence}
            error={errors.expiryDate?.message}
          >
            <input {...register('expiryDate')} type="date" className={inputClass} />
          </FieldWrapper>

          <FieldWrapper
            fieldName="expiryPlace"
            label="Tempat Berakhir"
            confidence={confidence}
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
              error={errors.issuingBank?.name?.message}
            >
              <input {...register('issuingBank.name')} className={inputClass} />
            </FieldWrapper>
            <FieldWrapper
              fieldName="issuingBank.address"
              label="Alamat"
              confidence={confidence}
              error={errors.issuingBank?.address?.message}
            >
              <input {...register('issuingBank.address')} className={inputClass} />
            </FieldWrapper>
            <FieldWrapper
              fieldName="issuingBank.swiftCode"
              label="Kode SWIFT"
              confidence={confidence}
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
              error={errors.advisingBank?.name?.message}
            >
              <input {...register('advisingBank.name')} className={inputClass} />
            </FieldWrapper>
            <FieldWrapper
              fieldName="advisingBank.address"
              label="Alamat"
              confidence={confidence}
              error={errors.advisingBank?.address?.message}
            >
              <input {...register('advisingBank.address')} className={inputClass} />
            </FieldWrapper>
            <FieldWrapper
              fieldName="advisingBank.swiftCode"
              label="Kode SWIFT"
              confidence={confidence}
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
              error={errors.applicant?.name?.message}
            >
              <input {...register('applicant.name')} className={inputClass} />
            </FieldWrapper>
            <FieldWrapper
              fieldName="applicant.address"
              label="Alamat"
              confidence={confidence}
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
              error={errors.beneficiary?.name?.message}
            >
              <input {...register('beneficiary.name')} className={inputClass} />
            </FieldWrapper>
            <FieldWrapper
              fieldName="beneficiary.address"
              label="Alamat"
              confidence={confidence}
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
            error={errors.currency?.message}
          >
            <input {...register('currency')} className={inputClass} maxLength={3} />
          </FieldWrapper>

          <FieldWrapper
            fieldName="amount"
            label="Jumlah"
            confidence={confidence}
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
            error={errors.paymentTenor?.message}
          >
            <input {...register('paymentTenor')} className={inputClass} />
          </FieldWrapper>

          <FieldWrapper
            fieldName="availableWith"
            label="Tersedia Pada"
            confidence={confidence}
            error={errors.availableWith?.message}
          >
            <input {...register('availableWith')} className={inputClass} />
          </FieldWrapper>

          <FieldWrapper
            fieldName="availableBy"
            label="Tersedia Dengan"
            confidence={confidence}
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
            error={errors.goodsDescription?.message}
          >
            <textarea {...register('goodsDescription')} rows={3} className={inputClass} />
          </FieldWrapper>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldWrapper
              fieldName="quantity"
              label="Kuantitas"
              confidence={confidence}
              error={errors.quantity?.message}
            >
              <input {...register('quantity')} className={inputClass} />
            </FieldWrapper>

            <FieldWrapper
              fieldName="incoterms"
              label="Incoterms"
              confidence={confidence}
              error={errors.incoterms?.message}
            >
              <input {...register('incoterms')} className={inputClass} />
            </FieldWrapper>

            <FieldWrapper
              fieldName="latestShipmentDate"
              label="Tanggal Pengiriman Terakhir"
              confidence={confidence}
              error={errors.latestShipmentDate?.message}
            >
              <input {...register('latestShipmentDate')} type="date" className={inputClass} />
            </FieldWrapper>

            <FieldWrapper
              fieldName="portOfLoading"
              label="Pelabuhan Muat"
              confidence={confidence}
              error={errors.portOfLoading?.message}
            >
              <input {...register('portOfLoading')} className={inputClass} />
            </FieldWrapper>

            <FieldWrapper
              fieldName="portOfDischarge"
              label="Pelabuhan Bongkar"
              confidence={confidence}
              error={errors.portOfDischarge?.message}
            >
              <input {...register('portOfDischarge')} className={inputClass} />
            </FieldWrapper>

            <FieldWrapper
              fieldName="presentationPeriodDays"
              label="Periode Penyerahan (hari)"
              confidence={confidence}
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
              appendDoc({ documentType: 'OTHER', originals: 0, copies: 0, requirements: '' })
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

      {/* Low confidence info */}
      {lowConfidenceFields.length > 0 && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800">
            Terdapat {lowConfidenceFields.length} kolom dengan tingkat kepercayaan rendah.
            Pastikan kolom tersebut sudah terisi dengan benar sebelum melanjutkan.
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
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
