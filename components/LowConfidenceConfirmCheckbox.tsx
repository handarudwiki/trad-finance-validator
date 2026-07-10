'use client'

import { useState } from 'react'

interface LowConfidenceConfirmCheckboxProps {
  fieldName: string
  extractedValue: string
  confidence: number
  onConfirm: (fieldName: string) => void
}

export function LowConfidenceConfirmCheckbox({
  fieldName,
  extractedValue,
  confidence,
  onConfirm,
}: LowConfidenceConfirmCheckboxProps) {
  const [checked, setChecked] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const handleChange = () => {
    if (!checked) {
      setChecked(true)
      onConfirm(fieldName)
    }
  }

  const confidencePercent = Math.round(confidence * 100)

  return (
    <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3">
      <input
        type="checkbox"
        id={`confirm-${fieldName}`}
        checked={checked}
        onChange={handleChange}
        className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <label
            htmlFor={`confirm-${fieldName}`}
            className="text-sm font-medium text-gray-800 cursor-pointer"
          >
            {fieldName}
          </label>
          <div className="relative">
            <span
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="inline-flex items-center rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800 cursor-help"
            >
              {confidencePercent}%
            </span>
            {showTooltip && (
              <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
                Tingkat kepercayaan rendah — mohon periksa kembali nilai ini sebelum melanjutkan
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-600 truncate">
          Nilai: <span className="font-mono">{extractedValue}</span>
        </p>
        {!checked && (
          <p className="mt-1 text-xs text-amber-700">
            Konfirmasi nilai ini untuk melanjutkan
          </p>
        )}
      </div>
    </div>
  )
}
