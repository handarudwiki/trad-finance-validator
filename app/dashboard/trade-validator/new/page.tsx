import { TopBar } from '@/components/layout/TopBar'
import { NewTransactionForm } from '@/components/NewTransactionForm'

export default function NewValidationPage() {
  return (
    <>
      <TopBar
        breadcrumbs={[
          { label: 'Trade Validator', href: '/dashboard/trade-validator' },
          { label: 'New Validation' },
        ]}
      />

      <div className="dashboard-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">New Validation</h1>
            <p className="page-subtitle">
              Select the instrument type to begin document validation.
            </p>
          </div>
        </div>

        {/* Centered create form */}
        <div style={{ maxWidth: '600px' }}>
          <NewTransactionForm />
        </div>
      </div>
    </>
  )
}
