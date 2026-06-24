import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { storeLocationSchema, type StoreLocationForm } from '../schemas/onboarding'
import { INDIAN_STATES } from '../constants/indianStates'
import { useOnboarding } from '../context/OnboardingContext'
import { useWorkflowFormLocked } from '../context/WorkflowFormEditContext'
import { useWorkflowFormSubmit } from '../hooks/useWorkflowFormSubmit'
import { MapPicker } from '../components/MapPicker'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { WorkflowFormLayout } from '../components/workflow/WorkflowFormLayout'
import { WorkflowFormNavigation } from '../components/workflow/WorkflowFormNavigation'
import { lookupPincodeArea } from '../utils/geocode'

export function StoreLocationPage() {
  const { state } = useOnboarding()
  const locked = useWorkflowFormLocked()
  const { saving, saveError, submitAndReturn, returnToHub } = useWorkflowFormSubmit(1)
  const [mapViewCenter, setMapViewCenter] = useState<[number, number] | null>(null)
  const [mapViewVersion, setMapViewVersion] = useState(0)
  const [pincodeLookupLoading, setPincodeLookupLoading] = useState(false)
  const [pincodeHint, setPincodeHint] = useState<string | null>(null)
  const [pincodeError, setPincodeError] = useState<string | null>(null)

  const {
    register,
    resetField,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StoreLocationForm>({
    resolver: zodResolver(storeLocationSchema),
    defaultValues: {
      storeAddress: state.formData.storeAddress,
      landmark: state.formData.landmark,
      city: state.formData.city,
      state: state.formData.state,
      pincode: state.formData.pincode,
      latitude: state.formData.latitude ?? undefined,
      longitude: state.formData.longitude ?? undefined,
    },
  })

  const latitude = watch('latitude')
  const longitude = watch('longitude')
  const pincode = watch('pincode')
  const city = watch('city')
  const formState = watch('state')

  const handleLocateOnMap = async () => {
    setPincodeError(null)
    setPincodeHint(null)

    if (!/^\d{6}$/.test(pincode || '')) {
      setPincodeError('Enter a valid 6-digit pincode first')
      return
    }

    setPincodeLookupLoading(true)
    try {
      const area = await lookupPincodeArea(pincode, city, formState)
      if (!area) {
        setPincodeError('Could not find this pincode in India. Check the pincode or set city/state, then try again.')
        return
      }

      setMapViewCenter([area.lat, area.lng])
      setMapViewVersion((v) => v + 1)

      if (area.city) {
        setValue('city', area.city, { shouldValidate: true })
      }
      if (area.state) {
        setValue('state', area.state, { shouldValidate: true })
      }

      resetField('latitude')
      resetField('longitude')

      const placeLabel = area.label || [area.city, area.state].filter(Boolean).join(', ')
      setPincodeHint(
        placeLabel
          ? `Map moved near ${placeLabel}. Click the map or drag the pin to set your exact store location.`
          : 'Map moved to pincode area. Click the map or drag the pin to set your exact store location.',
      )
    } finally {
      setPincodeLookupLoading(false)
    }
  }

  const onSubmit = (data: StoreLocationForm) => submitAndReturn(data)

  return (
    <WorkflowFormLayout
      workflowStepId={1}
      title="Store Location"
      subtitle="Enter your store address and pin the exact location on the map."
    >
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textarea
            label="Store Address"
            required
            rows={3}
            {...register('storeAddress')}
            error={errors.storeAddress?.message}
          />
          <Input label="Landmark" {...register('landmark')} error={errors.landmark?.message} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="City" required {...register('city')} error={errors.city?.message} />
            <Select
              label="State"
              required
              options={INDIAN_STATES}
              placeholder="Select state"
              {...register('state')}
              error={errors.state?.message}
            />
          </div>

          <div>
            <label htmlFor="pincode" className="mb-1.5 block text-sm font-medium text-slate-700">
              Pincode <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <div className="flex-1">
                <input
                  id="pincode"
                  maxLength={6}
                  inputMode="numeric"
                  disabled={locked}
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                    errors.pincode?.message || pincodeError ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'
                  }`}
                  {...register('pincode')}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                loading={pincodeLookupLoading}
                disabled={locked}
                onClick={() => void handleLocateOnMap()}
              >
                Locate on map
              </Button>
            </div>
            {(errors.pincode?.message || pincodeError) && (
              <p className="mt-1 text-sm text-red-600">{errors.pincode?.message || pincodeError}</p>
            )}
            {!errors.pincode?.message && !pincodeError && pincodeHint && (
              <p className="mt-1 text-sm text-green-700">{pincodeHint}</p>
            )}
            {!errors.pincode?.message && !pincodeError && !pincodeHint && (
              <p className="mt-1 text-sm text-slate-500">Enter pincode and click Locate on map to jump to your area</p>
            )}
          </div>

          <Controller
            name="latitude"
            control={control}
            render={() => (
              <MapPicker
                latitude={latitude ?? null}
                longitude={longitude ?? null}
                viewCenter={mapViewCenter}
                viewCenterVersion={mapViewVersion}
                viewZoom={13}
                areaLoading={pincodeLookupLoading}
                onLocationChange={(lat, lng) => {
                  setValue('latitude', lat, { shouldValidate: true, shouldDirty: true })
                  setValue('longitude', lng, { shouldValidate: true, shouldDirty: true })
                }}
                error={errors.latitude?.message || errors.longitude?.message}
              />
            )}
          />

          <WorkflowFormNavigation
            onCancel={returnToHub}
            cancelLabel="Back to Store Information"
            saveLoading={saving}
            saveError={saveError}
          />
        </form>
      </Card>
    </WorkflowFormLayout>
  )
}
