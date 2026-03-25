import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { ToastProvider } from '@/contexts/toast/provider'
import { ModalProvider } from '@/contexts/modal/provider'
import { BrowserRouter } from 'react-router-dom'

type GlobalProvidersProps = {
  children: ReactNode
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
    },
  },
})

export const GlobalProviders = ({ children }: GlobalProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <ModalProvider>{children}</ModalProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
