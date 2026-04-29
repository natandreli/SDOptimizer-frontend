import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { getAllModels, simulateModel } from '@/services/api/models'
import type { SimulationConfig, SimulationResult } from '@/services/api/models/types'
import { SimulationRunProgress } from '@/components/features/simulation/simulation-run-progress'
import { SimulationSetupForm } from '@/components/features/simulation/simulation-setup-form'
import { SimulationEmptyState } from '@/components/features/simulation/simulation-empty-state'
import { SimulationResults } from '@/components/features/simulation/simulation-results'
import { useToast } from '@/hooks/use-toast'

export const SimulationPage = () => {
  const toast = useToast()
  const [selectedModelId, setSelectedModelId] = useState('')
  const [dt, setDt] = useState('0.25')
  const [totalTime, setTotalTime] = useState('100')
  const [parameterOverridesText, setParameterOverridesText] = useState('{}')
  const [isSetupCollapsed, setIsSetupCollapsed] = useState(false)
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [result, setResult] = useState<SimulationResult | null>(null)

  const { data: models, isLoading: isModelsLoading } = useQuery({
    queryKey: ['models'],
    queryFn: getAllModels,
  })

  const modelOptions = useMemo(
    () =>
      (models ?? []).map((item) => ({
        value: item.model_id,
        label: item.model?.file_name || item.model_id,
        subtitle: `ID: ${item.model_id}`,
      })),
    [models]
  )

  const simulationMutation = useMutation({
    mutationFn: ({ modelId, config }: { modelId: string; config: SimulationConfig }) =>
      simulateModel(modelId, config),
    onSuccess: (data) => {
      setResult(data.result)
      setSimulationProgress(100)
      setIsSetupCollapsed(true)
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

  const parseParameterOverrides = (raw: string): Record<string, number> => {
    if (!raw.trim()) {
      return {}
    }

    const parsed = JSON.parse(raw)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Parameter overrides must be a JSON object')
    }

    const normalized: Record<string, number> = {}

    for (const [key, value] of Object.entries(parsed)) {
      const numericValue = Number(value)
      if (!Number.isFinite(numericValue)) {
        throw new Error(`Override value for "${key}" must be numeric`)
      }
      normalized[key] = numericValue
    }

    return normalized
  }

  const handleRunSimulation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedModelId) {
      toast.error('Please select a model')
      return
    }

    const dtValue = Number(dt)
    const totalTimeValue = Number(totalTime)

    if (!Number.isFinite(dtValue) || dtValue <= 0) {
      toast.error('Time step must be greater than 0')
      return
    }

    if (!Number.isFinite(totalTimeValue) || totalTimeValue <= 0) {
      toast.error('Simulation duration must be greater than 0')
      return
    }

    let parameterOverrides: Record<string, number>

    try {
      parameterOverrides = parseParameterOverrides(parameterOverridesText)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid parameter_overrides JSON')
      return
    }

    setResult(null)
    setSimulationProgress(8)

    simulationMutation.mutate({
      modelId: selectedModelId,
      config: {
        dt: dtValue,
        total_time: totalTimeValue,
        parameter_overrides: parameterOverrides,
      },
    })
  }

  return (
    <main className="space-y-8 pb-12">
      <section className="space-y-1 text-center">
        <p className="text-primary-950 text-3xl font-semibold tracking-tight">Simulation</p>
        <p className="text-primary-900/75 mt-1 text-sm">
          Run Euler simulation on an uploaded model and inspect the output.
        </p>
      </section>

      <SimulationSetupForm
        isModelsLoading={isModelsLoading}
        modelOptions={modelOptions}
        selectedModelId={selectedModelId}
        onSelectedModelIdChange={setSelectedModelId}
        dt={dt}
        onDtChange={setDt}
        totalTime={totalTime}
        onTotalTimeChange={setTotalTime}
        parameterOverridesText={parameterOverridesText}
        onParameterOverridesTextChange={setParameterOverridesText}
        isSubmitting={simulationMutation.isPending}
        isCollapsed={isSetupCollapsed}
        onToggleCollapse={() => setIsSetupCollapsed((prev) => !prev)}
        onSubmit={handleRunSimulation}
      />

      {simulationMutation.isPending && <SimulationRunProgress progress={simulationProgress} />}

      {!simulationMutation.isPending && !result && (
        <SimulationEmptyState isLoading={isModelsLoading} hasModels={modelOptions.length > 0} />
      )}

      {!simulationMutation.isPending && result && <SimulationResults result={result} />}
    </main>
  )
}
