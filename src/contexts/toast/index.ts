import { createContext, type ReactNode } from 'react'

type ToastContextType = {
  /**
   * Display a toast message
   * @param message
   * @returns Toast ID
   */
  default: (message: ReactNode) => string
  /**
   * Display a success toast message
   * @param message
   * @returns Toast ID
   */
  success: (message: ReactNode) => string
  /**
   * Display an error toast message
   * @param message
   * @returns Toast ID
   */
  error: (message: ReactNode) => string
  /**
   * Display a warning toast message
   * @param message
   * @returns Toast ID
   */
  warning: (message: ReactNode) => string
  /**
   * Display a loading toast message. Use the returned ID to remove the toast
   * with the `remove` method.
   * @param message
   * @returns Toast ID
   */
  loading: (message: ReactNode) => string
  /**
   * Remove a toast message
   * @param id Toast ID
   */
  remove: (id: string) => void
  /**
   * Clear all current toast messages
   */
  clear: () => void
}

export const ToastContext = createContext<ToastContextType | null>(null)
