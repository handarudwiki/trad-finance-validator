/**
 * POST /api/transactions/[id]/source-document
 * Handles multipart upload of the LC/SKBDN source document.
 * Validates MIME type, generates UUID storage path, saves file,
 * and creates a SourceDocument record.
 * Satisfies: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAllowedMimeType, generateStoragePath, saveFile } from '@/lib/storage'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const transaction = await prisma.transaction.findUnique({ where: { id } })
  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!isAllowedMimeType(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Accepted: PDF, JPEG, PNG, TIFF' },
      { status: 415 }
    )
  }

  const storagePath = generateStoragePath()
  const buffer = Buffer.from(await file.arrayBuffer())
  await saveFile(buffer, storagePath)

  const existingSourceDoc = await prisma.sourceDocument.findUnique({
    where: { transactionId: id },
  })

  let sourceDoc
  if (existingSourceDoc) {
    try {
      const { unlink } = await import('fs/promises')
      await unlink(existingSourceDoc.filePath)
    } catch (e) {
      console.warn(`Failed to delete old file: ${existingSourceDoc.filePath}`, e)
    }

    sourceDoc = await prisma.sourceDocument.update({
      where: { transactionId: id },
      data: {
        filePath: storagePath,
        mimeType: file.type,
        fileName: file.name,
        extractedFields: undefined,
        reviewedFields: undefined,
        confidence: undefined,
        extractedAt: null,
        reviewedAt: null,
        previousVersions: [],
      },
    })

    await prisma.transaction.update({
      where: { id },
      data: {
        status: 'DRAFT',
        errorDetails: null,
      },
    })
  } else {
    sourceDoc = await prisma.sourceDocument.create({
      data: {
        transactionId: id,
        filePath: storagePath,
        mimeType: file.type,
        fileName: file.name,
      },
    })
  }

  return NextResponse.json(
    {
      sourceDocumentId: sourceDoc.id,
      filePath: sourceDoc.filePath,
      mimeType: sourceDoc.mimeType,
    },
    { status: 201 }
  )
}
