import { createContext } from 'react'

export type CookieGuardStatus = 'checking' | 'supported' | 'blocked'

export type CookieGuardContextType = {
  status: CookieGuardStatus
  isCookieSupported: boolean
  reason?: 'navigator-disabled' | 'write-read-failed' | 'unknown'
  recheck: () => void
}

export const CookieGuardContext = createContext<CookieGuardContextType | null>(null)
