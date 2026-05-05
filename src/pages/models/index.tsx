import { useQuery } from '@tanstack/react-query'
import { getAllModels } from '@/services/api/models'
import { IconUpload } from '@tabler/icons-react'
import { ModelsList } from '@/components/features/models/models-list'
import { UploadForm } from '@/components/features/models/upload-form'

export const ModelsPage = () => {
  const {
    data: models,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['models'],
    queryFn: getAllModels,
  })

  return (
    <div className="space-y-8">
      <section className="space-y-1 text-center">
        <p className="text-primary-950 text-3xl font-semibold tracking-tight">Model Management</p>
        <p className="text-primary-900/75 mt-1 text-sm">
          Upload and manage System Dinamic simulation models
        </p>
      </section>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_350px]">
        <div className="order-2 lg:order-1">
          <div className="h-full p-1 backdrop-blur-sm">
            <ModelsList models={models} isLoading={isLoading} />
          </div>
        </div>

        <aside className="order-1 space-y-6 lg:order-2">
          <div className="border-primary-100 rounded-xl border bg-white/30 p-5 text-sm">
            <h4 className="text-primary-900 mb-2 font-semibold">Workspace Info</h4>
            <div className="space-y-3">
              <div className="border-primary-100 flex justify-between border-b pb-2">
                <span className="text-primary-800/70">Total Models</span>
                <span className="text-primary-950 font-bold">{models?.length ?? 0}</span>
              </div>
              <p className="text-primary-800/60 leading-relaxed italic">
                Models must be in Vensim (.mdl) format to be compatible with the reinforcement
                learning engine.
              </p>
            </div>
          </div>

          <div className="border-primary-200 bg-primary-50/50 rounded-xl border p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="bg-primary-100 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">
                <IconUpload size={18} />
              </div>
              <p className="text-primary-950 font-bold">Quick Upload</p>
            </div>
            <UploadForm onSuccess={() => refetch()} />
          </div>
        </aside>
      </div>
    </div>
  )
}
