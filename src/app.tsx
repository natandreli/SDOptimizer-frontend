import { AppRoutes } from '@/components/controllers/app-routes'
import { GlobalProviders } from '@/contexts/global-providers'

function App() {
  return (
    <GlobalProviders>
      <AppRoutes />
    </GlobalProviders>
  )
}

export default App
