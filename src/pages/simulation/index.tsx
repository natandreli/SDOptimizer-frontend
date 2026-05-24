import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { IconChartDots3, IconChartLine } from '@tabler/icons-react'
import { getAllModels, getSimulationOptions, simulateModel } from '@/services/api/models'
import type { SimulationConfig, SimulationResult } from '@/services/api/models/types'
import { SimulationSetupForm } from '@/components/features/simulation/simulation-setup-form'
import { SimulationEmptyState } from '@/components/features/simulation/simulation-empty-state'
import { SimulationResults } from '@/components/features/simulation/simulation-results'
import { useToast } from '@/hooks/use-toast'
import { StockFlowDiagram } from '@/components/features/models/modals/stock-flow-diagram'

export const SimulationPage = () => {
  const toast = useToast()
  const [selectedModelId, setSelectedModelId] = useState('')
  const [dt, setDt] = useState<string | undefined>(undefined)
  const [totalTime, setTotalTime] = useState<string | undefined>(undefined)
  const [parameterOverrides, setParameterOverrides] = useState<Record<string, string>>({})
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [result, setResult] = useState<SimulationResult | null>(null)

  // Tab state: 'diagram' or 'results'
  const [activeTab, setActiveTab] = useState<'diagram' | 'results'>('diagram')
  // Active parameter hovered/focused state
  const [activeParam, setActiveParam] = useState<string | null>(null)

  const { data: models, isLoading: isModelsLoading } = useQuery({
    queryKey: ['models'],
    queryFn: getAllModels,
  })

  const { data: optionsResponse, isLoading } = useQuery({
    queryKey: ['simulation-options', selectedModelId],
    queryFn: () => getSimulationOptions(selectedModelId),
    enabled: Boolean(selectedModelId),
  })

  const isLoadingOptionsComponent = isLoading

  const simulationOptions = optionsResponse?.options

  const effectiveDt = dt ?? (simulationOptions ? String(simulationOptions.defaults.dt) : '')
  const effectiveTotalTime =
    totalTime ?? (simulationOptions ? String(simulationOptions.defaults.total_time) : '')

  const modelOptions = useMemo(
    () =>
      (models ?? []).map((item) => ({
        value: item.model_id,
        label: item.model?.file_name || item.model_id,
        subtitle: `ID: ${item.model_id}`,
      })),
    [models]
  )

  const currentModelItem = useMemo(() => {
    if (!selectedModelId || !models) return null
    return models.find((m) => m.model_id === selectedModelId)
  }, [selectedModelId, models])

  const currentModelSchema = currentModelItem?.model

  const simulationMutation = useMutation({
    mutationFn: ({ modelId, config }: { modelId: string; config: SimulationConfig }) =>
      simulateModel(modelId, config),
    onSuccess: (data) => {
      setResult(data.result)
      setSimulationProgress(100)
      setActiveTab('results')
      toast.success('Simulation completed successfully')
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      setSimulationProgress(0)
      toast.error(error.response?.data?.detail || 'Simulation failed')
    },
  })

  useEffect(() => {
    if (!simulationMutation.isPending) {
      return
    }

    const interval = setInterval(() => {
      setSimulationProgress((current) => {
        if (current >= 92) {
          return 92
        }

        const increment = current < 50 ? 9 : current < 80 ? 5 : 2
        return Math.min(92, current + increment)
      })
    }, 250)

    return () => clearInterval(interval)
  }, [simulationMutation.isPending])

  useEffect(() => {
    if (simulationMutation.isPending) {
      return
    }

    if (simulationProgress === 0) {
      return
    }

    const resetTimer = setTimeout(() => setSimulationProgress(0), 450)
    return () => clearTimeout(resetTimer)
  }, [simulationMutation.isPending, simulationProgress])

  const handleRunSimulation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedModelId) {
      toast.error('Please select a model')
      return
    }

    const dtValue = Number(effectiveDt)
    const totalTimeValue = Number(effectiveTotalTime)

    if (!Number.isFinite(dtValue) || dtValue <= 0) {
      toast.error('Time step must be greater than 0')
      return
    }

    if (!Number.isFinite(totalTimeValue) || totalTimeValue <= 0) {
      toast.error('Simulation duration must be greater than 0')
      return
    }

    const overrides: Record<string, number> = {}
    for (const [name, value] of Object.entries(parameterOverrides)) {
      if (value.trim() !== '') {
        const num = Number(value)
        if (Number.isFinite(num)) {
          overrides[name] = num
        }
      }
    }

    setResult(null)
    setSimulationProgress(8)

    simulationMutation.mutate({
      modelId: selectedModelId,
      config: {
        dt: dtValue,
        total_time: totalTimeValue,
        parameter_overrides: overrides,
      },
    })
  }

  const canvasStatus = simulationMutation.isPending ? 'running' : result ? 'complete' : 'awaiting'

  const statusConfig = {
    awaiting: {
      label: 'Awaiting Input',
      dotClass: 'bg-amber-400',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    running: {
      label: 'Running...',
      dotClass: 'bg-sky-500 animate-pulse',
      badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    complete: {
      label: 'Complete',
      dotClass: 'bg-emerald-500',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
  }[canvasStatus]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <section className="space-y-1 text-center">
        <p className="text-primary-950 text-3xl font-semibold tracking-tight">Simulation</p>
        <p className="text-primary-900/75 mt-1 text-sm">
          Run Euler simulation on an uploaded model and inspect the output.
        </p>
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="flex min-h-0 flex-col overflow-hidden">
          <SimulationSetupForm
            isModelsLoading={isModelsLoading}
            modelOptions={modelOptions}
            selectedModelId={selectedModelId}
            onSelectedModelIdChange={(value) => {
              setSelectedModelId(value)
              setResult(null)
              setDt(undefined)
              setTotalTime(undefined)
              setParameterOverrides({})
              setActiveTab('diagram')
              setActiveParam(null)
            }}
            dt={dt}
            onDtChange={setDt}
            totalTime={totalTime}
            onTotalTimeChange={setTotalTime}
            parameterOverrides={parameterOverrides}
            onParameterOverridesChange={setParameterOverrides}
            simulationOptions={simulationOptions}
            isLoadingOptions={isLoadingOptionsComponent}
            isSubmitting={simulationMutation.isPending}
            onSubmit={handleRunSimulation}
            activeParam={activeParam}
            onActiveParamChange={setActiveParam}
          />
        </aside>

        <section className="border-primary-200/90 bg-primary-50/95 flex h-full min-h-0 flex-col rounded-xl border shadow-sm">
          <div className="border-primary-200/70 flex items-center justify-between border-b px-5 py-3">
            <div className="flex items-center gap-4">
              {selectedModelId && currentModelSchema && (
                <div className="bg-primary-100 flex items-center gap-1 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('diagram')}
                    className={`rounded-md px-3 py-1.5 font-semibold transition-all ${
                      activeTab === 'diagram'
                        ? 'text-primary-950 bg-white shadow-sm'
                        : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconChartDots3 className="text-primary-700 h-4 w-4" />
                      <span className="text-primary-950 text-base font-semibold">Diagram</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('results')}
                    className={`rounded-md px-3 py-1.5 font-semibold transition-all ${
                      activeTab === 'results'
                        ? 'text-primary-950 bg-white shadow-sm'
                        : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconChartLine className="text-primary-700 h-4 w-4" />
                      <span className="text-primary-950 text-base font-semibold">Results</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`} />
              {statusConfig.label}
            </span>
          </div>

          {simulationMutation.isPending && (
            <div className="bg-primary-100 h-1.5 w-full overflow-hidden">
              <div
                className="h-full rounded-r-full bg-sky-500 transition-all duration-300 ease-out"
                style={{ width: `${Math.max(0, Math.min(100, simulationProgress))}%` }}
              />
            </div>
          )}

          <div className="flex flex-1 flex-col overflow-y-auto p-5">
            {activeTab === 'diagram' && currentModelSchema ? (
              <StockFlowDiagram
                model={currentModelSchema}
                activeParam={activeParam}
                parameterOverrides={parameterOverrides}
                readOnly={true}
                animateFlows={true}
              />
            ) : (
              <>
                {!simulationMutation.isPending && !result && (
                  <SimulationEmptyState
                    isLoadingModels={isModelsLoading}
                    hasModels={modelOptions.length > 0}
                  />
                )}

                {!simulationMutation.isPending && result && <SimulationResults result={result} />}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
