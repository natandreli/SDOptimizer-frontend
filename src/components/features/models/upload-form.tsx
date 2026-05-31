import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadMdlModel } from '@/services/api/models'
import { IconUpload, IconCloudUpload, IconFileText, IconX } from '@tabler/icons-react'
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
    let candidateName = `${baseName}-copy${extension}`

    while (existingNames.has(candidateName.toLowerCase())) {
      attempt += 1
      candidateName = `${baseName}-copy-${attempt}${extension}`
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
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`group relative flex min-h-[130px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-all duration-200 ${
            dragActive
              ? 'border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-500/10'
              : file
                ? 'border-solid border-emerald-400 bg-emerald-50/60'
                : 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-400 hover:bg-emerald-50/70'
          }`}
        >
          <input
            type="file"
            onChange={handleChange}
            onClick={(e) => {
              ;(e.target as HTMLInputElement).value = ''
            }}
            accept=".mdl"
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          {file && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setFile(null)
              }}
              className="absolute top-2 right-2 z-10 flex rounded-lg p-1 text-emerald-600/70 transition-all hover:scale-110 hover:text-rose-500"
              aria-label="Clear file"
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
          <div className="pointer-events-none flex flex-col items-center justify-center space-y-2">
            {file ? (
              <IconFileText className="h-9 w-9 text-emerald-500" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-100/80 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-110 group-hover:border-emerald-200 group-hover:shadow-md">
                <IconCloudUpload className="h-7 w-7 text-emerald-500 transition-transform duration-300 group-hover:scale-105" />
              </div>
            )}
            <div className="max-w-[200px]">
              <p className="truncate text-xs font-semibold text-emerald-800">
                {file ? file.name : 'Drop file here or click to browse'}
              </p>
              <p className="mt-0.5 text-[10px] text-emerald-600/70">
                {file ? formatFileSize(file.size) : 'Supports .mdl files'}
              </p>
            </div>
          </div>
        </div>

        {/* Full-width upload button */}
        <Button
          type="submit"
          variant="success"
          icon={<IconUpload className="h-4 w-4" />}
          isLoading={uploadMutation.isPending}
          disabled={!file}
          className="w-full"
        >
          Upload MDL File
        </Button>
      </form>
    </div>
  )
}
