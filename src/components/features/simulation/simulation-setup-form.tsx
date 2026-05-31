import type { FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IconAdjustments, IconPlayerPlay, IconRefresh, IconSettings } from '@tabler/icons-react'
import { InfoTooltip } from '@/components/ui/tooltip'
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
  const parsedTotalTime =
    Number(totalTime ?? (simulationOptions ? String(simulationOptions.defaults.total_time) : '')) ||
    0
  const parsedDt =
    Number(dt ?? (simulationOptions ? String(simulationOptions.defaults.dt) : '')) || 0
  const stepsPerSim = parsedDt > 0 ? Math.floor(parsedTotalTime / parsedDt) : 0
  const timeUnit = simulationOptions?.defaults.time_unit || 'Time Unit'
  const stepsPerTimeUnit = parsedDt > 0 ? 1 / parsedDt : 0
  const modelPlaceholder = isModelsLoading
    ? 'Loading models...'
    : modelOptions.length === 0
      ? 'No models uploaded yet'
      : 'Select a model...'

  const handleResetParameters = () => {
    onParameterOverridesChange({})
  }

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto pr-1.5">
        {/* Setup Card */}
        <div className="border-primary-200/90 bg-primary-50/95 shrink-0 rounded-xl border p-4 shadow-sm">
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
                        <p className="text-primary-700 mb-1 flex items-center gap-1 text-[10px] font-semibold tracking-widest uppercase">
                          End Time
                          <InfoTooltip
                            content={`Total simulation duration. Unit: ${simulationOptions?.defaults.time_unit || 'Not defined in model'}`}
                          />
                        </p>
                        <Input
                          type="number"
                          min={0.0001}
                          step={1}
                          value={
                            totalTime ??
                            (simulationOptions ? String(simulationOptions.defaults.total_time) : '')
                          }
                          setValue={onTotalTimeChange}
                          placeholder={
                            simulationOptions ? String(simulationOptions.defaults.total_time) : ''
                          }
                          required
                          disabled={isSubmitting}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-primary-700 mb-1 flex items-center gap-1 text-[10px] font-semibold tracking-widest uppercase">
                        Time Step (dt)
                        <InfoTooltip
                          content={`Euler integration time step (dt). Unit: ${simulationOptions?.defaults.time_unit || 'Not defined in model'}`}
                        />
                      </p>
                      <Input
                        type="number"
                        min={0.0001}
                        step={0.01}
                        value={
                          dt ?? (simulationOptions ? String(simulationOptions.defaults.dt) : '')
                        }
                        setValue={onDtChange}
                        placeholder={simulationOptions ? String(simulationOptions.defaults.dt) : ''}
                        required
                        disabled={isSubmitting}
                        className="font-mono text-sm"
                      />
                    </div>

                    {/* Simulation Load Preview Card */}
                    {stepsPerSim > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 rounded-lg border border-sky-200 bg-sky-50/70 p-3 text-xs shadow-sm"
                      >
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-[11px] font-semibold tracking-wide text-sky-950 uppercase">
                            Workload preview
                          </span>
                        </div>
                        <div className="text-primary-950 space-y-1 text-[11px] font-medium">
                          <div className="flex justify-between">
                            <span className="text-primary-800/80">Steps per {timeUnit}:</span>
                            <span className="font-mono">
                              {stepsPerTimeUnit % 1 === 0
                                ? stepsPerTimeUnit
                                : stepsPerTimeUnit.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-primary-800/80">Total Duration:</span>
                            <span className="font-mono">
                              {parsedTotalTime} {parsedTotalTime === 1 ? timeUnit : `${timeUnit}s`}
                            </span>
                          </div>
                          <div className="my-1 border-t border-sky-200/50" />
                          <div className="flex justify-between font-bold">
                            <span className="text-primary-900">Simulation Steps:</span>
                            <span className="font-mono text-sky-700">
                              {stepsPerSim.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
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
                className="flex shrink-0 flex-col"
              >
                <div className="border-primary-200/90 bg-primary-50/95 flex flex-col rounded-xl border p-4 shadow-sm">
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

                  <div className="space-y-3 pb-2">
                    {simulationOptions.parameters.map((parameter) => {
                      const currentValue =
                        parameterOverrides[parameter.name] ?? String(parameter.initial_value)

                      const isParamActive = activeParam === parameter.name

                      return (
                        <div
                          key={parameter.name}
                          className={`shrink-0 snap-start rounded-lg border p-3 transition-all duration-150 ${
                            isParamActive
                              ? 'border-amber-400 bg-amber-500/10 shadow-sm'
                              : 'border-primary-200/70 bg-primary-100/30'
                          }`}
                          onMouseEnter={() => onActiveParamChange?.(parameter.name)}
                          onMouseLeave={() => onActiveParamChange?.(null)}
                        >
                          <p
                            className={`mb-2 text-xs font-semibold break-words transition-colors duration-150 ${
                              isParamActive ? 'text-amber-900' : 'text-primary-900'
                            }`}
                          >
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
      </div>

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
