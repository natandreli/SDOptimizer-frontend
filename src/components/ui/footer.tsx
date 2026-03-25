import { useQuery } from '@tanstack/react-query'
import { checkApiHealth } from '@/services/api'

export const Footer = () => {
  const { data: apiStatus, isError } = useQuery({
    queryKey: ['api-health'],
    queryFn: checkApiHealth,
    refetchInterval: 30000,
    retry: 1,
  })

  const isApiHealthy = !isError && apiStatus !== undefined

  return (
    <footer className="border-primary-200/70 bg-primary-50/85 relative z-10 w-full border-t px-6 py-4 backdrop-blur-lg lg:px-10">
      <div className="text-primary-900/85 mx-auto flex max-w-7xl items-center justify-between text-sm">
        <p className="font-medium">SDOptimizer © {new Date().getFullYear()}</p>
        <div className="bg-primary-100/90 flex items-center gap-2 rounded-full px-3 py-1.5">
          <div
            className={`h-2 w-2 rounded-full ${isApiHealthy ? 'bg-emerald-500' : 'bg-primary-500'}`}
          />
          <span className="text-primary-900 text-xs font-medium">
            {isApiHealthy ? 'API Connected' : 'API Offline'}
          </span>
        </div>
      </div>
    </footer>
  )
}
