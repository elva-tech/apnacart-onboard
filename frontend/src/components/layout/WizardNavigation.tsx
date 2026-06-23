import { Button } from '../ui/Button'

interface WizardNavigationProps {
  onPrevious?: () => void
  onNext?: () => void
  nextLabel?: string
  previousLabel?: string
  nextLoading?: boolean
  nextDisabled?: boolean
  showPrevious?: boolean
  nextType?: 'button' | 'submit'
}

export function WizardNavigation({
  onPrevious,
  onNext,
  nextLabel = 'Next',
  previousLabel = 'Previous',
  nextLoading = false,
  nextDisabled = false,
  showPrevious = true,
  nextType = 'button',
}: WizardNavigationProps) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between">
      {showPrevious ? (
        <Button variant="outline" onClick={onPrevious} className="w-full sm:w-auto">
          {previousLabel}
        </Button>
      ) : (
        <div />
      )}
      <Button
        type={nextType}
        onClick={nextType === 'button' ? onNext : undefined}
        loading={nextLoading}
        disabled={nextDisabled}
        className="w-full sm:w-auto"
      >
        {nextLabel}
      </Button>
    </div>
  )
}
