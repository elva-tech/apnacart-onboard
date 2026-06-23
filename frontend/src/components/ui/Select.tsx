import { forwardRef, type SelectHTMLAttributes } from 'react'

type SelectOption = string | { value: string; label: string }

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  required?: boolean
  options: readonly SelectOption[]
  placeholder?: string
}

function normalizeOption(option: SelectOption): { value: string; label: string } {
  return typeof option === 'string' ? { value: option, label: option } : option
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, required, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => {
            const { value, label } = normalizeOption(option)
            return (
              <option key={value} value={value}>
                {label}
              </option>
            )
          })}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
