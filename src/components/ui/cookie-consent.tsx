import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Link, useLocation } from 'react-router-dom'

export const CookieConsent = () => {
  const location = useLocation()
  const isTermsPage = location.pathname === '/terms-and-conditions'

  const [isVisible, setIsVisible] = useState(() => {
    try {
      const hasConsented = localStorage.getItem('sdo-cookie-consent')
      return hasConsented !== 'true'
    } catch {
      return true
    }
  })

  const [isDeclined, setIsDeclined] = useState(() => {
    try {
      return localStorage.getItem('sdo-cookie-consent') === 'declined'
    } catch {
      return false
    }
  })

  const [isStorageBlocked, setIsStorageBlocked] = useState(() => {
    try {
      localStorage.getItem('sdo-cookie-consent')
      return false
    } catch {
      return true
    }
  })

  const handleAccept = () => {
    try {
      localStorage.setItem('sdo-cookie-consent', 'true')
      setIsVisible(false)
      setIsDeclined(false)
      setIsStorageBlocked(false)
    } catch {
      console.warn('El almacenamiento local está deshabilitado.')
      setIsStorageBlocked(true)
    }
  }

  const handleDecline = () => {
    try {
      localStorage.setItem('sdo-cookie-consent', 'declined')
      setIsDeclined(true)
      setIsStorageBlocked(false)
    } catch {
      console.warn('El almacenamiento local está deshabilitado.')
      setIsStorageBlocked(true)
    }
  }

  return (
    <AnimatePresence>
      {isVisible && !isTermsPage && (
        <>
          {/* Overlay that blocks the app if they banner is visible (optional, but requested since app needs cookies) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none fixed right-0 bottom-0 left-0 z-50"
          >
            <div className="pointer-events-auto w-full border-t border-[#e2d5c8] bg-[#fdfaf6] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sm:p-8">
              <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                {isStorageBlocked ? (
                  <div className="flex-1 space-y-1.5 text-sm text-[#5c544d]">
                    <h3 className="text-base font-semibold text-[#8b0000]">
                      Storage Blocked by Your Browser
                    </h3>
                    <p className="text-sm leading-relaxed">
                      Your browser is blocking cookies and local storage. SDOptimizer structurally
                      requires these features to save your session and parse models. Please enable
                      site data / cookies in your browser settings and refresh the page.
                    </p>
                  </div>
                ) : isDeclined ? (
                  <div className="flex-1 space-y-1.5 text-sm text-[#5c544d]">
                    <h3 className="text-base font-semibold text-[#3d3630]">Action Required</h3>
                    <p className="text-sm leading-relaxed">
                      You have declined the use of cookies and our terms. SDOptimizer requires
                      cookies to function properly and parse your models. You cannot use the
                      application without accepting the{' '}
                      <Link
                        to="/terms-and-conditions"
                        className="font-semibold text-[#8b5a2b] underline underline-offset-2 hover:text-[#6b4420]"
                      >
                        Terms & Conditions
                      </Link>
                      .
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 space-y-1.5 text-sm text-[#5c544d]">
                    <h3 className="text-base font-semibold text-[#3d3630]">
                      Cookies & Terms of Service
                    </h3>
                    <p className="text-sm leading-relaxed">
                      This platform requires the use of cookies to function properly. By using this
                      platform, you agree to our{' '}
                      <Link
                        to="/terms-and-conditions"
                        className="font-semibold text-[#8b5a2b] underline underline-offset-2 hover:text-[#6b4420]"
                      >
                        Terms & Conditions
                      </Link>
                      , which stipulate that any model or file you upload will become property of
                      the platform. If you decline, you will not be able to use the application's
                      features.
                    </p>
                  </div>
                )}

                <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center lg:min-w-[280px] lg:justify-end">
                  {isStorageBlocked ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => window.location.reload()}
                      className="w-full border-transparent bg-[#8b0000] text-white hover:bg-[#660000] sm:w-auto"
                    >
                      Refresh Page
                    </Button>
                  ) : (
                    <>
                      {!isDeclined && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDecline}
                          className="w-full border-[#d4c5b5] text-[#5c544d] hover:bg-[#f4efe8] sm:w-auto"
                        >
                          Decline
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleAccept}
                        className="w-full border-transparent bg-[#6b4420] text-white hover:bg-[#523318] sm:w-auto"
                      >
                        {isDeclined ? 'Accept & Continue' : 'Accept All'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
