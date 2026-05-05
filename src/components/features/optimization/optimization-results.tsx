import { useMemo } from 'react'
import { IconTrophy } from '@tabler/icons-react'
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
import { CardDescription, CardTitle } from '@/components/ui/card'

type OptimizationResultsProps = {
  result: OptimizationResult
}

const formatNumber = (value: number, maxDecimals: number = 6) => {
  if (!Number.isFinite(value)) {
    return '-'
  }

  return value.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })
}

export const OptimizationResults = ({ result }: OptimizationResultsProps) => {
  const historyData = useMemo(
    () =>
      result.history.rewards.map((reward, index) => ({
        run: index + 1,
        reward,
        bestReward: result.history.best_rewards[index] ?? reward,
      })),
    [result]
  )

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <CardTitle className="inline-flex items-center gap-2">
          <IconTrophy className="h-4 w-4" />
          Optimization Results
        </CardTitle>
        <CardDescription>Best score, best parameter set and reward history.</CardDescription>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="border-primary-200 bg-primary-50/85 rounded-lg border px-3 py-2">
          <p className="text-primary-800/80 text-xs font-medium">Best Score</p>
          <p className="text-primary-950 mt-1 text-xl font-bold">
            {formatNumber(result.best_score, 6)}
          </p>
        </div>
        <div className="border-primary-200 bg-primary-50/85 rounded-lg border px-3 py-2">
          <p className="text-primary-800/80 text-xs font-medium">Evaluated Runs</p>
          <p className="text-primary-950 mt-1 text-xl font-bold">{result.history.rewards.length}</p>
        </div>
      </div>

      <section className="border-primary-200 bg-primary-50/80 rounded-lg border p-4">
        <p className="text-primary-950 mb-3 text-lg font-semibold">Best Parameters</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries(result.best_parameters).map(([name, value]) => (
            <div
              key={name}
              className="border-primary-200 bg-primary-50/85 rounded-md border px-3 py-2"
            >
              <p className="text-primary-800/80 truncate text-xs font-medium" title={name}>
                {name}
              </p>
              <p className="text-primary-950 mt-1 text-sm font-semibold">
                {formatNumber(value, 6)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-primary-200 bg-primary-50/80 rounded-lg border p-4">
        <p className="text-primary-950 mb-3 text-lg font-semibold">Reward History</p>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={historyData}
              margin={{ top: 10, right: 16, left: 4, bottom: 4 }}
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
              <Legend wrapperStyle={{ fontSize: 12 }} />
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
      </section>
    </section>
  )
}
