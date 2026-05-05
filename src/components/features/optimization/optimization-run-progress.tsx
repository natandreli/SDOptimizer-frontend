type OptimizeRunProgressProps = {
  progress: number
}

export const OptimizationRunProgress = ({ progress }: OptimizeRunProgressProps) => {
  const normalizedProgress = Math.max(0, Math.min(100, progress))

  return (
    <section className="border-primary-200 bg-primary-50/85 rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-primary-950 text-sm font-semibold">Running optimization...</p>
        <span className="text-primary-800/80 text-xs font-medium">{normalizedProgress}%</span>
      </div>

      <div className="bg-primary-100 h-2 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-sky-500 transition-all duration-300 ease-out"
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>

      <p className="text-primary-800/75 mt-2 text-xs">
        Evaluating parameter combinations to maximize the selected objective.
      </p>
    </section>
  )
}
