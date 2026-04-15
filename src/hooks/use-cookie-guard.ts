import { useContext } from 'react'
import { CookieGuardContext } from '@/contexts/cookie-guard'

export const useCookieGuard = () => {
  const context = useContext(CookieGuardContext)

  if (!context) {
    throw new Error('useCookieGuard must be used within CookieGuardProvider')
  }

  return context
}
