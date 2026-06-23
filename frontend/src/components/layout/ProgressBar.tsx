import { WIZARD_STEPS, FORM_STEP_COUNT, LAST_FORM_STEP_ID } from '../../constants/steps'

interface ProgressBarProps {
  currentStep: number
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const formSteps = WIZARD_STEPS.filter((s) => s.id > 0 && s.id <= LAST_FORM_STEP_ID)
  const progress =
    currentStep === 0 ? 0 : Math.min((currentStep / FORM_STEP_COUNT) * 100, 100)

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-600 sm:text-sm">
        <span>
          Step {Math.max(currentStep, 0)} of {FORM_STEP_COUNT}
          {currentStep > 0 && currentStep <= LAST_FORM_STEP_ID && (
            <span className="hidden sm:inline"> — {WIZARD_STEPS[currentStep]?.title}</span>
          )}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-primary-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 hidden gap-1 lg:grid lg:grid-cols-11">
        {formSteps.map((step) => {
          const isComplete = currentStep > step.id
          const isCurrent = currentStep === step.id
          return (
            <div key={step.id} className="text-center">
              <div
                className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  isComplete
                    ? 'bg-primary-600 text-white'
                    : isCurrent
                      ? 'border-2 border-primary-600 bg-primary-50 text-primary-700'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isComplete ? '✓' : step.id}
              </div>
              <span
                className={`text-[10px] leading-tight ${
                  isCurrent ? 'font-medium text-primary-700' : 'text-slate-500'
                }`}
              >
                {step.shortTitle}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
