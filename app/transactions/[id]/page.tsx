import { redirect } from 'next/navigation'

interface TransactionRedirectPageProps {
  params: Promise<{ id: string }>
}

export default async function TransactionRedirectPage({ params }: TransactionRedirectPageProps) {
  const { id } = await params
  redirect(`/old/transactions/${id}/upload`)
}