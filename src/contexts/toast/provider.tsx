import { type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { ToastContext } from '.'
import { toast } from 'sonner'

type ToastProviderProps = {
  children: ReactNode
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const showDefault = (message: ReactNode): string => {
    return toast(message as string) as string
  }

  const showSuccess = (message: ReactNode): string => {
    return toast.success(message as string) as string
  }

  const showError = (message: ReactNode): string => {
    return toast.error(message as string) as string
  }

  const showWarning = (message: ReactNode): string => {
    return toast.warning(message as string) as string
  }

  const showLoading = (message: ReactNode): string => {
    return toast.loading(message as string) as string
  }

  const removeToast = (id: string) => {
    toast.dismiss(id)
  }

  const clearToasts = () => {
    toast.dismiss()
  }

  return (
    <ToastContext.Provider
      value={{
        default: showDefault,
        success: showSuccess,
        error: showError,
        warning: showWarning,
        loading: showLoading,
        remove: removeToast,
        clear: clearToasts,
      }}
    >
      <Toaster
        position="bottom-right"
        richColors
        theme="light"
        toastOptions={{
          className: 'font-medium',
        }}
      />
      {children}
    </ToastContext.Provider>
  )
}
