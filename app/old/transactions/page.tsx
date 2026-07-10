import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TransactionStatus } from '@prisma/client'

const STATUS_LABELS: Record<TransactionStatus, string> = {
  DRAFT: 'Draf',
  EXTRACTION_REVIEW: 'Meninjau Ekstraksi',
  VALIDATING: 'Sedang Divalidasi',
  COMPLETED: 'Selesai',
  FAILED: 'Gagal',
}

const STATUS_COLORS: Record<TransactionStatus, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  EXTRACTION_REVIEW: 'bg-blue-100 text-blue-800',
  VALIDATING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
}

function getTransactionLink(id: string, status: TransactionStatus): string {
  switch (status) {
    case 'DRAFT':
      return `/old/transactions/${id}/upload`
    case 'EXTRACTION_REVIEW':
      return `/old/transactions/${id}/review`
    case 'VALIDATING':
      return `/old/transactions/${id}/validate`
    case 'COMPLETED':
    case 'FAILED':
      return `/old/transactions/${id}/report`
    default:
      return `/old/transactions/${id}`
  }
}

export default async function TransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      type: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Riwayat Transaksi</h1>
          <Link
            href="/old/transactions/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Buat Transaksi Baru
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">Belum ada transaksi.</p>
            <Link
              href="/old/transactions/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Buat Transaksi Pertama
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Dibuat
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={getTransactionLink(tx.id, tx.status)}
                        className="text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {tx.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {tx.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[tx.status]}`}
                      >
                        {STATUS_LABELS[tx.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
