import { Button } from '../ui/Button'
import { useAuth } from '../../context/AuthContext'

interface WorkflowFormNavigationProps {
  onCancel: () => void
  cancelLabel?: string
  saveLabel?: string
  saveLoading?: boolean
  saveDisabled?: boolean
  saveType?: 'button' | 'submit'
  saveError?: string | null
}

export function WorkflowFormNavigation({
  onCancel,
  cancelLabel = 'Back to section',
  saveLabel = 'Save & Proceed',
  saveLoading = false,
  saveDisabled = false,
  saveType = 'submit',
  saveError,
}: WorkflowFormNavigationProps) {
  const { canEdit } = useAuth()

  return (
    <div className="space-y-3 border-t border-slate-200 pt-6">
      {saveError && <p className="text-sm text-red-600">{saveError}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saveLoading}
          className="w-full sm:w-auto"
        >
          {cancelLabel}
        </Button>
        <Button
          type={saveType}
          loading={saveLoading}
          disabled={saveDisabled || saveLoading || !canEdit}
          className="w-full sm:w-auto"
        >
          {saveLoading ? 'Saving…' : canEdit ? saveLabel : 'View only'}
        </Button>
      </div>
    </div>
  )
}
