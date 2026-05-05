import { useMemo, useState } from 'react'
import { IconChartLine, IconX } from '@tabler/icons-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SimulationResult } from '@/services/api/models/types'
import { CardDescription, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import {
  formatChartValue,
  formatMetricValue,
  getVariableColor,
  renderHighlightedJson,
} from '@/utils/formatters'

type SimulationResultsProps = {
  result: SimulationResult
}

const VariableChip = ({
  varName,
  isFocused,
  color,
  onClick,
  onRemove,
}: {
  varName: string
  isFocused: boolean
  color: string
  onClick: () => void
  onRemove: () => void
}) => {
  return (
    <div
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${isFocused
        ? 'bg-primary-900 ring-primary-900/20 ring-offset-primary-50 text-white shadow-sm ring-2 ring-offset-2'
        : 'bg-primary-100 text-primary-900 hover:bg-primary-200'
        }`}
    >
      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {varName}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className={`ml-0.5 cursor-pointer rounded-full p-0.5 hover:bg-black/10 focus:outline-none ${isFocused ? 'hover:bg-white/20' : ''
          }`}
      >
        <IconX size={12} />
      </button>
    </div>
  )
}

export const SimulationResults = ({ result }: SimulationResultsProps) => {
  const [prevResult, setPrevResult] = useState(result)

  const [selectedVariables, setSelectedVariables] = useState<string[]>(() => {
    const keys = Object.keys(result.time_series)
    return keys.length > 0 ? [keys[0]] : []
  })

  const [focusedVariable, setFocusedVariable] = useState<string>(() => {
    const keys = Object.keys(result.time_series)
    return keys.length > 0 ? keys[0] : ''
  })

  if (result !== prevResult) {
    setPrevResult(result)
    const keys = Object.keys(result.time_series)
    setSelectedVariables(keys.length > 0 ? [keys[0]] : [])
    setFocusedVariable(keys.length > 0 ? keys[0] : '')
  }

  const variableNames = useMemo(() => Object.keys(result.time_series), [result])
  const firstSeries = variableNames.length > 0 ? result.time_series[variableNames[0]] : undefined

  const chartData = useMemo(() => {
    if (selectedVariables.length === 0) return []

    const base = result.time_series[selectedVariables[0]] || []
    return base.map((_, index) => {
      const point: { step: number;[key: string]: number } = { step: index }
      for (const varName of selectedVariables) {
        const series = result.time_series[varName] || []
        point[varName] = series[index]
      }
      return point
    })
  }, [result, selectedVariables])

  const selectedStats =
    focusedVariable && result.summary_stats[focusedVariable]
      ? result.summary_stats[focusedVariable]
      : undefined

  const handleAddVariable = (val: string) => {
    if (!selectedVariables.includes(val)) {
      setSelectedVariables((prev) => [...prev, val])
    }
    setFocusedVariable(val)
  }

  const handleRemoveVariable = (val: string) => {
    setSelectedVariables((prev) => {
      const next = prev.filter((v) => v !== val)
      if (focusedVariable === val) {
        setFocusedVariable(next[next.length - 1] || '')
      }
      return next
    })
  }

  const highlightedJson = renderHighlightedJson(JSON.stringify(result, null, 2))

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <CardTitle className="inline-flex items-center gap-2">
          <IconChartLine className="h-4 w-4" />
          Results
        </CardTitle>
        <CardDescription>Execution summary, chart view and raw output.</CardDescription>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="border-primary-200 bg-primary-50/85 rounded-lg border px-3 py-2">
            <p className="text-primary-800/80 text-xs font-medium">Steps Executed</p>
            <p className="text-primary-950 mt-1 text-xl font-bold">{result.steps_executed}</p>
          </div>
          <div className="border-primary-200 bg-primary-50/85 rounded-lg border px-3 py-2">
            <p className="text-primary-800/80 text-xs font-medium">Variables</p>
            <p className="text-primary-950 mt-1 text-xl font-bold">{variableNames.length}</p>
          </div>
          <div className="border-primary-200 bg-primary-50/85 rounded-lg border px-3 py-2">
            <p className="text-primary-800/80 text-xs font-medium">Points per series</p>
            <p className="text-primary-950 mt-1 text-xl font-bold">{firstSeries?.length ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          <section className="border-primary-200 bg-primary-50/80 rounded-lg border p-4">
            <div className="mb-3 space-y-1">
              <p className="text-primary-950 text-lg font-semibold">Variable Inspector</p>
              <p className="text-primary-900/75 text-xs">
                Select a variable to view its trajectory and summary stats.
              </p>
            </div>

            <div className="space-y-3">
              <Select
                label="Add variable to compare"
                value=""
                options={variableNames
                  .filter((name) => !selectedVariables.includes(name))
                  .map((name) => ({ value: name, label: name }))}
                onChange={handleAddVariable}
                disabled={variableNames.length === selectedVariables.length}
                placeholder={
                  variableNames.length === selectedVariables.length
                    ? 'All variables selected'
                    : 'Select a variable...'
                }
              />

              {selectedVariables.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedVariables.map((varName) => (
                    <VariableChip
                      key={varName}
                      varName={varName}
                      isFocused={focusedVariable === varName}
                      color={getVariableColor(variableNames.indexOf(varName))}
                      onClick={() => setFocusedVariable(varName)}
                      onRemove={() => handleRemoveVariable(varName)}
                    />
                  ))}
                </div>
              )}

              {selectedStats && focusedVariable && (
                <div className="mt-4">
                  <p className="text-primary-950 mb-2 px-1 text-sm font-medium">
                    Summary for <span className="font-bold">{focusedVariable}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border-primary-200 bg-primary-50/85 rounded-md border px-2.5 py-2">
                      <p className="text-primary-800/80 text-[11px]">Initial</p>
                      <p className="text-primary-950 text-sm font-semibold">
                        {formatMetricValue(selectedStats.initial)}
                      </p>
                    </div>
                    <div className="border-primary-200 bg-primary-50/85 rounded-md border px-2.5 py-2">
                      <p className="text-primary-800/80 text-[11px]">Final</p>
                      <p className="text-primary-950 text-sm font-semibold">
                        {formatMetricValue(selectedStats.final)}
                      </p>
                    </div>
                    <div className="border-primary-200 bg-primary-50/85 rounded-md border px-2.5 py-2">
                      <p className="text-primary-800/80 text-[11px]">Min</p>
                      <p className="text-primary-950 text-sm font-semibold">
                        {formatMetricValue(selectedStats.min)}
                      </p>
                    </div>
                    <div className="border-primary-200 bg-primary-50/85 rounded-md border px-2.5 py-2">
                      <p className="text-primary-800/80 text-[11px]">Max</p>
                      <p className="text-primary-950 text-sm font-semibold">
                        {formatMetricValue(selectedStats.max)}
                      </p>
                    </div>
                    <div className="border-primary-200 bg-primary-50/85 col-span-2 rounded-md border px-2.5 py-2">
                      <p className="text-primary-800/80 text-[11px]">Mean</p>
                      <p className="text-primary-950 text-sm font-semibold">
                        {formatMetricValue(selectedStats.mean)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="border-primary-200 bg-primary-50/80 flex flex-col rounded-lg border p-4">
            <div className="min-h-[320px] flex-1">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 16, left: 4, bottom: 4 }}
                    accessibilityLayer={false}
                    className="[&_.recharts-surface:focus]:outline-none [&_.recharts-wrapper:focus]:outline-none"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-primary-200)" />
                    <XAxis
                      dataKey="step"
                      interval="preserveStartEnd"
                      minTickGap={28}
                      tick={{ fontSize: 11, fill: 'var(--color-primary-700)' }}
                      axisLine={{ stroke: 'var(--color-primary-300)' }}
                      tickLine={{ stroke: 'var(--color-primary-300)' }}
                      label={{
                        value: 'Simulation step',
                        position: 'insideBottom',
                        offset: -2,
                        fill: 'var(--color-primary-700)',
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-primary-700)' }}
                      axisLine={{ stroke: 'var(--color-primary-300)' }}
                      tickLine={{ stroke: 'var(--color-primary-300)' }}
                      label={{
                        value: 'Values',
                        angle: -90,
                        position: 'insideLeft',
                        fill: 'var(--color-primary-700)',
                        fontSize: 11,
                      }}
                      width={48}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [formatChartValue(value), name]}
                      labelFormatter={(label: number) => `Step ${label}`}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid var(--color-primary-300)',
                        background: 'var(--color-primary-50)',
                        fontSize: 12,
                      }}
                    />
                    {selectedVariables.map((varName) => {
                      const globalIdx = variableNames.indexOf(varName)
                      const color = getVariableColor(globalIdx)
                      return (
                        <Line
                          key={varName}
                          type="monotone"
                          dataKey={varName}
                          name={varName}
                          stroke={color}
                          strokeWidth={focusedVariable === varName ? 3 : 2}
                          strokeOpacity={focusedVariable && focusedVariable !== varName ? 0.4 : 1}
                          dot={false}
                          activeDot={{
                            r: 4,
                            onClick: () => setFocusedVariable(varName),
                            cursor: 'pointer',
                            style: { outline: 'none' },
                          }}
                          className="pointer-events-auto cursor-pointer transition-opacity duration-300"
                          style={{ cursor: 'pointer', outline: 'none' }}
                          onClick={() => setFocusedVariable(varName)}
                        />
                      )
                    })}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-primary-800/80 flex h-full items-center justify-center text-sm">
                  Select one or more variables to visualize their time series.
                </div>
              )}
            </div>
          </section>
        </div>

        <details className="border-primary-200 bg-primary-50/80 rounded-lg border p-3">
          <summary className="text-primary-900/85 cursor-pointer text-sm font-medium">
            Raw JSON (advanced)
          </summary>
          <pre className="border-primary-200 bg-primary-50 mt-3 max-h-[42vh] overflow-auto rounded-md border p-3 text-xs whitespace-pre">
            {highlightedJson}
          </pre>
        </details>
      </div>
    </section>
  )
}
