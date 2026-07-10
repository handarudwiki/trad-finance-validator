import { redirect } from 'next/navigation'

export default function NewTransactionRedirectPage() {
  redirect('/old/transactions/new')
}