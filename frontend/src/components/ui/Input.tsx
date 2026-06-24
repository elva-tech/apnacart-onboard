import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { useWorkflowFormLocked } from '../../context/WorkflowFormEditContext'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  required?: boolean
  suffix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, suffix, className = '', id, disabled, ...props }, ref) => {
    const locked = useWorkflowFormLocked()
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-slate-100 ${
              error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'
            } ${suffix ? 'pr-10' : ''} ${className}`}
            disabled={disabled || locked}
            {...props}
          />
          {suffix && <div className="absolute inset-y-0 right-0 flex items-center pr-3">{suffix}</div>}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {!error && hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
