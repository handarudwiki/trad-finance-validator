import { redirect } from 'next/navigation'

interface LegacyTransactionPathRedirectProps {
  params: Promise<{ id: string; slug: string[] }>
}

export default async function LegacyTransactionPathRedirect({ params }: LegacyTransactionPathRedirectProps) {
  const { id, slug } = await params
  redirect(`/old/transactions/${id}/${slug.join('/')}`)
}