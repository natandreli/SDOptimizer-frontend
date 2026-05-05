import { Button } from '@/components/ui/button'
import { useModal } from '@/hooks/use-modal'
import { deleteModel } from '@/services/api/models'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

type DeleteModelModalProps = {
  modelId: string
  modelFileName: string
}

export const DeleteModelModal = ({ modelId, modelFileName }: DeleteModelModalProps) => {
  const modal = useModal()
  const toast = useToast()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deleteModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      toast.success('Model deleted successfully')
      modal.close()
    },
    onError: () => {
      toast.error('Failed to delete model')
    },
  })

  return (
    <div className="space-y-4">
      <h3 className="text-primary-950 text-lg font-semibold">Delete Model</h3>
      <p className="text-primary-900/75 text-sm">
        Are you sure you want to delete <strong>{modelFileName}</strong> model? This action cannot
        be undone.
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="grey" onClick={() => modal.close()} disabled={deleteMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="error"
          onClick={() => {
            deleteMutation.mutate(modelId)
          }}
          isLoading={deleteMutation.isPending}
        >
          Delete
        </Button>
      </div>
    </div>
  )
}
