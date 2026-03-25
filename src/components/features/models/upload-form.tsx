import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadMdlModel } from '@/services/api/models'
import { IconUpload, IconFileText, IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useModal } from '@/hooks/use-modal'
import type { GetModelResponse } from '@/services/api/models/types'
import type { AxiosError } from 'axios'

type UploadFormProps = {
  onSuccess: () => void
}

export const UploadForm = ({ onSuccess }: UploadFormProps) => {
  const toast = useToast()
  const modal = useModal()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const getExistingFileNames = (): Set<string> => {
    const models = queryClient.getQueryData<GetModelResponse[]>(['models']) || []
    return new Set(
      models
        .map((modelData) => modelData.model?.file_name?.toLowerCase())
        .filter((name): name is string => Boolean(name))
    )
  }

  const createCopyFileWithUniqueName = (originalFile: File): File => {
    const existingNames = getExistingFileNames()
    const extensionIndex = originalFile.name.lastIndexOf('.')
    const hasExtension = extensionIndex > 0
    const baseName = hasExtension ? originalFile.name.slice(0, extensionIndex) : originalFile.name
    const extension = hasExtension ? originalFile.name.slice(extensionIndex) : ''

    let attempt = 1
    let candidateName = `${baseName}-copia${extension}`

    while (existingNames.has(candidateName.toLowerCase())) {
      attempt += 1
      candidateName = `${baseName}-copia-${attempt}${extension}`
    }

    return new File([originalFile], candidateName, {
      type: originalFile.type,
      lastModified: originalFile.lastModified,
    })
  }

  const submitFile = (selectedFile: File) => {
    uploadMutation.mutate(selectedFile)
  }

  const uploadMutation = useMutation({
    mutationFn: uploadMdlModel,
    onSuccess: () => {
      toast.success('Model uploaded successfully')
      queryClient.invalidateQueries({ queryKey: ['models'] })
      setFile(null)
      onSuccess()
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      const statusCode = error.response?.status
      const detail = error.response?.data?.detail

      if (statusCode === 422) {
        toast.error(detail || 'Invalid MDL file. Please verify format, structure, and extension.')
        return
      }

      if (statusCode === 400) {
        toast.error(detail || 'File validation failed. Please review the selected file.')
        return
      }

      toast.error(detail || 'Failed to upload model')
    },
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      return
    }

    const existingNames = getExistingFileNames()
    const isDuplicate = existingNames.has(file.name.toLowerCase())

    if (!isDuplicate) {
      submitFile(file)
      return
    }

    modal.open(
      <div className="w-[460px] space-y-5">
        <h3 className="text-primary-950 text-lg font-semibold">Duplicate file name detected</h3>
        <p className="text-primary-900/80 text-sm">
          A model named <strong>{file.name}</strong> already exists. Do you want to replace it or
          keep both files?
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="success"
            onClick={() => {
              modal.close()
              submitFile(createCopyFileWithUniqueName(file))
            }}
          >
            Keep both
          </Button>
          <Button
            variant="alt"
            onClick={() => {
              modal.close()
              submitFile(file)
            }}
          >
            Replace
          </Button>
        </div>
      </div>
    )
  }

  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`
    }

    if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`
    }

    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="text-primary-900/75 mt-1 text-sm">
          Upload a System Dinamic simulation model in MDL format to add it to your model library.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative rounded-lg border-2 p-12 text-center transition-all duration-200 ${
            dragActive
              ? 'border-primary-400 bg-primary-100/70 shadow-primary-500/15 border-dashed shadow-md'
              : file
                ? 'border-primary-300 bg-primary-50/85 border-solid'
                : 'border-primary-300 bg-primary-50/70 hover:border-primary-400 hover:bg-primary-100/70 hover:shadow-primary-500/10 border-dashed hover:shadow-sm'
          }`}
        >
          <input
            type="file"
            onChange={handleChange}
            accept=".mdl"
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          {file ? (
            <IconFileText className="text-primary-700 mx-auto h-12 w-12" />
          ) : (
            <IconUpload className="text-primary-500 mx-auto h-12 w-12" />
          )}
          <p className="text-primary-950 mt-4 text-sm font-medium">
            {file ? file.name : 'Drop your file here, or click to browse'}
          </p>
          {file && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setFile(null)
              }}
              className="text-primary-700/80 absolute top-2 right-2 flex flex-shrink-0 rounded-lg p-1 transition-all hover:scale-110 hover:text-rose-600"
              aria-label="Clear file"
            >
              <IconX className="h-5 w-5 cursor-pointer" />
            </button>
          )}
          <p className="text-primary-800/75 mt-2 min-h-4 text-xs">
            {file ? `${formatFileSize(file.size)}` : 'Supports .mdl files'}
          </p>
        </div>
        <div className="mt-10 flex justify-end">
          <Button
            type="submit"
            variant="success"
            isLoading={uploadMutation.isPending}
            disabled={!file}
          >
            Upload MDL File
          </Button>
        </div>
      </form>
    </div>
  )
}
