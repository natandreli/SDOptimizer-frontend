import { useMemo } from 'react'
import {
  IconArrowDown,
  IconArrowUp,
  IconChartLine,
  IconEqual,
  IconSettings,
  IconTable,
  IconTrendingUp,
} from '@tabler/icons-react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { OptimizationResult } from '@/services/api/models/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OptimizationExport } from './optimization-export'

type OptimizationResultsProps = {
  result: OptimizationResult
  modelName: string
}

const formatNumber = (value: number, maxDecimals: number = 6) => {
  if (!Number.isFinite(value)) {
    return '-'
  }

  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })
}

const PARAMETER_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#ec4899',
  '#14b8a6',
  '#84cc16',
]

export const OptimizationResults = ({ result, modelName }: OptimizationResultsProps) => {
  const improved = result.improvement_percentage > 0
  const unchanged = Math.abs(result.improvement_percentage) < 0.001

  const rewardHistoryData = useMemo(
    () =>
      result.history.rewards.map((reward, index) => ({
        run: index + 1,
        reward,
        bestReward: result.history.best_rewards[index] ?? reward,
      })),
    [result]
  )

  const parameterNames = useMemo(
    () => Object.keys(result.best_parameters),
    [result.best_parameters]
  )

  const parameterEvolutionData = useMemo(() => {
    if (!result.history.parameters || result.history.parameters.length === 0) {
      return []
    }

    return result.history.parameters.map((paramValues, index) => {
      const point: Record<string, number> = { run: index + 1 }
      parameterNames.forEach((name, paramIndex) => {
        point[name] = paramValues[paramIndex] ?? 0
      })
      return point
    })
  }, [result.history.parameters, parameterNames])

  const sortedParameterChanges = useMemo(
    () =>
      Object.entries(result.parameter_changes).sort(
        ([, a], [, b]) => Math.abs(b.change_percentage) - Math.abs(a.change_percentage)
      ),
    [result.parameter_changes]
  )

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <OptimizationExport result={result} modelName={modelName} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          className={`relative overflow-hidden lg:col-span-1 ${
            unchanged
              ? 'border-primary-300 bg-primary-50/90'
              : improved
                ? 'border-emerald-300 bg-emerald-50/90'
                : 'border-red-300 bg-red-50/90'
          }`}
        >
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <span
                className={`text-xs font-semibold tracking-widest uppercase ${
                  unchanged ? 'text-primary-600' : improved ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                Improvement
              </span>

              <div className="mt-2 flex items-center">
                {unchanged ? (
                  <IconEqual className="text-primary-500 h-6 w-6" />
                ) : improved ? (
                  <IconArrowUp className="h-6 w-6 text-emerald-600" />
                ) : (
                  <IconArrowDown className="h-6 w-6 text-red-600" />
                )}
                <span
                  className={`text-2xl font-extrabold tracking-tight ${
                    unchanged ? 'text-primary-800' : improved ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {formatNumber(Math.abs(result.improvement_percentage), 2)}%
                </span>
              </div>

              <p
                className={`mt-2 text-xs ${
                  unchanged ? 'text-primary-600' : improved ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {unchanged
                  ? 'No significant change detected'
                  : improved
                    ? 'Performance improved over baseline'
                    : 'Performance decreased from baseline'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <span className="text-primary-700/80 text-xs font-semibold tracking-widest uppercase">
                Baseline Score
              </span>
              <p className="text-primary-950 mt-2 text-2xl font-bold tracking-tight">
                {formatNumber(result.initial_score, 4)}
              </p>
              <p className="text-primary-600 mt-2 text-xs">Score with initial parameters</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/60 bg-emerald-50/40">
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <span className="text-xs font-semibold tracking-widest text-emerald-700/80 uppercase">
                Best Score
              </span>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-800">
                {formatNumber(result.best_score, 4)}
              </p>
              <p className="mt-2 text-xs text-emerald-600">
                Score after {result.history.rewards.length} optimization runs
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <IconSettings className="h-4 w-4" />
            Configuration Used
          </CardTitle>
          <CardDescription>Summary of the optimization settings for this run.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="border-primary-200 bg-primary-50/80 rounded-lg border px-3 py-2.5">
              <p className="text-primary-600 text-[10px] font-semibold tracking-widest uppercase">
                Target Variable
              </p>
              <p className="text-primary-950 mt-1 truncate font-mono text-sm font-semibold">
                {result.config_summary.target_variable}
              </p>
            </div>
            <div className="border-primary-200 bg-primary-50/80 rounded-lg border px-3 py-2.5">
              <p className="text-primary-600 text-[10px] font-semibold tracking-widest uppercase">
                Statistic
              </p>
              <p className="text-primary-950 mt-1 text-sm font-semibold capitalize">
                {result.config_summary.statistic}
              </p>
            </div>
            <div className="border-primary-200 bg-primary-50/80 rounded-lg border px-3 py-2.5">
              <p className="text-primary-600 text-[10px] font-semibold tracking-widest uppercase">
                Direction
              </p>
              <p className="text-primary-950 mt-1 text-sm font-semibold capitalize">
                {result.config_summary.direction}
              </p>
            </div>
            <div className="border-primary-200 bg-primary-50/80 rounded-lg border px-3 py-2.5">
              <p className="text-primary-600 text-[10px] font-semibold tracking-widest uppercase">
                Max Runs
              </p>
              <p className="text-primary-950 mt-1 text-sm font-semibold">
                {result.config_summary.max_runs}
              </p>
            </div>
            <div className="border-primary-200 bg-primary-50/80 rounded-lg border px-3 py-2.5">
              <p className="text-primary-600 text-[10px] font-semibold tracking-widest uppercase">
                Epsilon
              </p>
              <p className="text-primary-950 mt-1 font-mono text-sm font-semibold">
                {result.config_summary.epsilon}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <IconTable className="h-4 w-4" />
            Parameter Comparison
          </CardTitle>
          <CardDescription>Before vs. after values with change percentage.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-primary-200 overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-primary-100/50">
                <tr>
                  <th className="text-primary-700 px-4 py-3 text-xs font-semibold tracking-wider uppercase">
                    Parameter
                  </th>
                  <th className="text-primary-700 px-4 py-3 text-right text-xs font-semibold tracking-wider uppercase">
                    Before
                  </th>
                  <th className="text-primary-700 px-4 py-3 text-right text-xs font-semibold tracking-wider uppercase">
                    After
                  </th>
                  <th className="text-primary-700 px-4 py-3 text-right text-xs font-semibold tracking-wider uppercase">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="divide-primary-200 divide-y">
                {sortedParameterChanges.map(([name, change]) => {
                  const isPositive = change.change_percentage > 0.001
                  const isNegative = change.change_percentage < -0.001
                  const isNeutral = !isPositive && !isNegative

                  return (
                    <tr key={name} className="hover:bg-primary-50/40 transition-colors">
                      <td className="text-primary-900 px-4 py-3 font-mono text-sm font-medium tracking-wide">
                        {name}
                      </td>
                      <td className="text-primary-800 px-4 py-3 text-right font-mono text-sm">
                        {formatNumber(change.initial_value, 6)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-emerald-800">
                        {formatNumber(change.optimized_value, 6)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isNeutral
                              ? 'bg-primary-100 text-primary-700'
                              : isPositive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isPositive && <IconArrowUp className="h-3 w-3" />}
                          {isNegative && <IconArrowDown className="h-3 w-3" />}
                          {isNeutral && <IconEqual className="h-3 w-3" />}
                          {formatNumber(Math.abs(change.change_percentage), 2)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <IconChartLine className="h-4 w-4" />
            Reward History
          </CardTitle>
          <CardDescription>Reward obtained per run and best reward so far.</CardDescription>
        </CardHeader>
        <CardContent>
          <div id="reward-history-chart" className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={rewardHistoryData}
                margin={{ top: 10, right: 16, left: 4, bottom: 24 }}
                accessibilityLayer={false}
                className="[&_.recharts-surface:focus]:outline-none [&_.recharts-wrapper:focus]:outline-none"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-primary-200)" />
                <XAxis
                  dataKey="run"
                  interval="preserveStartEnd"
                  minTickGap={28}
                  tick={{ fontSize: 11, fill: 'var(--color-primary-700)' }}
                  axisLine={{ stroke: 'var(--color-primary-300)' }}
                  tickLine={{ stroke: 'var(--color-primary-300)' }}
                  label={{
                    value: 'Run',
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
                  tickFormatter={(value: number) => formatNumber(value, 2)}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [formatNumber(value, 6), name]}
                  labelFormatter={(label: number) => `Run ${label}`}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid var(--color-primary-300)',
                    background: 'var(--color-primary-50)',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                <Line
                  type="monotone"
                  dataKey="reward"
                  name="Reward"
                  stroke="var(--color-sky-500)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="bestReward"
                  name="Best Reward"
                  stroke="var(--color-emerald-600)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {parameterEvolutionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <IconTrendingUp className="h-4 w-4" />
              Parameter Evolution
            </CardTitle>
            <CardDescription>
              How each parameter changed across optimization iterations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div id="parameter-evolution-chart" className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={parameterEvolutionData}
                  margin={{ top: 10, right: 16, left: 4, bottom: 24 }}
                  accessibilityLayer={false}
                  className="[&_.recharts-surface:focus]:outline-none [&_.recharts-wrapper:focus]:outline-none"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-primary-200)" />
                  <XAxis
                    dataKey="run"
                    interval="preserveStartEnd"
                    minTickGap={28}
                    tick={{ fontSize: 11, fill: 'var(--color-primary-700)' }}
                    axisLine={{ stroke: 'var(--color-primary-300)' }}
                    tickLine={{ stroke: 'var(--color-primary-300)' }}
                    label={{
                      value: 'Iteration',
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
                    tickFormatter={(value: number) => formatNumber(value, 2)}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [formatNumber(value, 6), name]}
                    labelFormatter={(label: number) => `Iteration ${label}`}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid var(--color-primary-300)',
                      background: 'var(--color-primary-50)',
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                  {parameterNames.map((name, index) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      name={name}
                      stroke={PARAMETER_COLORS[index % PARAMETER_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
