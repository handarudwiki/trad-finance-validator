import { redirect } from 'next/navigation'

interface Props { params: Promise<{ id: string }> }

export default async function OldUploadRedirect({ params }: Props) {
  const { id } = await params
  redirect(`/dashboard/trade-validator/${id}/upload`)
}
