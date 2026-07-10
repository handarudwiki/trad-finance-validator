import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ExtractionReviewForm } from '@/components/ExtractionReviewForm'

interface ReviewPageProps {
  params: Promise<{ id: string }>
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { sourceDocument: true },
  })

  if (!transaction) {
    redirect('/transactions/new')
  }

  // Redirect to appropriate step if not in EXTRACTION_REVIEW status
  if (transaction.status !== 'EXTRACTION_REVIEW') {
    switch (transaction.status) {
      case 'DRAFT':
        redirect(`/transactions/${id}/upload`)
      case 'VALIDATING':
        redirect(`/transactions/${id}/validate`)
      case 'COMPLETED':
        redirect(`/transactions/${id}/report`)
      case 'FAILED':
        redirect(`/transactions/${id}/report`)
      default:
        redirect(`/transactions/${id}/upload`)
    }
  }

  const sourceDoc = transaction.sourceDocument
  if (!sourceDoc || !sourceDoc.extractedFields) {
    redirect(`/transactions/${id}/upload`)
  }

  const extractedFields = sourceDoc.extractedFields as Record<string, unknown>
  const confidence = (sourceDoc.confidence as Record<string, number>) ?? {}

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tinjau Hasil Ekstraksi</h1>
          <p className="mt-1 text-gray-600">
            Periksa dan koreksi data yang diekstrak dari dokumen sumber. Kolom dengan tingkat
            kepercayaan rendah ditandai dengan warna kuning dan harus dikonfirmasi sebelum
            melanjutkan.
          </p>
        </div>

        <ExtractionReviewForm
          initialValues={extractedFields as never}
          confidence={confidence}
          transactionId={id}
        />
      </div>
    </div>
  )
}
