import { useMemo } from 'react'
import { IconAward, IconClock, IconEye, IconHash, IconMedal, IconTrophy } from '@tabler/icons-react'
import type { OptimizationResult } from '@/services/api/models/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { OptimizationExport } from '@/components/features/optimization/optimization-export'

type OptimizationBatchResultsTableProps = {
  results: OptimizationResult[]
  bestOptimizationNumber: number | null
  totalExecutionTimeMs: number
  modelName: string
  onViewResult: (result: OptimizationResult, rank: number) => void
}

const formatNumber = (value: number, maxDecimals: number = 4) => {
  if (!Number.isFinite(value)) {
    return '-'
  }

  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })
}

const formatRank = (rank: number) => {
  const suffix =
    rank % 100 >= 11 && rank % 100 <= 13
      ? 'th'
      : rank % 10 === 1
        ? 'st'
        : rank % 10 === 2
          ? 'nd'
          : rank % 10 === 3
            ? 'rd'
            : 'th'

  return `${rank}${suffix}`
}

const getRankStyle = (rank: number, isTie: boolean) => {
  if (isTie) {
    return {
      row: 'bg-primary-50/75',
      border: 'border-primary-200',
      rank: 'border-primary-200 bg-primary-100 text-primary-800',
      run: 'border-primary-200 bg-primary-50 text-primary-800',
      score: 'border-emerald-100 bg-emerald-50/65 text-emerald-800',
      icon: <IconMedal className="text-primary-500 h-4 w-4" />,
    }
  }

  if (rank === 1) {
    return {
      row: 'bg-amber-50/75',
      border: 'border-amber-200',
      rank: 'border-amber-300 bg-amber-100 text-amber-950',
      run: 'border-sky-200 bg-sky-50 text-sky-900',
      score: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      icon: <IconTrophy className="h-4 w-4 text-amber-600" />,
    }
  }

  if (rank === 2) {
    return {
      row: 'bg-sky-50/55',
      border: 'border-sky-200',
      rank: 'border-slate-300 bg-slate-100 text-slate-800',
      run: 'border-indigo-200 bg-indigo-50 text-indigo-900',
      score: 'border-teal-200 bg-teal-50 text-teal-900',
      icon: <IconMedal className="h-4 w-4 text-slate-500" />,
    }
  }

  if (rank === 3) {
    return {
      row: 'bg-orange-50/55',
      border: 'border-orange-200',
      rank: 'border-orange-300 bg-orange-100 text-orange-950',
      run: 'border-violet-200 bg-violet-50 text-violet-900',
      score: 'border-lime-200 bg-lime-50 text-lime-900',
      icon: <IconAward className="h-4 w-4 text-orange-600" />,
    }
  }

  return {
    row: 'bg-primary-50/70',
    border: 'border-primary-200',
    rank: 'border-primary-200 bg-primary-100/70 text-primary-900',
    run: 'border-primary-200 bg-primary-50 text-primary-800',
    score: 'border-emerald-100 bg-emerald-50/65 text-emerald-800',
    icon: null,
  }
}

