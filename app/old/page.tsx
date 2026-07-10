import { redirect } from 'next/navigation'

export default function OldRedirectPage() {
  redirect('/old/transactions')
}