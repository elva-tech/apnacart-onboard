export function getProgressBadgeClasses(progress: number): string {
  if (progress >= 100) return 'bg-green-100 text-green-800 ring-green-200'
  if (progress >= 75) return 'bg-emerald-100 text-emerald-800 ring-emerald-200'
  if (progress >= 50) return 'bg-amber-100 text-amber-800 ring-amber-200'
  if (progress >= 25) return 'bg-orange-100 text-orange-800 ring-orange-200'
  if (progress > 0) return 'bg-red-100 text-red-800 ring-red-200'
  return 'bg-slate-100 text-slate-600 ring-slate-200'
}

export function getProgressBarClasses(progress: number): string {
  if (progress >= 100) return 'bg-green-500'
  if (progress >= 75) return 'bg-emerald-500'
  if (progress >= 50) return 'bg-amber-500'
  if (progress >= 25) return 'bg-orange-500'
  if (progress > 0) return 'bg-red-500'
  return 'bg-slate-300'
}

export function getProgressLabel(progress: number): string {
  if (progress >= 100) return 'Complete'
  if (progress >= 75) return 'Almost done'
  if (progress >= 50) return 'In progress'
  if (progress >= 25) return 'Started'
  if (progress > 0) return 'Just started'
  return 'Not started'
}
