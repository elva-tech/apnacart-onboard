import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_BYTES } from '../constants/phase2'
import { legalDocumentsSchema, type LegalDocumentsForm } from '../schemas/onboarding'
import { useOnboarding } from '../context/OnboardingContext'
import { useWorkflowFormSubmit } from '../hooks/useWorkflowFormSubmit'
import { FileUpload } from '../components/FileUpload'
import { Card } from '../components/ui/Card'
import { WorkflowFormLayout } from '../components/workflow/WorkflowFormLayout'
import { WorkflowFormNavigation } from '../components/workflow/WorkflowFormNavigation'

const documentAcceptHint = 'PDF, PNG, JPG, JPEG — max 10 MB'

export function LegalDocumentsPage() {
  const { state } = useOnboarding()
  const { saving, saveError, submitAndReturn, returnToHub } = useWorkflowFormSubmit(2)

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LegalDocumentsForm>({
    resolver: zodResolver(legalDocumentsSchema),
    defaultValues: {
      gstCertificate: state.formData.gstCertificate,
      panCard: state.formData.panCard,
      fssaiLicense: state.formData.fssaiLicense,
      businessRegistration: state.formData.businessRegistration,
    },
  })

  const onSubmit = (data: LegalDocumentsForm) => submitAndReturn(data)

  return (
    <WorkflowFormLayout
      workflowStepId={2}
      title="Legal Documents"
      subtitle="Upload required business and compliance documents."
    >
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Controller
            name="gstCertificate"
            control={control}
            render={({ field }) => (
              <FileUpload
                label="GST Certificate"
                required
                value={field.value}
                onChange={field.onChange}
                error={errors.gstCertificate?.message as string | undefined}
                allowedTypes={ALLOWED_DOCUMENT_TYPES}
                maxSizeBytes={MAX_DOCUMENT_SIZE_BYTES}
                acceptHint={documentAcceptHint}
                imagePreview
              />
            )}
          />
          <Controller
            name="panCard"
            control={control}
            render={({ field }) => (
              <FileUpload
                label="PAN Card"
                required
                value={field.value}
                onChange={field.onChange}
                error={errors.panCard?.message as string | undefined}
                allowedTypes={ALLOWED_DOCUMENT_TYPES}
                maxSizeBytes={MAX_DOCUMENT_SIZE_BYTES}
                acceptHint={documentAcceptHint}
                imagePreview
              />
            )}
          />
          <Controller
            name="fssaiLicense"
            control={control}
            render={({ field }) => (
              <FileUpload
                label="FSSAI License"
                value={field.value}
                onChange={field.onChange}
                error={errors.fssaiLicense?.message as string | undefined}
                allowedTypes={ALLOWED_DOCUMENT_TYPES}
                maxSizeBytes={MAX_DOCUMENT_SIZE_BYTES}
                acceptHint={documentAcceptHint}
                imagePreview
              />
            )}
          />
          <Controller
            name="businessRegistration"
            control={control}
            render={({ field }) => (
              <FileUpload
                label="Business Registration Certificate"
                value={field.value}
                onChange={field.onChange}
                error={errors.businessRegistration?.message as string | undefined}
                allowedTypes={ALLOWED_DOCUMENT_TYPES}
                maxSizeBytes={MAX_DOCUMENT_SIZE_BYTES}
                acceptHint={documentAcceptHint}
                imagePreview
              />
            )}
          />

          <WorkflowFormNavigation
            onCancel={returnToHub}
            cancelLabel="Back to Business & Compliance"
            saveLoading={saving}
            saveError={saveError}
          />
        </form>
      </Card>
    </WorkflowFormLayout>
  )
}
