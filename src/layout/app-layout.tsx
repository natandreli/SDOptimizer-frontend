import { Outlet } from 'react-router-dom'
import { Header } from '@/components/ui/header'
import { Footer } from '@/components/ui/footer'

import { AnimatedBackground } from '@/components/ui/animated-background'

export const AppLayout = () => {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--color-background)]/80">
      <AnimatedBackground />
      <Header />
      <main className="relative z-10 container mx-auto max-w-7xl flex-1 px-5 py-8 lg:px-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
