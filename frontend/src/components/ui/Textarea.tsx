import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { useWorkflowFormLocked } from '../../context/WorkflowFormEditContext'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  required?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, required, className = '', id, disabled, ...props }, ref) => {
    const locked = useWorkflowFormLocked()
    const textareaId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-slate-100 ${
            error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'
          } ${className}`}
          disabled={disabled || locked}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
