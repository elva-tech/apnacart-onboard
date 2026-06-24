import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_BYTES } from '../constants/phase2'
import { createLegalDocumentsSchema, type LegalDocumentsForm } from '../schemas/onboarding'
import { useOnboarding } from '../context/OnboardingContext'
import { useWorkflowFormSubmit } from '../hooks/useWorkflowFormSubmit'
import { pickDirtyFileFields } from '../utils/onboarding'
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
    formState: { errors, dirtyFields },
  } = useForm<LegalDocumentsForm>({
    resolver: zodResolver(
      createLegalDocumentsSchema({
        panCardUrl: state.formData.panCardUrl,
      }),
    ),
    defaultValues: {
      gstCertificate: state.formData.gstCertificate,
      panCard: state.formData.panCard,
      fssaiLicense: state.formData.fssaiLicense,
      businessRegistration: state.formData.businessRegistration,
    },
  })

  const onSubmit = (data: LegalDocumentsForm) => {
    submitAndReturn(
      pickDirtyFileFields({
        ...(dirtyFields.gstCertificate ? { gstCertificate: data.gstCertificate } : {}),
        ...(dirtyFields.panCard ? { panCard: data.panCard } : {}),
        ...(dirtyFields.fssaiLicense ? { fssaiLicense: data.fssaiLicense } : {}),
        ...(dirtyFields.businessRegistration ? { businessRegistration: data.businessRegistration } : {}),
      }),
    )
  }

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
                value={field.value}
                onChange={field.onChange}
                existingUrl={state.formData.gstCertificateUrl}
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
                existingUrl={state.formData.panCardUrl}
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
                existingUrl={state.formData.fssaiLicenseUrl}
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
                existingUrl={state.formData.businessRegistrationUrl}
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
