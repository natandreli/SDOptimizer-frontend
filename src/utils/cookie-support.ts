export type CookieCheckResult = {
  supported: boolean
  reason?: 'navigator-disabled' | 'write-read-failed' | 'unknown'
}

export const checkCookieSupport = (): CookieCheckResult => {
  try {
    if (typeof navigator !== 'undefined' && !navigator.cookieEnabled) {
      return { supported: false, reason: 'navigator-disabled' }
    }

    const testKey = '__sdoptimizer_cookie_test__'
    const cookieValue = `${testKey}=1; path=/; max-age=60; SameSite=Lax`

    document.cookie = cookieValue
    const hasCookie = document.cookie.split(';').some((cookie) => cookie.trim().startsWith(`${testKey}=`))

    document.cookie = `${testKey}=; path=/; max-age=0; SameSite=Lax`

    if (!hasCookie) {
      return { supported: false, reason: 'write-read-failed' }
    }

    return { supported: true }
  } catch {
    return { supported: false, reason: 'unknown' }
  }
}
