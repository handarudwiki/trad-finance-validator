/**
 * POST /api/transactions/[id]/supporting-documents
 * Handles multipart upload of a supporting document.
 * Validates documentType enum value and MIME type, generates UUID path,
 * saves file, and creates a SupportingDocument record.
 * Satisfies: Requirements 5.1–5.5
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAllowedMimeType, generateStoragePath, saveFile } from '@/lib/storage'

const VALID_DOCUMENT_TYPES = [
  'BILL_OF_EXCHANGE',
  'COMMERCIAL_INVOICE',
  'PACKING_LIST',
  'BILL_OF_LADING',
  'AIRWAY_BILL',
  'SURAT_JALAN',
  'CERTIFICATE_OF_ORIGIN',
  'INSURANCE_CERTIFICATE',
  'INSPECTION_CERTIFICATE',
  'BENEFICIARY_CERTIFICATE',
  'CERTIFICATE_OF_ANALYSIS',
  'PHYTOSANITARY_CERTIFICATE',
  'INSURANCE_POLICY',
  'OTHER',
] as const

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verify transaction exists
  const transaction = await prisma.transaction.findUnique({ where: { id } })
  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  // Parse multipart form data
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const documentType = formData.get('documentType') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!documentType) {
    return NextResponse.json({ error: 'documentType field is required' }, { status: 400 })
  }

  // console.log(VALID_DOCUMENT_TYPES)

  // Validate documentType is a valid enum value
  if (!VALID_DOCUMENT_TYPES.includes(documentType as typeof VALID_DOCUMENT_TYPES[number])) {
    return NextResponse.json(
      { error: `Invalid documentType. Must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  // Validate MIME type
  if (!isAllowedMimeType(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Accepted: PDF, JPEG, PNG, TIFF' },
      { status: 415 }
    )
  }

  // Generate UUID storage path and save file
  const storagePath = generateStoragePath()
  const buffer = Buffer.from(await file.arrayBuffer())
  await saveFile(buffer, storagePath, file.type)

  // Create SupportingDocument record
  const supportingDoc = await prisma.supportingDocument.create({
    data: {
      transactionId: id,
      documentType: documentType as import('@prisma/client').DocumentType,
      filePath: storagePath,
      mimeType: file.type,
    },
  })

  return NextResponse.json(
    {
      supportingDocumentId: supportingDoc.id,
      documentType: supportingDoc.documentType,
      mimeType: supportingDoc.mimeType,
    },
    { status: 201 }
  )
}
