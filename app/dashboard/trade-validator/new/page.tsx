import { TopBar } from '@/components/layout/TopBar'
import { NewTransactionForm } from '@/components/NewTransactionForm'

const STEPS = [
  { label: 'Create' },
  { label: 'Upload' },
  { label: 'Review' },
  { label: 'Validate' },
  { label: 'Report' },
]

function StepBar({ current }: { current: number }) {
  return (
    <div className="steps">
      {STEPS.map((step, i) => {
        const isDone = i < current
        const isActive = i === current
        return (
          <div key={step.label} className="step">
            <div className={`step-dot${isActive ? ' active' : isDone ? ' done' : ''}`}>
              {isDone ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`step-text${isActive ? ' active' : isDone ? ' done' : ''}`}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: '1px', background: isDone ? '#16A34A' : 'var(--border)', margin: '0 8px', transition: 'background 200ms' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

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
        <div className="page-header" style={{ marginBottom: '16px' }}>
          <div>
            <h1 className="page-title">New Validation</h1>
            <p className="page-subtitle">
              Select the instrument type to begin document validation.
            </p>
          </div>
        </div>

        <StepBar current={0} />

        {/* Form container aligned left */}
        <div style={{ maxWidth: '680px', marginTop: '24px' }}>
          <NewTransactionForm />
        </div>
      </div>
    </>
  )
}
