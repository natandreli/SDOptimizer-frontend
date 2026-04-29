import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { IconAdjustments, IconChevronDown, IconPlayerPlay } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { OptimizeEmptyState } from '@/components/features/optimize/optimize-empty-state'
import { OptimizeResults } from '@/components/features/optimize/optimize-results'
import { OptimizeRunProgress } from '@/components/features/optimize/optimize-run-progress'
import { getAllModels, getOptimizationOptions, optimizeModel } from '@/services/api/models'
import type {
  OptimizationConfig,
  OptimizationOptions,
  OptimizationParameterOption,
  OptimizationResult,
} from '@/services/api/models/types'
import { useToast } from '@/hooks/use-toast'

type NumericFieldState = Record<string, string>
type OptimizationTargetDirection = OptimizationOptions['directions'][number]

const DIRECTION_OPTIONS: Array<{ label: string; value: OptimizationTargetDirection }> = [
  { label: 'Maximize', value: 'maximize' },
  { label: 'Minimize', value: 'minimize' },
]

export const OptimizePage = () => {
  const toast = useToast()
  const [selectedModelId, setSelectedModelId] = useState('')
  const [selectedStatistic, setSelectedStatistic] = useState('')
  const [selectedTargetVariable, setSelectedTargetVariable] = useState('')
  const [selectedDirection, setSelectedDirection] = useState<OptimizationTargetDirection | ''>('')
  const [epsilon, setEpsilon] = useState('')
  const [maxRuns, setMaxRuns] = useState('')
  const [initialValues, setInitialValues] = useState<NumericFieldState>({})
  const [boundMins, setBoundMins] = useState<NumericFieldState>({})
  const [boundMaxs, setBoundMaxs] = useState<NumericFieldState>({})
  const [globalRho, setGlobalRho] = useState('')
  const [isSetupCollapsed, setIsSetupCollapsed] = useState(false)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [progress, setProgress] = useState(0)

  const { data: models, isLoading: isLoadingModels } = useQuery({
    queryKey: ['models'],
    queryFn: getAllModels,
  })

  const { data: optimizationOptionsResponse, isLoading: isLoadingOptions } = useQuery({
    queryKey: ['optimization-options', selectedModelId],
    queryFn: () => getOptimizationOptions(selectedModelId),
    enabled: Boolean(selectedModelId),
  })

  const optimizationOptions = optimizationOptionsResponse?.options

  const effectiveStatistic = selectedStatistic || optimizationOptions?.defaults.statistic || ''
  const effectiveTargetVariable =
    selectedTargetVariable || optimizationOptions?.target_variables[0] || ''
  const effectiveDirection =
    selectedDirection || optimizationOptions?.defaults.direction || DIRECTION_OPTIONS[0].value
  const effectiveEpsilon =
    epsilon || (optimizationOptions ? String(optimizationOptions.defaults.epsilon) : '')
  const effectiveMaxRuns =
    maxRuns || (optimizationOptions ? String(optimizationOptions.defaults.max_runs) : '')
  const effectiveGlobalRho =
    globalRho ||
    (optimizationOptions?.parameters?.[0]
      ? String(optimizationOptions.parameters[0].suggested_rho_factor)
      : '')

  const optimizeMutation = useMutation({
    mutationFn: ({ modelId, config }: { modelId: string; config: OptimizationConfig }) =>
      optimizeModel(modelId, config),
    onSuccess: (data) => {
      setProgress(100)
      setResult(data.result)
      setIsSetupCollapsed(true)
      toast.success('Optimization completed successfully')
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      setProgress(0)
      toast.error(error.response?.data?.detail || 'Optimization failed')
    },
  })

  useEffect(() => {
    if (!optimizeMutation.isPending) {
      return
    }

    const interval = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 95) {
          return value
        }
        return value + 5
      })
    }, 180)

    return () => {
      window.clearInterval(interval)
    }
  }, [optimizeMutation.isPending])

  useEffect(() => {
    if (optimizeMutation.isPending || progress === 0) {
      return
    }

    const resetTimer = setTimeout(() => setProgress(0), 450)
    return () => clearTimeout(resetTimer)
  }, [optimizeMutation.isPending, progress])

  const modelOptions = useMemo(
    () =>
      (models ?? []).map((model) => ({
        label: model.model?.file_name || model.model_id,
        value: model.model_id,
        subtitle: `ID: ${model.model_id}`,
      })),
    [models]
  )

  const modelPlaceholder = isLoadingModels
    ? 'Loading models...'
    : modelOptions.length === 0
      ? 'No models uploaded yet'
      : 'Select a model...'

  const statisticOptions = useMemo(
    () =>
      (optimizationOptions?.statistics ?? []).map((statistic) => ({
        label: statistic,
        value: statistic,
      })),
    [optimizationOptions]
  )

  const targetVariableOptions = useMemo(
    () =>
      (optimizationOptions?.target_variables ?? []).map((targetVariable) => ({
        label: targetVariable,
        value: targetVariable,
      })),
    [optimizationOptions]
  )

  const parseParameterArray = (
    parameters: OptimizationParameterOption[],
    values: NumericFieldState,
    label: string,
    getDefault: (parameter: OptimizationParameterOption) => number
  ) => {
    return parameters.map((parameter) => {
      const parsed = Number(values[parameter.name] ?? String(getDefault(parameter)))
      if (!Number.isFinite(parsed)) {
        throw new Error(`${label} for "${parameter.name}" must be numeric`)
      }
      return parsed
    })
  }

  const handleRunOptimization = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedModelId || !optimizationOptions) {
      toast.error('Please select a model')
      return
    }

    const epsilonValue = Number(effectiveEpsilon)
    const maxRunsValue = Number(effectiveMaxRuns)
    const globalRhoValue = Number(effectiveGlobalRho)

    if (!Number.isFinite(epsilonValue) || epsilonValue <= 0) {
      toast.error('Epsilon must be greater than 0')
      return
    }

    if (!Number.isInteger(maxRunsValue) || maxRunsValue <= 0) {
      toast.error('Max runs must be a positive integer')
      return
    }

    if (!Number.isFinite(globalRhoValue) || globalRhoValue <= 0) {
      toast.error('Rho factor must be greater than 0')
      return
    }

    let initialValuesArray: number[] = []
    let minBoundsArray: number[] = []
    let maxBoundsArray: number[] = []
    let rhoFactorArray: number[] = []

    try {
      initialValuesArray = parseParameterArray(
        optimizationOptions.parameters,
        initialValues,
        'Initial value',
        (parameter) => parameter.initial_value
      )
      minBoundsArray = parseParameterArray(
        optimizationOptions.parameters,
        boundMins,
        'Minimum bound',
        (parameter) => parameter.suggested_bounds[0]
      )
      maxBoundsArray = parseParameterArray(
        optimizationOptions.parameters,
        boundMaxs,
        'Maximum bound',
        (parameter) => parameter.suggested_bounds[1]
      )
      rhoFactorArray = optimizationOptions.parameters.map(() => globalRhoValue)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid parameter values')
      return
    }

    for (let index = 0; index < optimizationOptions.parameters.length; index += 1) {
      if (minBoundsArray[index] > maxBoundsArray[index]) {
        toast.error(
          `Invalid bounds for "${optimizationOptions.parameters[index].name}": min cannot exceed max`
        )
        return
      }
      if (
        initialValuesArray[index] < minBoundsArray[index] ||
        initialValuesArray[index] > maxBoundsArray[index]
      ) {
        toast.error(
          `Invalid initial value for "${optimizationOptions.parameters[index].name}": must be between min and max bounds`
        )
        return
      }
    }

    setResult(null)
    setProgress(8)

    optimizeMutation.mutate({
      modelId: selectedModelId,
      config: {
        parameter_names: optimizationOptions.parameters.map((parameter) => parameter.name),
        initial_values: initialValuesArray,
        bounds: minBoundsArray.map((min, index) => [min, maxBoundsArray[index]]),
        rho_factors: rhoFactorArray,
        epsilon: epsilonValue,
        max_runs: maxRunsValue,
        statistic: effectiveStatistic as OptimizationOptions['statistics'][number],
        target_variable: effectiveTargetVariable,
        direction: effectiveDirection as OptimizationTargetDirection,
      },
    })
  }

  const isConfigReady =
    Boolean(selectedModelId) &&
    Boolean(optimizationOptions) &&
    Boolean(effectiveStatistic) &&
    Boolean(effectiveTargetVariable) &&
    Boolean(effectiveEpsilon) &&
    Boolean(effectiveMaxRuns)

  return (
    <main className="space-y-8 pb-12">
      <section className="space-y-1 text-center">
        <p className="text-primary-950 text-3xl font-semibold tracking-tight">Optimization</p>
        <p className="text-primary-900/75 mt-1 text-sm">
          Search for the best parameter configuration to optimize model performance.
        </p>
      </section>

      <Card>
        <CardHeader className={isSetupCollapsed ? 'mb-0' : ''}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Setup</CardTitle>
              <CardDescription>Choose a model and optimization settings.</CardDescription>
            </div>
            <button
              type="button"
              onClick={() => setIsSetupCollapsed((prev) => !prev)}
              className="text-primary-800/85 hover:bg-primary-100 inline-flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
            >
              {isSetupCollapsed ? 'Expand' : 'Collapse'}
              <IconChevronDown
                size={16}
                className={`transition-transform ${isSetupCollapsed ? '-rotate-90' : ''}`}
              />
            </button>
          </div>
        </CardHeader>
        <AnimatePresence initial={false}>
          {!isSetupCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <CardContent>
                <form onSubmit={handleRunOptimization} className="space-y-4">
                  <Select
                    label="Model to optimize"
                    value={selectedModelId}
                    onChange={(value) => {
                      setSelectedModelId(value)
                      setResult(null)
                      setIsSetupCollapsed(false)
                      setSelectedStatistic('')
                      setSelectedTargetVariable('')
                      setSelectedDirection('')
                      setEpsilon('')
                      setMaxRuns('')
                      setInitialValues({})
                      setBoundMins({})
                      setBoundMaxs({})
                      setGlobalRho('')
                    }}
                    options={modelOptions}
                    placeholder={modelPlaceholder}
                    disabled={
                      isLoadingModels || modelOptions.length === 0 || optimizeMutation.isPending
                    }
                  />

                  {selectedModelId && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Select
                          label="Statistic"
                          value={effectiveStatistic}
                          onChange={setSelectedStatistic}
                          options={statisticOptions}
                          placeholder={
                            isLoadingOptions ? 'Loading statistics...' : 'Select statistic'
                          }
                          disabled={
                            !optimizationOptions || isLoadingOptions || optimizeMutation.isPending
                          }
                        />

                        <Select
                          label="Target Variable"
                          value={effectiveTargetVariable}
                          onChange={setSelectedTargetVariable}
                          options={targetVariableOptions}
                          placeholder={
                            isLoadingOptions ? 'Loading variables...' : 'Select variable'
                          }
                          disabled={
                            !optimizationOptions || isLoadingOptions || optimizeMutation.isPending
                          }
                        />

                        <Select
                          label="Direction"
                          value={effectiveDirection}
                          onChange={(value) =>
                            setSelectedDirection(value as OptimizationTargetDirection)
                          }
                          options={DIRECTION_OPTIONS}
                          disabled={
                            !optimizationOptions || isLoadingOptions || optimizeMutation.isPending
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-1.5">
                          <Input
                            label="Epsilon"
                            type="number"
                            step={0.0001}
                            value={effectiveEpsilon}
                            setValue={setEpsilon}
                            required
                            disabled={optimizeMutation.isPending}
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
                            setValue={setMaxRuns}
                            required
                            disabled={optimizeMutation.isPending}
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
                            setValue={setGlobalRho}
                            required
                            disabled={optimizeMutation.isPending}
                          />
                          <p className="text-primary-800/75 text-xs">
                            Learning rate factor for all parameters.
                          </p>
                        </div>
                      </div>

                      {optimizationOptions && optimizationOptions.parameters.length > 0 ? (
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
                                    <td className="text-primary-900 px-4 py-3 font-medium">
                                      {parameter.name}
                                    </td>
                                    <td className="px-4 py-3">
                                      <Input
                                        type="number"
                                        step={0.0001}
                                        value={
                                          initialValues[parameter.name] ??
                                          String(parameter.initial_value)
                                        }
                                        setValue={(value) =>
                                          setInitialValues((current) => ({
                                            ...current,
                                            [parameter.name]: value,
                                          }))
                                        }
                                        disabled={optimizeMutation.isPending}
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Input
                                        type="number"
                                        step={0.0001}
                                        value={
                                          boundMins[parameter.name] ??
                                          String(parameter.suggested_bounds[0])
                                        }
                                        setValue={(value) =>
                                          setBoundMins((current) => ({
                                            ...current,
                                            [parameter.name]: value,
                                          }))
                                        }
                                        disabled={optimizeMutation.isPending}
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Input
                                        type="number"
                                        step={0.0001}
                                        value={
                                          boundMaxs[parameter.name] ??
                                          String(parameter.suggested_bounds[1])
                                        }
                                        setValue={(value) =>
                                          setBoundMaxs((current) => ({
                                            ...current,
                                            [parameter.name]: value,
                                          }))
                                        }
                                        disabled={optimizeMutation.isPending}
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      ) : null}

                      <div className="flex items-center justify-end gap-3">
                        <Button
                          type="submit"
                          variant="success"
                          icon={<IconPlayerPlay className="h-4 w-4" />}
                          isLoading={optimizeMutation.isPending}
                          disabled={!isConfigReady || isLoadingModels || modelOptions.length === 0}
                        >
                          Run Optimization
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </form>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {optimizeMutation.isPending ? <OptimizeRunProgress progress={progress} /> : null}

      {!optimizeMutation.isPending && !result && (
        <OptimizeEmptyState
          isLoadingModels={isLoadingModels}
          hasModels={(models?.length ?? 0) > 0}
        />
      )}

      {!optimizeMutation.isPending && result && <OptimizeResults result={result} />}
    </main>
  )
}
