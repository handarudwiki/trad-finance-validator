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

      <div className="dashboard-content flex flex-col items-center justify-center py-12">
        <div className="page-header text-center mb-8" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>New Validation</h1>
            <p className="page-subtitle" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Select the instrument type to begin document validation.
            </p>
          </div>
        </div>

        {/* Centered create form */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <NewTransactionForm />
        </div>
      </div>
    </>
  )
}
