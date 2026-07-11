import React from 'react'

interface FormSectionProps {
  title: string
  children: React.ReactNode
  badge?: React.ReactNode
  style?: React.CSSProperties
  bodyStyle?: React.CSSProperties
  headerStyle?: React.CSSProperties
}

export function FormSection({ title, children, badge, style, bodyStyle, headerStyle }: FormSectionProps) {
  return (
    <div 
      className="card" 
      style={{ 
        border: '1px solid var(--border)', 
        borderRadius: '8px', 
        boxShadow: 'none',
        background: 'var(--surface)',
        marginBottom: '20px',
        ...style 
      }}
    >
      <div 
        className="card-header flex items-center justify-between" 
        style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid var(--border)', 
          background: '#FAFAFA',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          ...headerStyle 
        }}
      >
        <span 
          className="card-title font-bold text-zinc-800" 
          style={{ 
            fontSize: '14px', 
            textTransform: 'none', 
            letterSpacing: 'normal' 
          }}
        >
          {title}
        </span>
        {badge && <div>{badge}</div>}
      </div>
      <div className="card-body" style={{ padding: '20px', ...bodyStyle }}>
        {children}
      </div>
    </div>
  )
}
