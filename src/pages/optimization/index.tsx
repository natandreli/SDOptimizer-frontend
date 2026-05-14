import { IconChartLine } from '@tabler/icons-react'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { OptimizationSetupForm } from '@/components/features/optimization/optimization-setup-form'
import { OptimizationEmptyState } from '@/components/features/optimization/optimization-empty-state'
import { OptimizationResults } from '@/components/features/optimization/optimization-results'
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

export const OptimizationPage = () => {
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

  const optimizationOptions = optimizationOptionsResponse?.options ?? null

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
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <section className="space-y-1 text-center">
        <p className="text-primary-950 text-3xl font-semibold tracking-tight">Optimization</p>
        <p className="text-primary-900/75 mt-1 text-sm">
          Search for the best parameter configuration to optimize model performance.
        </p>
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="flex min-h-0 flex-col overflow-hidden">
          <OptimizationSetupForm
            isModelsLoading={isLoadingModels}
            modelOptions={modelOptions}
            selectedModelId={selectedModelId}
            onSelectedModelIdChange={(value) => {
              setSelectedModelId(value)
              setResult(null)
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
            optimizationOptions={optimizationOptions}
            isLoadingOptions={isLoadingOptions}
            isSubmitting={optimizeMutation.isPending}
            onSubmit={handleRunOptimization}
            effectiveStatistic={effectiveStatistic}
            onStatisticChange={setSelectedStatistic}
            statisticOptions={statisticOptions}
            effectiveTargetVariable={effectiveTargetVariable}
            onTargetVariableChange={setSelectedTargetVariable}
            targetVariableOptions={targetVariableOptions}
            effectiveDirection={effectiveDirection}
            onDirectionChange={setSelectedDirection}
            directionOptions={DIRECTION_OPTIONS}
            effectiveEpsilon={epsilon}
            onEpsilonChange={setEpsilon}
            effectiveMaxRuns={maxRuns}
            onMaxRunsChange={setMaxRuns}
            effectiveGlobalRho={globalRho}
            onGlobalRhoChange={setGlobalRho}
            initialValues={initialValues}
            onInitialValuesChange={setInitialValues}
            boundMins={boundMins}
            onBoundMinsChange={setBoundMins}
            boundMaxs={boundMaxs}
            onBoundMaxsChange={setBoundMaxs}
            isConfigReady={isConfigReady}
          />
        </aside>

        <section className="border-primary-200/90 bg-primary-50/95 flex h-full min-h-0 flex-col rounded-xl border shadow-sm">
          <div className="border-primary-200/70 flex items-center justify-between border-b px-5 py-3">
            <div className="flex items-center gap-2">
              <IconChartLine className="text-primary-700 h-4 w-4" />
              <span className="text-primary-950 text-base font-semibold">Results</span>
            </div>
            {optimizeMutation.isPending ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
                Optimizing...
              </span>
            ) : result ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Awaiting Input
              </span>
            )}
          </div>

          {optimizeMutation.isPending && (
            <div className="bg-primary-100 h-1.5 w-full overflow-hidden">
              <div
                className="h-full rounded-r-full bg-sky-500 transition-all duration-300 ease-out"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          )}

          <div className="flex flex-1 flex-col overflow-y-auto p-5">
            {!optimizeMutation.isPending && !result && (
              <OptimizationEmptyState
                isLoadingModels={isLoadingModels}
                hasModels={(models?.length ?? 0) > 0}
              />
            )}
            {!optimizeMutation.isPending && result && (
              <OptimizationResults
                result={result}
                modelName={
                  models?.find((m) => m.model_id === selectedModelId)?.model?.file_name ||
                  selectedModelId
                }
              />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
