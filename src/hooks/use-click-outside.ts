import { useEffect, useRef } from 'react'

/**
 * Hook to detect clicks outside of a referenced element.
 * @param callback - Function to call when a click outside is detected
 * @param excludedIds - Array of element IDs to exclude from the outside click detection
 */
export function useClickOutside<T extends HTMLElement>(
  callback: () => void,
  excludedIds: string[] = []
) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        const isExcluded = excludedIds.some((id) => {
          const excludedElement = document.getElementById(id)
          return excludedElement?.contains(event.target as Node)
        })

        if (!isExcluded) {
          callback()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [callback, excludedIds])

  return ref
}