const formatDuration = (milliseconds?: number) => {
  if (!milliseconds || !Number.isFinite(milliseconds)) {
    return '-'
  }

  if (milliseconds < 1000) {
    return `${milliseconds.toFixed(0)} ms`
  }

  const seconds = milliseconds / 1000
  if (seconds < 60) {
    return `${seconds.toFixed(2)} s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

export const OptimizationBatchResultsTable = ({
  results,
  bestOptimizationNumber,
  totalExecutionTimeMs,
  modelName,
  onViewResult,
}: OptimizationBatchResultsTableProps) => {
  const rankedResults = useMemo(() => {
    const direction = results[0]?.config_summary.direction
    const sortSign = direction === 'minimize' ? 1 : -1
    const scoreTolerance = 1e-9

    const sortedResults = [...results].sort((a, b) => {
      const scoreDiff = (a.best_score - b.best_score) * sortSign
      if (Math.abs(scoreDiff) > scoreTolerance) {
        return scoreDiff
      }
      return a.optimization_number - b.optimization_number
    })

    const allScoresTie =
      sortedResults.length > 1 &&
      sortedResults.every(
        (item) => Math.abs(item.best_score - sortedResults[0].best_score) <= scoreTolerance
      )

    return sortedResults.map((item) => {
      const firstEquivalentIndex = sortedResults.findIndex(
        (other) => Math.abs(other.best_score - item.best_score) <= scoreTolerance
      )
      return {
        result: item,
        rank: allScoresTie ? null : firstEquivalentIndex + 1,
        isTie:
          allScoresTie ||
          sortedResults.some(
            (other) =>
              other.optimization_number !== item.optimization_number &&
              Math.abs(other.best_score - item.best_score) <= scoreTolerance
          ),
      }
    })
  }, [results])

  const hasOnlyTies = rankedResults.length > 0 && rankedResults.every((item) => item.rank === null)

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
              <IconTrophy className="h-4 w-4" />
            </span>
            <h2 className="text-primary-950 text-lg font-semibold">Optimization Batch</h2>
          </div>
          <p className="text-primary-700 mt-1 text-sm">
            {hasOnlyTies
              ? 'All executions tied with the same best score.'
              : 'Ranked from best result to weakest result in this batch.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="border-primary-200 bg-primary-100/45 text-primary-800 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
            <IconHash className="h-3.5 w-3.5" />
            {rankedResults.length.toLocaleString()} runs
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
            <IconClock className="h-3.5 w-3.5" />
            Total {formatDuration(totalExecutionTimeMs)}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
          <thead>
            <tr>
              <th className="text-primary-700 px-3 py-2 text-xs font-semibold tracking-wider uppercase">
                Rank
              </th>
              <th className="text-primary-700 px-3 py-2 text-xs font-semibold tracking-wider uppercase">
                Run
              </th>
              <th className="text-primary-700 px-3 py-2 text-right text-xs font-semibold tracking-wider uppercase">
                Best Score
              </th>
              <th className="text-primary-700 px-3 py-2 text-right text-xs font-semibold tracking-wider uppercase">
                Improvement
              </th>
              <th className="text-primary-700 px-3 py-2 text-right text-xs font-semibold tracking-wider uppercase">
                Time
              </th>
              <th className="text-primary-700 px-3 py-2 text-right text-xs font-semibold tracking-wider uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rankedResults.map(({ result, rank, isTie }) => {
              const displayRank = rank ?? 1
              const style = getRankStyle(displayRank, isTie)
              const isBackendBest = result.optimization_number === bestOptimizationNumber

              return (
                <tr key={result.optimization_number}>
                  <td
                    className={cn(
                      'rounded-l-xl border-y border-l px-3 py-3 transition-colors',
                      style.row,
                      style.border
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex min-w-20 items-center justify-center gap-1.5 rounded-full border px-3 py-1 font-mono text-sm font-bold',
                        style.rank
                      )}
                    >
                      {style.icon}
                      {rank === null ? 'Tie' : formatRank(rank)}
                    </span>
                  </td>
                  <td
                    className={cn('border-y px-3 py-3 transition-colors', style.row, style.border)}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-sm font-semibold',
                        style.run
                      )}
                    >
                      <IconHash className="h-3.5 w-3.5" />
                      {result.optimization_number}
                    </span>
                    {isBackendBest && rank !== 1 && rank !== null ? (
                      <span className="ml-2 text-xs font-semibold text-emerald-700">Best</span>
                    ) : null}
                  </td>
                  <td
                    className={cn(
                      'border-y px-3 py-3 text-right transition-colors',
                      style.row,
                      style.border
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-3 py-1 font-mono text-sm font-bold',
                        style.score
                      )}
                    >
                      {formatNumber(result.best_score)}
                    </span>
                  </td>
                  <td
                    className={cn(
                      'border-y px-3 py-3 text-right transition-colors',
                      style.row,
                      style.border
                    )}
                  >
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        result.improvement_percentage > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : result.improvement_percentage < 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-primary-100 text-primary-700'
                      }`}
                    >
                      {formatNumber(result.improvement_percentage, 2)}%
                    </span>
                  </td>
                  <td
                    className={cn(
                      'border-y px-3 py-3 text-right transition-colors',
                      style.row,
                      style.border
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
                      <IconClock className="h-3.5 w-3.5" />
                      {formatDuration(result.execution_time_ms)}
                    </span>
                  </td>
                  <td
                    className={cn(
                      'rounded-r-xl border-y border-r px-3 py-3 transition-colors',
                      style.row,
                      style.border
                    )}
                  >
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={<IconEye className="h-4 w-4" />}
                        onClick={() => onViewResult(result, displayRank)}
                        className="border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-300 hover:bg-sky-100"
                      >
                        View
                      </Button>
                      <OptimizationExport
                        result={result}
                        modelName={modelName}
                        optimizationNumber={result.optimization_number}
                        compact
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
