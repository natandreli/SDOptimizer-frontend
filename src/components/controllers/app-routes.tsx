import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layout/app-layout'
import { HomePage } from '@/pages/home'
import { ModelsPage } from '@/pages/models'
import { SimulationPage } from '@/pages/simulation'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/simulation" element={<SimulationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
