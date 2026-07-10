import { redirect } from 'next/navigation'

interface Props { params: Promise<{ id: string }> }

export default async function OldDocumentsRedirect({ params }: Props) {
  const { id } = await params
  redirect(`/dashboard/trade-validator/${id}/documents`)
}