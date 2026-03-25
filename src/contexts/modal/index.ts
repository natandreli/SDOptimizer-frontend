import { createContext, type ReactNode } from 'react'

type TModalContext = {
  open: (content: ReactNode, preventClose?: boolean, onClose?: () => void) => void
  close: () => void
  isOpen: boolean
}

export const ModalContext = createContext<TModalContext>({
  open: () => {},
  close: () => {},
  isOpen: false,
})
