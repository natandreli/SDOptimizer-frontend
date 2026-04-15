import { Outlet } from 'react-router-dom'
import { Header } from '@/components/ui/header'
import { Footer } from '@/components/ui/footer'
import { useCookieGuard } from '@/hooks/use-cookie-guard'
import { Button } from '@/components/ui/button'

import { AnimatedBackground } from '@/components/ui/animated-background'

export const AppLayout = () => {
  const { status, isCookieSupported, recheck } = useCookieGuard()

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--color-background)]/80">
      <AnimatedBackground />
      <Header />
      {status !== 'checking' && !isCookieSupported && (
        <div className="relative z-20 container mx-auto mt-3 max-w-7xl px-5 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3">
            <p className="text-sm text-rose-900">
              Cookies are blocked. SDOptimizer needs cookies enabled to keep your session and data.
            </p>
            <Button type="button" size="sm" variant="error" onClick={recheck}>
              Recheck cookies
            </Button>
          </div>
        </div>
      )}
      <main className="relative z-10 container mx-auto max-w-7xl flex-1 px-5 py-8 lg:px-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
