import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getHubPathForWorkflowStep, getWorkflowStepIdForPath } from '../constants/workflow'

export function useWorkflowFormActions(workflowStep?: number) {
  const navigate = useNavigate()
  const location = useLocation()
  const stepId = workflowStep ?? getWorkflowStepIdForPath(location.pathname)
  const hubPath = getHubPathForWorkflowStep(stepId)

  const returnToDashboard = useCallback(() => {
    navigate('/dashboard')
  }, [navigate])

  const returnToHub = useCallback(() => {
    navigate(hubPath)
  }, [navigate, hubPath])

  return { stepId, hubPath, returnToDashboard, returnToHub }
}
