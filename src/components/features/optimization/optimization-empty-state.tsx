import { IconChartLine, IconLoader2, IconSettings } from '@tabler/icons-react'

type OptimizationEmptyStateProps = {
  isLoadingModels: boolean
  hasModels: boolean
}

export const OptimizationEmptyState = ({
  isLoadingModels,
  hasModels,
}: OptimizationEmptyStateProps) => {
  return (
    <div className="border-primary-100 flex min-h-[400px] flex-col items-center justify-center rounded-xl border bg-white/50 p-8 text-center backdrop-blur-sm">
      <div className="bg-primary-50 text-primary-500 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
        {isLoadingModels ? (
          <IconLoader2 className="h-8 w-8 animate-spin" />
        ) : !hasModels ? (
          <IconSettings className="h-8 w-8 opacity-50" />
        ) : (
          <IconChartLine className="h-8 w-8 opacity-50" />
        )}
      </div>

      <h3 className="text-primary-950 mb-2 text-lg font-semibold">
        {isLoadingModels
          ? 'Loading workspace...'
          : !hasModels
            ? 'No Models Available'
            : 'No Results Yet'}
      </h3>

      <p className="text-primary-600 max-w-sm text-sm">
        {isLoadingModels
          ? 'Please wait while we load your models.'
          : !hasModels
            ? 'Upload a System Dynamics model first to run an optimization.'
            : 'Select a model and configure the target variables to run the hyperparameter optimization.'}
      </p>
    </div>
  )
}
