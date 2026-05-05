import { motion, AnimatePresence } from 'framer-motion'
import {
  IconSettings,
  IconAdjustments,
  IconPlayerPlayFilled,
  IconRefresh,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { OptimizationOptions } from '@/services/api/models/types'

type OptimizationTargetDirection = OptimizationOptions['directions'][number]
interface OptimizationSetupFormProps {
  isModelsLoading: boolean
  modelOptions: { value: string; label: string }[]
  selectedModelId: string
  onSelectedModelIdChange: (value: string) => void

  optimizationOptions: OptimizationOptions | null
  isLoadingOptions: boolean
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void

  effectiveStatistic: string
  onStatisticChange: (value: string) => void
  statisticOptions: { value: string; label: string }[]

  effectiveTargetVariable: string
  onTargetVariableChange: (value: string) => void
  targetVariableOptions: { value: string; label: string }[]

  effectiveDirection: string
  onDirectionChange: (value: OptimizationTargetDirection) => void
  directionOptions: { value: string; label: string }[]

  effectiveEpsilon: string
  onEpsilonChange: (value: string) => void
  effectiveMaxRuns: string
  onMaxRunsChange: (value: string) => void
  effectiveGlobalRho: string
  onGlobalRhoChange: (value: string) => void

  initialValues: Record<string, string>
  onInitialValuesChange: (updater: (prev: Record<string, string>) => Record<string, string>) => void
  boundMins: Record<string, string>
  onBoundMinsChange: (updater: (prev: Record<string, string>) => Record<string, string>) => void
  boundMaxs: Record<string, string>
  onBoundMaxsChange: (updater: (prev: Record<string, string>) => Record<string, string>) => void

  isConfigReady: boolean

  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export const OptimizationSetupForm = ({
  isModelsLoading,
  modelOptions,
  selectedModelId,
  onSelectedModelIdChange,

  optimizationOptions,
  isLoadingOptions,
  isSubmitting,
  onSubmit,

  effectiveStatistic,
  onStatisticChange,
  statisticOptions,

  effectiveTargetVariable,
  onTargetVariableChange,
  targetVariableOptions,

  effectiveDirection,
  onDirectionChange,
  directionOptions,

  effectiveEpsilon,
  onEpsilonChange,
  effectiveMaxRuns,
  onMaxRunsChange,
  effectiveGlobalRho,
  onGlobalRhoChange,

  initialValues,
  onInitialValuesChange,
  boundMins,
  onBoundMinsChange,
  boundMaxs,
  onBoundMaxsChange,

  isConfigReady,
}: OptimizationSetupFormProps) => {
  const modelPlaceholder = isModelsLoading
    ? 'Loading models...'
    : modelOptions.length === 0
      ? 'No models uploaded yet'
      : 'Select a model...'

  const handleResetParameters = () => {
    onInitialValuesChange(() => ({}))
    onBoundMinsChange(() => ({}))
    onBoundMaxsChange(() => ({}))
  }

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col gap-5">
      {/* Setup Card */}
      <div className="border-primary-200/90 bg-primary-50/95 flex-shrink-0 rounded-xl border p-4 shadow-sm">
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

          {selectedModelId && optimizationOptions && !isLoadingOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-primary-700 mb-1 text-[10px] font-semibold tracking-widest uppercase">
                    Target Variable
                  </span>
                  <Select
                    value={effectiveTargetVariable}
                    onChange={onTargetVariableChange}
                    options={targetVariableOptions}
                    placeholder="Variable"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-primary-700 mb-1 text-[10px] font-semibold tracking-widest uppercase">
                    Statistic
                  </span>
                  <Select
                    value={effectiveStatistic}
                    onChange={onStatisticChange}
                    options={statisticOptions}
                    placeholder="Statistic"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-primary-700 mb-1 text-[10px] font-semibold tracking-widest uppercase">
                    Direction
                  </span>
                  <Select
                    value={effectiveDirection}
                    onChange={(val) => onDirectionChange(val as OptimizationTargetDirection)}
                    options={directionOptions}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-primary-700 mb-1 text-[10px] font-semibold tracking-widest uppercase">
                    Max Runs
                  </span>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={effectiveMaxRuns}
                    setValue={onMaxRunsChange}
                    required
                    disabled={isSubmitting}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-primary-700 mb-1 text-[10px] font-semibold tracking-widest uppercase">
                    Epsilon
                  </span>
                  <Input
                    type="number"
                    step={0.0001}
                    value={effectiveEpsilon}
                    setValue={onEpsilonChange}
                    required
                    disabled={isSubmitting}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-primary-700 mb-1 text-[10px] font-semibold tracking-widest uppercase">
                    Rho Factor
                  </span>
                  <Input
                    type="number"
                    step={0.001}
                    value={effectiveGlobalRho}
                    setValue={onGlobalRhoChange}
                    required
                    disabled={isSubmitting}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Parameters Card */}
      {selectedModelId &&
        optimizationOptions &&
        !isLoadingOptions &&
        optimizationOptions.parameters.length > 0 && (
          <motion.div
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
                  <span className="text-primary-950 text-sm font-semibold">Parameter Tuning</span>
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
                {optimizationOptions.parameters.map((parameter) => (
                  <div
                    key={parameter.name}
                    className="border-primary-200/70 bg-primary-100/30 shrink-0 snap-start rounded-lg border p-3"
                  >
                    <p className="text-primary-900 mb-2 text-xs font-semibold">{parameter.name}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-primary-800/75 w-16 text-[10px] font-bold tracking-wider uppercase">
                          Initial
                        </span>
                        <Input
                          type="number"
                          className="flex-1 font-mono text-xs"
                          step={0.0001}
                          value={initialValues[parameter.name] ?? String(parameter.initial_value)}
                          setValue={(value) =>
                            onInitialValuesChange((current) => ({
                              ...current,
                              [parameter.name]: value,
                            }))
                          }
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-primary-800/75 w-16 text-[10px] font-bold tracking-wider uppercase">
                          Min
                        </span>
                        <Input
                          type="number"
                          className="flex-1 font-mono text-xs"
                          step={0.0001}
                          value={boundMins[parameter.name] ?? String(parameter.suggested_bounds[0])}
                          setValue={(value) =>
                            onBoundMinsChange((current) => ({
                              ...current,
                              [parameter.name]: value,
                            }))
                          }
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-primary-800/75 w-16 text-[10px] font-bold tracking-wider uppercase">
                          Max
                        </span>
                        <Input
                          type="number"
                          className="flex-1 font-mono text-xs"
                          step={0.0001}
                          value={boundMaxs[parameter.name] ?? String(parameter.suggested_bounds[1])}
                          setValue={(value) =>
                            onBoundMaxsChange((current) => ({
                              ...current,
                              [parameter.name]: value,
                            }))
                          }
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

      <AnimatePresence initial={false}>
        {selectedModelId && optimizationOptions && !isLoadingOptions && (
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-auto shrink-0"
          >
            <Button
              type="submit"
              variant="success"
              icon={<IconPlayerPlayFilled className="h-4 w-4" />}
              isLoading={isSubmitting}
              disabled={!isConfigReady || isSubmitting}
              className="w-full"
            >
              Run Optimization
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}
