import type { FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IconAdjustments, IconPlayerPlay, IconRefresh, IconSettings } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { SimulationOptions } from '@/services/api/models/types'

type ModelOption = {
  value: string
  label: string
  subtitle?: string
}

type SimulationSetupFormProps = {
  isModelsLoading: boolean
  modelOptions: ModelOption[]
  selectedModelId: string
  onSelectedModelIdChange: (value: string) => void
  dt: string | undefined
  onDtChange: (value: string | undefined) => void
  totalTime: string | undefined
  onTotalTimeChange: (value: string | undefined) => void
  parameterOverrides: Record<string, string>
  onParameterOverridesChange: (value: Record<string, string>) => void
  simulationOptions?: SimulationOptions
  isLoadingOptions?: boolean
  isSubmitting: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  activeParam?: string | null
  onActiveParamChange?: (name: string | null) => void
}

export const SimulationSetupForm = ({
  isModelsLoading,
  modelOptions,
  selectedModelId,
  onSelectedModelIdChange,
  dt,
  onDtChange,
  totalTime,
  onTotalTimeChange,
  parameterOverrides,
  onParameterOverridesChange,
  simulationOptions,
  isLoadingOptions,
  isSubmitting,
  onSubmit,
  activeParam = null,
  onActiveParamChange,
}: SimulationSetupFormProps) => {
  const modelPlaceholder = isModelsLoading
    ? 'Loading models...'
    : modelOptions.length === 0
      ? 'No models uploaded yet'
      : 'Select a model...'

  const handleResetParameters = () => {
    onParameterOverridesChange({})
  }

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col gap-5">
      {/* Setup Card */}
      <div className="border-primary-200/90 bg-primary-50/95 rounded-xl border p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <IconSettings className="text-primary-700 h-4 w-4" />
          <span className="text-primary-950 text-sm font-semibold">Setup</span>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-primary-700 mb-1 text-[10px] font-semibold tracking-widest uppercase">
              Model
            </p>
            <Select
              value={selectedModelId}
              onChange={onSelectedModelIdChange}
              options={modelOptions}
              placeholder={modelPlaceholder}
              disabled={isModelsLoading || modelOptions.length === 0 || isSubmitting}
            />
          </div>

          <AnimatePresence initial={false}>
            {selectedModelId && simulationOptions && !isLoadingOptions && (
              <motion.div
                key="time-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-primary-700 mb-1 text-[10px] font-semibold tracking-widest uppercase">
                        Start Time
                      </p>
                      <Input type="number" value="0" disabled className="font-mono text-sm" />
                    </div>
                    <div>
                      <p className="text-primary-700 mb-1 text-[10px] font-semibold tracking-widest uppercase">
                        End Time
                      </p>
                      <Input
                        type="number"
                        min={0.0001}
                        step={1}
                        value={totalTime ?? (simulationOptions ? String(simulationOptions.defaults.total_time) : '')}
                        setValue={onTotalTimeChange}
                        placeholder={simulationOptions ? String(simulationOptions.defaults.total_time) : ''}
                        required
                        disabled={isSubmitting}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-primary-700 mb-1 text-[10px] font-semibold tracking-widest uppercase">
                      Time Step (dt)
                    </p>
                    <Input
                      type="number"
                      min={0.0001}
                      step={0.01}
                      value={dt ?? (simulationOptions ? String(simulationOptions.defaults.dt) : '')}
                      setValue={onDtChange}
                      placeholder={simulationOptions ? String(simulationOptions.defaults.dt) : ''}
                      required
                      disabled={isSubmitting}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Parameters Card */}
      <AnimatePresence initial={false}>
        {selectedModelId &&
          simulationOptions &&
          !isLoadingOptions &&
          simulationOptions.parameters.length > 0 && (
            <motion.div
              key="parameters-card"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="border-primary-200/90 bg-primary-50/95 flex min-h-0 flex-1 flex-col rounded-xl border p-4 shadow-sm">
                <div className="mb-3 flex shrink-0 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconAdjustments className="text-primary-700 h-4 w-4" />
                    <span className="text-primary-950 text-sm font-semibold">Parameters</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetParameters}
                    className="text-primary-600 hover:text-primary-800 hover:bg-primary-100 inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                  >
                    <IconRefresh className="h-3 w-3" />
                    Reset All
                  </button>
                </div>

                <div className="min-h-0 flex-1 snap-y snap-mandatory space-y-3 overflow-y-auto pr-1 pb-4">
                  {simulationOptions.parameters.map((parameter) => {
                    const currentValue =
                      parameterOverrides[parameter.name] ?? String(parameter.initial_value)

                    const isParamActive = activeParam === parameter.name

                    return (
                      <div
                        key={parameter.name}
                        className={`transition-all duration-150 shrink-0 snap-start rounded-lg border p-3 ${isParamActive
                          ? 'border-amber-400 bg-amber-500/10 shadow-sm'
                          : 'border-primary-200/70 bg-primary-100/30'
                          }`}
                        onMouseEnter={() => onActiveParamChange?.(parameter.name)}
                        onMouseLeave={() => onActiveParamChange?.(null)}
                      >
                        <p className={`mb-2 text-xs font-semibold transition-colors duration-150 ${isParamActive ? 'text-amber-900' : 'text-primary-900'
                          }`}>
                          {parameter.name}
                        </p>
                        <Input
                          type="number"
                          step={0.0001}
                          value={currentValue}
                          setValue={(value) =>
                            onParameterOverridesChange({
                              ...parameterOverrides,
                              [parameter.name]: value,
                            })
                          }
                          onFocus={() => onActiveParamChange?.(parameter.name)}
                          onBlur={() => onActiveParamChange?.(null)}
                          disabled={isSubmitting}
                          className="font-mono text-sm"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Run Button */}
      <AnimatePresence initial={false}>
        {selectedModelId && simulationOptions && !isLoadingOptions && (
          <motion.div
            key="run-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-auto shrink-0"
          >
            <Button
              type="submit"
              variant="success"
              icon={<IconPlayerPlay className="h-4 w-4" />}
              isLoading={isSubmitting}
              disabled={isModelsLoading || modelOptions.length === 0 || isSubmitting}
              className="w-full"
            >
              Run Simulation
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}
