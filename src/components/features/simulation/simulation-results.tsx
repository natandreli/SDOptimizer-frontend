import { useMemo, useState } from 'react'
import { IconChartLine } from '@tabler/icons-react'
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

type SimulationResultsProps = {
  result: SimulationResult
}

const JSON_TOKEN_REGEX =
  /"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?=\s*:)|"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\btrue\b|\bfalse\b|\bnull\b/g

const getJsonTokenClass = (token: string, json: string, matchEnd: number): string => {
  if (token === 'true' || token === 'false') return 'text-emerald-700'
  if (token === 'null') return 'text-primary-500'
  if (!Number.isNaN(Number(token))) return 'text-violet-700'

  if (token.startsWith('"')) {
    let pointer = matchEnd
    while (pointer < json.length && /\s/.test(json[pointer])) {
      pointer += 1
    }

    if (json[pointer] === ':') return 'text-sky-700'
    return 'text-amber-700'
  }

  return 'text-primary-900'
}

const renderHighlightedJson = (json: string) => {
  const chunks: Array<{ value: string; className: string; key: string }> = []
  let lastIndex = 0
  let tokenIndex = 0

  for (const match of json.matchAll(JSON_TOKEN_REGEX)) {
    if (match.index === undefined) continue

    if (match.index > lastIndex) {
      chunks.push({
        value: json.slice(lastIndex, match.index),
        className: 'text-primary-900',
        key: `plain-${tokenIndex}`,
      })
    }

    const token = match[0]
    const matchEnd = match.index + token.length
    chunks.push({
      value: token,
      className: getJsonTokenClass(token, json, matchEnd),
      key: `token-${tokenIndex}`,
    })

    lastIndex = matchEnd
    tokenIndex += 1
  }

  if (lastIndex < json.length) {
    chunks.push({
      value: json.slice(lastIndex),
      className: 'text-primary-900',
      key: `plain-tail-${tokenIndex}`,
    })
  }

  return chunks.map((chunk) => (
    <span key={chunk.key} className={chunk.className}>
      {chunk.value}
    </span>
  ))
}

const formatMetricValue = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '-'
  }

  return value.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

const formatChartValue = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '-'
  }

  return value.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

export const SimulationResults = ({ result }: SimulationResultsProps) => {
  const [selectedVariable, setSelectedVariable] = useState('')

  const variableNames = useMemo(() => Object.keys(result.time_series), [result])
  const firstSeries = variableNames.length > 0 ? result.time_series[variableNames[0]] : undefined

  const effectiveSelectedVariable =
    selectedVariable && variableNames.includes(selectedVariable)
      ? selectedVariable
      : variableNames[0] || ''

  const chartData = useMemo(() => {
    if (!effectiveSelectedVariable) {
      return []
    }

    const selectedSeries = result.time_series[effectiveSelectedVariable] || []
    return selectedSeries.map((value, index) => ({
      step: index,
      value,
    }))
  }, [result, effectiveSelectedVariable])

  const selectedStats = effectiveSelectedVariable
    ? result.summary_stats[effectiveSelectedVariable]
    : undefined

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
                label="Variable"
                value={effectiveSelectedVariable}
                options={variableNames.map((name) => ({ value: name, label: name }))}
                onChange={setSelectedVariable}
                disabled={variableNames.length === 0}
                placeholder="Select a variable..."
              />

              {selectedStats && (
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
              )}
            </div>
          </section>

          <section className="border-primary-200 bg-primary-50/80 rounded-lg border p-4">
            <div className="h-[320px]">
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
                        value: effectiveSelectedVariable || 'Value',
                        angle: -90,
                        position: 'insideLeft',
                        fill: 'var(--color-primary-700)',
                        fontSize: 11,
                      }}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        formatChartValue(value),
                        effectiveSelectedVariable,
                      ]}
                      labelFormatter={(label: number) => `Step ${label}`}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid var(--color-primary-300)',
                        background: 'var(--color-primary-50)',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={effectiveSelectedVariable || 'value'}
                      stroke="var(--color-sky-500)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-primary-800/80 flex h-full items-center justify-center text-sm">
                  Select a variable to visualize its time series.
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
