import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { getAllModels } from '@/services/api/models'
import { IconChartDots3, IconUpload } from '@tabler/icons-react'
import { ModelsList } from '@/components/features/models/models-list'
import { UploadForm } from '@/components/features/models/upload-form'

type TabType = 'list' | 'upload'

export const ModelsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const getInitialTab = (): TabType => {
    const tabParam = searchParams.get('tab') as TabType | null
    if (tabParam && ['list', 'upload'].includes(tabParam)) {
      return tabParam
    }
    return 'list'
  }

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab)

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  const { data: models, isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: getAllModels,
  })

  return (
    <div className="space-y-12 pb-12">
      <div className="space-y-1 text-center">
        <p className="text-primary-950 text-3xl font-semibold tracking-tight">Model Management</p>
        <p className="text-primary-900/75 text-sm">
          Upload and manage System Dinamic simulation models
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="border-primary-200/90 border-b pb-4 lg:border-r lg:border-b-0 lg:pr-4 lg:pb-0">
          <nav className="space-y-1" aria-label="Models sections">
            <button
              onClick={() => handleTabChange('list')}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-primary-100 text-primary-900'
                  : 'text-primary-900/70 hover:bg-primary-100/70 hover:text-primary-900'
              }`}
            >
              <IconChartDots3 className="h-4 w-4" />
              All Models {models ? `(${models.length})` : ''}
            </button>
            <button
              onClick={() => handleTabChange('upload')}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-primary-100 text-primary-900'
                  : 'text-primary-900/70 hover:bg-primary-100/70 hover:text-primary-900'
              }`}
            >
              <IconUpload className="h-4 w-4" />
              Upload MDL File
            </button>
          </nav>
        </aside>

        <div>
          {activeTab === 'list' && (
            <ModelsList
              models={models}
              isLoading={isLoading}
              onUploadModel={() => handleTabChange('upload')}
            />
          )}

          {activeTab === 'upload' && <UploadForm onSuccess={() => handleTabChange('list')} />}
        </div>
      </div>
    </div>
  )
}
