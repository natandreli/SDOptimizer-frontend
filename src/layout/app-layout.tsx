import { Outlet } from 'react-router-dom'
import { Header } from '@/components/ui/header'
import { Footer } from '@/components/ui/footer'

import { AnimatedBackground } from '@/components/ui/animated-background'
import { CookieConsent } from '@/components/ui/cookie-consent'

export const AppLayout = () => {
  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-[var(--color-background)]/80">
      <AnimatedBackground />
      <Header />
      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto w-full">
        <main className="container mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col px-5 py-6 sm:py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
      <Footer />
      <CookieConsent />
    </div>
  )
}
