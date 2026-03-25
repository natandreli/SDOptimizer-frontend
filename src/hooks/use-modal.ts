import { useContext } from 'react'
import { ModalContext } from '@/contexts/modal'

/**
 * Hook to access modal functionality
 */
export function useModal() {
  const context = useContext(ModalContext)

  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }

  return context
}
