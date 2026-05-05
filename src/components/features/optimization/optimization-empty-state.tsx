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
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="bg-primary-100/60 text-primary-400 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        {isLoadingModels ? (
          <IconLoader2 className="h-8 w-8 animate-spin" />
        ) : !hasModels ? (
          <IconSettings className="h-8 w-8" />
        ) : (
          <IconChartLine className="h-8 w-8" />
        )}
      </div>

      <h3 className="text-primary-950 mb-2 text-xl font-semibold">
        {isLoadingModels
          ? 'Loading workspace...'
          : !hasModels
            ? 'No Models Available'
            : 'No Results Yet'}
      </h3>

      <p className="text-primary-500 max-w-sm text-sm leading-relaxed">
        {isLoadingModels
          ? 'Please wait while we load your models.'
          : !hasModels
            ? 'Upload a System Dynamics model first to run an optimization.'
            : 'Select a model and configure the target variables to run the optimization.'}
      </p>
    </div>
  )
}
