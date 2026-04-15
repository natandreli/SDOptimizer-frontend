import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { CookieGuardContext, type CookieGuardStatus } from './index'
import { checkCookieSupport } from '@/utils/cookie-support'

type CookieGuardProviderProps = {
  children: ReactNode
}

export const CookieGuardProvider = ({ children }: CookieGuardProviderProps) => {
  const [status, setStatus] = useState<CookieGuardStatus>(() => {
    const initial = checkCookieSupport()
    return initial.supported ? 'supported' : 'blocked'
  })
  const [reason, setReason] = useState<
    'navigator-disabled' | 'write-read-failed' | 'unknown' | undefined
  >(() => {
    const initial = checkCookieSupport()
    return initial.reason
  })

  const recheck = useCallback(() => {
    const result = checkCookieSupport()
    setStatus(result.supported ? 'supported' : 'blocked')
    setReason(result.reason)
  }, [])

  const value = useMemo(
    () => ({
      status,
      isCookieSupported: status === 'supported',
      reason,
      recheck,
    }),
    [status, reason, recheck]
  )

  return <CookieGuardContext.Provider value={value}>{children}</CookieGuardContext.Provider>
}
