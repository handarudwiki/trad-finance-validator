/**
 * Finding Zod schema for parsing Gemini interpretive validation responses.
 * Satisfies: Requirements 8.4, 8.10
 *
 * Severity levels:
 *
 * FATAL - Discrepancy yang pasti menyebabkan dokumen ditolak (refuse).
 *   Tidak ada toleransi, harus diperbaiki sebelum dokumen bisa diterima.
 *   Contoh:
 *   - Jumlah invoice melebihi jumlah LC (overclaim)
 *   - Mata uang invoice berbeda dengan LC (USD vs EUR)
 *   - Tanggal pengiriman melewati latest shipment date
 *   - Nama beneficiary completely different dari LC
 *   - Asuransi kurang dari 110% CIF value
 *
 * MAJOR - Discrepancy signifikan yang kemungkinan besar menyebabkan penolakan,
 *   tapi masih ada kemungkinan kecil bisa diterima tergantung konteks.
 *   Contoh:
 *   - Deskripsi barang di invoice berbeda substansial dari LC
 *   - Kuantitas di invoice tidak cocok dengan packing list
 *   - Port of loading di B/L berbeda dari LC
 *   - Marks & numbers tidak konsisten antar dokumen
 *   - Required wording tidak lengkap di sertifikat
 *
 * MINOR - Discrepancy kecil yang mungkin masih bisa diterima.
 *   Biasanya perbedaan format, singkatan, atau detail non-material.
 *   Contoh:
 *   - Singkatan nama ("PT" vs "Perseroan Terbatas")
 *   - Format tanggal berbeda tapi tanggalnya sama
 *   - Perbedaan kecil di alamat (typo, format)
 *   - Vessel name menggunakan singkatan yang umum
 *   - Perbedaan huruf besar/kecil yang tidak material
 */

import { z } from 'zod'

export const FindingSchema = z.object({
  checkType: z.enum(['DETERMINISTIC', 'INTERPRETIVE', 'CROSS_DOCUMENT']),
  severity: z.enum(['FATAL', 'MAJOR', 'MINOR']),
  field: z.string().min(1),
  expected: z.string().optional().nullable(),
  found: z.string().optional().nullable(),
  description: z.string().min(1),
  suggestedCorrection: z.string().optional().nullable(),
  regulatoryRef: z.string().min(1),
  ragChunkIds: z.array(z.string()).default([]),
})

export type Finding = z.infer<typeof FindingSchema>

export const FindingArraySchema = z.array(FindingSchema)
