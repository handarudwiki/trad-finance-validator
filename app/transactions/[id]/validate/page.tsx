'use client'

import { useParams } from 'next/navigation'
import { ValidationProgress } from '@/components/ValidationProgress'

export default function ValidatePage() {
  const params = useParams<{ id: string }>()
  const transactionId = params.id

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <ValidationProgress transactionId={transactionId} />
      </div>
    </div>
  )
}
