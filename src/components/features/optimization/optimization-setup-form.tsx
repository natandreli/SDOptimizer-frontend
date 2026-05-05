import type { FormEvent, Dispatch, SetStateAction } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IconAdjustments, IconChevronDown, IconPlayerPlay } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { OptimizationOptions } from '@/services/api/models/types'

type ModelOption = {
  value: string
  label: string
  subtitle?: string
}

type NumericFieldState = Record<string, string>
type OptimizationTargetDirection = OptimizationOptions['directions'][number]

type OptimizationSetupFormProps = {
  isModelsLoading: boolean
  modelOptions: ModelOption[]
  selectedModelId: string
  onSelectedModelIdChange: (value: string) => void
  optimizationOptions?: OptimizationOptions
  isLoadingOptions: boolean
  isSubmitting: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void

  effectiveStatistic: string
  onStatisticChange: (val: string) => void
  statisticOptions: { label: string; value: string }[]

  effectiveTargetVariable: string
  onTargetVariableChange: (val: string) => void
  targetVariableOptions: { label: string; value: string }[]

  effectiveDirection: OptimizationTargetDirection | ''
  onDirectionChange: (val: OptimizationTargetDirection) => void
  directionOptions: { label: string; value: OptimizationTargetDirection }[]

  effectiveEpsilon: string
  onEpsilonChange: (val: string) => void

  effectiveMaxRuns: string
  onMaxRunsChange: (val: string) => void

  effectiveGlobalRho: string
  onGlobalRhoChange: (val: string) => void

  initialValues: NumericFieldState
  onInitialValuesChange: Dispatch<SetStateAction<NumericFieldState>>

  boundMins: NumericFieldState
  onBoundMinsChange: Dispatch<SetStateAction<NumericFieldState>>

  boundMaxs: NumericFieldState
  onBoundMaxsChange: Dispatch<SetStateAction<NumericFieldState>>

  isConfigReady: boolean
}

