import { forwardRef, type InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  description?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = '', id, ...props }, ref) => {
    const checkboxId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <label
        htmlFor={checkboxId}
        className={`flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50 ${className}`}
      >
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
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
