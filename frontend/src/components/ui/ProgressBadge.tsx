import { getProgressBadgeClasses, getProgressLabel } from '../../utils/progressColors'

interface ProgressBadgeProps {
  progress: number
  showLabel?: boolean
  className?: string
}

export function ProgressBadge({ progress, showLabel = false, className = '' }: ProgressBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${getProgressBadgeClasses(progress)} ${className}`}
      title={getProgressLabel(progress)}
    >
      {progress}%
      {showLabel && <span className="font-normal opacity-80">· {getProgressLabel(progress)}</span>}
    </span>
  )
}