export const OptimizationSetupForm = ({
  isModelsLoading,
  modelOptions,
  selectedModelId,
  onSelectedModelIdChange,
  optimizationOptions,
  isLoadingOptions,
  isSubmitting,
  isCollapsed,
  onToggleCollapse,
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

  return (
    <Card>
      <CardHeader className={isCollapsed ? 'mb-0' : ''}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Setup</CardTitle>
            <CardDescription>Choose a model and optimization settings.</CardDescription>
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-primary-800/85 hover:bg-primary-100 inline-flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
            <IconChevronDown
              size={16}
              className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
            />
          </button>
        </div>
      </CardHeader>
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <Select
                  label="Model to optimize"
                  value={selectedModelId}
                  onChange={onSelectedModelIdChange}
                  options={modelOptions}
                  placeholder={modelPlaceholder}
                  disabled={isModelsLoading || modelOptions.length === 0 || isSubmitting}
                />

                <AnimatePresence initial={false}>
                  {selectedModelId && optimizationOptions && !isLoadingOptions && (
                    <motion.div
                      key="optimize-options-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <Select
                            label="Statistic"
                            value={effectiveStatistic}
                            onChange={onStatisticChange}
                            options={statisticOptions}
                            placeholder={
                              isLoadingOptions ? 'Loading statistics...' : 'Select statistic'
                            }
                            disabled={!optimizationOptions || isLoadingOptions || isSubmitting}
                          />

                          <Select
                            label="Target Variable"
                            value={effectiveTargetVariable}
                            onChange={onTargetVariableChange}
                            options={targetVariableOptions}
                            placeholder={
                              isLoadingOptions ? 'Loading variables...' : 'Select variable'
                            }
                            disabled={!optimizationOptions || isLoadingOptions || isSubmitting}
                          />

                          <Select
                            label="Direction"
                            value={effectiveDirection}
                            onChange={(value) =>
                              onDirectionChange(value as OptimizationTargetDirection)
                            }
                            options={directionOptions}
                            disabled={!optimizationOptions || isLoadingOptions || isSubmitting}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="space-y-1.5">
                            <Input
                              label="Epsilon"
                              type="number"
                              step={0.0001}
                              value={effectiveEpsilon}
                              setValue={onEpsilonChange}
                              required
                              disabled={isSubmitting}
                            />
                            <p className="text-primary-800/75 text-xs">
                              Exploration factor for Q-learning updates.
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <Input
                              label="Max Runs"
                              type="number"
                              min={1}
                              step={1}
                              value={effectiveMaxRuns}
                              setValue={onMaxRunsChange}
                              required
                              disabled={isSubmitting}
                            />
                            <p className="text-primary-800/75 text-xs">
                              Maximum optimization iterations.
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <Input
                              label="Rho factor"
                              type="number"
                              step={0.001}
                              value={effectiveGlobalRho}
                              setValue={onGlobalRhoChange}
                              required
                              disabled={isSubmitting}
                            />
                            <p className="text-primary-800/75 text-xs">
                              Learning rate factor for all parameters.
                            </p>
                          </div>
                        </div>

                        {optimizationOptions.parameters.length > 0 ? (
                          <section className="space-y-2">
                            <div className="inline-flex items-center gap-2">
                              <IconAdjustments className="text-primary-800 h-4 w-4" />
                              <p className="text-primary-950 text-sm font-semibold">
                                Parameter tuning
                              </p>
                            </div>

                            <div className="border-primary-200 divide-primary-200 overflow-x-auto rounded-lg border">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-primary-100/50">
                                  <tr>
                                    <th className="text-primary-700 px-4 py-3 text-xs font-semibold tracking-wider uppercase">
                                      Parameter
                                    </th>
                                    <th className="text-primary-700 w-32 px-4 py-3 text-xs font-semibold tracking-wider uppercase md:w-48">
                                      Initial
                                    </th>
                                    <th className="text-primary-700 w-32 px-4 py-3 text-xs font-semibold tracking-wider uppercase md:w-48">
                                      Min Bound
                                    </th>
                                    <th className="text-primary-700 w-32 px-4 py-3 text-xs font-semibold tracking-wider uppercase md:w-48">
                                      Max Bound
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-primary-200 divide-y">
                                  {optimizationOptions.parameters.map((parameter) => (
                                    <tr
                                      key={parameter.name}
                                      className="hover:bg-primary-50/30 transition-colors"
                                    >
                                      <td className="text-primary-900 px-4 py-3 font-mono text-sm tracking-wide">
                                        {parameter.name}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Input
                                          type="number"
                                          className="font-mono text-sm tracking-wide"
                                          step={0.0001}
                                          value={
                                            initialValues[parameter.name] ??
                                            String(parameter.initial_value)
                                          }
                                          setValue={(value) =>
                                            onInitialValuesChange((current) => ({
                                              ...current,
                                              [parameter.name]: value,
                                            }))
                                          }
                                          disabled={isSubmitting}
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <Input
                                          type="number"
                                          className="font-mono text-sm tracking-wide"
                                          step={0.0001}
                                          value={
                                            boundMins[parameter.name] ??
                                            String(parameter.suggested_bounds[0])
                                          }
                                          setValue={(value) =>
                                            onBoundMinsChange((current) => ({
                                              ...current,
                                              [parameter.name]: value,
                                            }))
                                          }
                                          disabled={isSubmitting}
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <Input
                                          type="number"
                                          className="font-mono text-sm tracking-wide"
                                          step={0.0001}
                                          value={
                                            boundMaxs[parameter.name] ??
                                            String(parameter.suggested_bounds[1])
                                          }
                                          setValue={(value) =>
                                            onBoundMaxsChange((current) => ({
                                              ...current,
                                              [parameter.name]: value,
                                            }))
                                          }
                                          disabled={isSubmitting}
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </section>
                        ) : null}

                        <div className="flex items-center justify-end gap-3 pt-6">
                          <Button
                            type="submit"
                            variant="success"
                            icon={<IconPlayerPlay className="h-4 w-4" />}
                            isLoading={isSubmitting}
                            disabled={!isConfigReady || isLoadingOptions || isSubmitting}
                          >
                            Run Optimization
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
