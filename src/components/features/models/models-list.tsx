import type { GetModelResponse } from '@/services/api/models/types'
import { IconChartDots3, IconTrash } from '@tabler/icons-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useModal } from '@/hooks/use-modal'
import { ModelDetailsModal } from '@/components/features/models/modals/model-details-modal'
import { deleteModel } from '@/services/api/models'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

type ModelsListProps = {
  models: GetModelResponse[] | undefined
  isLoading: boolean
}

export const ModelsList = ({ models, isLoading }: ModelsListProps) => {
  const modal = useModal()
  const toast = useToast()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deleteModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      toast.success('Model deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete model')
    },
  })

  const handleViewDetails = (modelData: GetModelResponse) => {
    if (!modelData.model) {
      return
    }
    modal.open(<ModelDetailsModal modelId={modelData.model_id} model={modelData.model} />)
  }

  const handleDelete = (modelId: string, modelFileName: string) => {
    modal.open(
      <div className="space-y-4">
        <h3 className="text-primary-950 text-lg font-semibold">Delete Model</h3>
        <p className="text-primary-900/75 text-sm">
          Are you sure you want to delete <strong>{modelFileName}</strong> model? This action cannot
          be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="grey" onClick={() => modal.close()}>
            Cancel
          </Button>
          <Button
            variant="error"
            onClick={() => {
              deleteMutation.mutate(modelId)
              modal.close()
            }}
            isLoading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="border-primary-200 h-10 w-10 rounded-full border-4"></div>
          <div className="absolute top-0 left-0 h-10 w-10 animate-spin rounded-full border-4 border-transparent border-t-sky-500"></div>
        </div>
        <p className="text-primary-900/75 mt-6 text-sm font-medium">Loading models...</p>
      </div>
    )
  }

  if (!models || models.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <div className="bg-primary-100/50 ring-primary-50/50 mb-6 flex h-20 w-20 items-center justify-center rounded-full ring-8">
          <IconChartDots3 className="text-primary-400 h-10 w-10" />
        </div>
        <div className="max-w-xs space-y-2">
          <p className="text-primary-950 text-xl font-bold tracking-tight">
            Your workspace is empty
          </p>
          <p className="text-primary-900/60 text-sm leading-relaxed">
            There are no models available in your repository yet. Use the upload panel to the right
            to add your first Vensim (.mdl) model.
          </p>
        </div>
      </div>
    )
  }

  const formatUploadedAt = (uploadedAt?: string) => {
    if (!uploadedAt) {
      return 'Uploaded: -'
    }

    const date = new Date(uploadedAt)
    if (Number.isNaN(date.getTime())) {
      return 'Uploaded: -'
    }

    return `Uploaded: ${date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }

  const renderModelCard = (modelData: GetModelResponse) => {
    const fileName = modelData.model?.file_name || 'Untitled model'

    return (
      <Card
        key={modelData.model_id}
        className="group border-primary-200 bg-primary-50/95 hover:shadow-primary-900/10 relative cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        onClick={() => handleViewDetails(modelData)}
      >
        <div className="bg-primary-400/10 absolute top-0 right-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full blur-xl" />
        <CardHeader className="relative pb-3">
          <div className="relative flex items-start">
            <div className="min-w-0 flex-1 pr-10" title={fileName}>
              <CardTitle className="text-primary-950 block truncate text-lg font-bold">
                {fileName}
              </CardTitle>
              <CardDescription className="text-primary-700/80 mt-1.5 truncate text-xs">
                {formatUploadedAt(modelData.model?.uploaded_at)}
              </CardDescription>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(modelData.model_id, fileName)
              }}
              className="text-primary-700/70 absolute top-0 right-0 cursor-pointer rounded-lg p-2 transition-all hover:scale-110 hover:text-rose-700"
              aria-label="Delete model"
            >
              <IconTrash className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-300 bg-emerald-100/65 p-3">
              <div className="text-xs font-medium text-emerald-800">Variables</div>
              <div className="text-md mt-1 font-bold text-emerald-950">
                {(modelData.model?.stocks.length || 0) +
                  (modelData.model?.flows.length || 0) +
                  (modelData.model?.parameters.length || 0) +
                  (modelData.model?.auxiliaries.length || 0)}
              </div>
            </div>
            <div className="rounded-lg border border-sky-300 bg-sky-100/70 p-3">
              <div className="text-xs font-medium text-sky-800">Format</div>
              <div className="text-md mt-1 font-bold text-sky-950">
                {modelData.model?.format || '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {models.map(renderModelCard)}
      </div>
    </div>
  )
}
