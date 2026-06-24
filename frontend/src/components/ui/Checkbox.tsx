import { forwardRef, type InputHTMLAttributes } from 'react'
import { useWorkflowFormLocked } from '../../context/WorkflowFormEditContext'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  description?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = '', id, disabled, ...props }, ref) => {
    const locked = useWorkflowFormLocked()
    const checkboxId = id || label.toLowerCase().replace(/\s+/g, '-')
    const isDisabled = disabled || locked

    return (
      <label
        htmlFor={checkboxId}
        className={`flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors ${
          isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:bg-slate-50'
        } ${className}`}
      >
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
          disabled={isDisabled}
          {...props}
        />
        <span>
          <span className="block text-sm font-medium text-slate-800">{label}</span>
          {description && <span className="mt-0.5 block text-sm text-slate-500">{description}</span>}
        </span>
      </label>
    )
  },
)

Checkbox.displayName = 'Checkbox'
