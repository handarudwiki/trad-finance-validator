import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAllowedMimeType, generateStoragePath, saveFile } from '@/lib/storage'

/**
 * POST /api/transactions/:id/amendment
 * Upload an LC amendment file. Archives existing reviewedFields to previousVersions,
 * resets extraction state, replaces the file, and sets transaction status back to DRAFT.
 * Existing DiscrepancyReport records are retained for audit purposes.
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { sourceDocument: true },
  })

  if (!transaction || !transaction.sourceDocument) {
    return NextResponse.json(
      { error: 'Transaksi atau dokumen sumber tidak ditemukan' },
      { status: 404 }
    )
  }

  const sourceDoc = transaction.sourceDocument

  // Amendment requires that reviewedFields already exist (the LC has been reviewed at least once)
  if (!sourceDoc.reviewedFields) {
    return NextResponse.json(
      { error: 'Dokumen sumber belum ditinjau. Amendemen hanya dapat diunggah setelah peninjauan selesai.' },
      { status: 400 }
    )
  }

  // Parse multipart form data
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json(
      { error: 'Tidak ada file yang diberikan' },
      { status: 400 }
    )
  }

  if (!isAllowedMimeType(file.type)) {
    return NextResponse.json(
      { error: 'Tipe file tidak didukung. Gunakan PDF, JPEG, PNG, atau TIFF.' },
      { status: 415 }
    )
  }

  // Save the new amendment file
  const storagePath = generateStoragePath()
  const buffer = Buffer.from(await file.arrayBuffer())
  await saveFile(buffer, storagePath)

  // Archive current reviewedFields into previousVersions
  const previousVersions = [
    ...(sourceDoc.previousVersions as unknown[]),
    sourceDoc.reviewedFields,
  ]

  // Update source document: archive reviewedFields, reset extraction state, replace file
  await prisma.sourceDocument.update({
    where: { id: sourceDoc.id },
    data: {
      previousVersions: previousVersions as any,
      extractedFields: Prisma.DbNull,
      reviewedFields: Prisma.DbNull,
      confidence: Prisma.DbNull,
      extractedAt: null,
      reviewedAt: null,
      filePath: storagePath,
      mimeType: file.type,
      fileName: file.name,
    },
  })

  // Reset transaction status to DRAFT so user follows extraction → review → validate flow again
  await prisma.transaction.update({
    where: { id },
    data: { status: 'DRAFT' },
  })

  return NextResponse.json(
    { message: 'Amendemen berhasil diunggah' },
    { status: 201 }
  )
}
