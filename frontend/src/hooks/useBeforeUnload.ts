import { useEffect } from 'react'

export function useBeforeUnload(enabled: boolean, message = 'You have unsaved onboarding progress. Are you sure you want to leave?') {
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = message
      return message
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled, message])
}
