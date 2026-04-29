import { IconChartDots3 } from '@tabler/icons-react'

type OptimizeEmptyStateProps = {
  isLoadingModels: boolean
  hasModels: boolean
}

export const OptimizeEmptyState = ({ isLoadingModels, hasModels }: OptimizeEmptyStateProps) => {
  if (isLoadingModels) {
    return (
      <section className="text-center">
        <div className="relative mx-auto h-10 w-10">
          <div className="border-primary-200 h-10 w-10 rounded-full border-4"></div>
          <div className="absolute top-0 left-0 h-10 w-10 animate-spin rounded-full border-4 border-transparent border-t-sky-500"></div>
        </div>
        <p className="text-primary-950 mt-4 text-xl font-semibold">Loading models...</p>
        <p className="text-primary-900/75 mt-2 text-sm">
          Preparing available models for optimization.
        </p>
      </section>
    )
  }

  if (!hasModels) {
    return (
      <section className="text-center">
        <IconChartDots3 className="text-primary-300 mx-auto h-12 w-12" />
        <p className="text-primary-950 mt-4 text-xl font-semibold">No models uploaded yet</p>
        <p className="text-primary-900/75 mt-2 text-sm">
          Upload a model first, then run optimization.
        </p>
      </section>
    )
  }

  return (
    <section className="text-center">
      <IconChartDots3 className="text-primary-300 mx-auto h-12 w-12" />
      <p className="text-primary-950 mt-4 text-xl font-semibold">No optimization results yet</p>
      <p className="text-primary-900/75 mt-2 text-sm">
        Configure optimization options and run to see best parameters.
      </p>
    </section>
  )
}
