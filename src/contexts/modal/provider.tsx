import { type ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useClickOutside } from '@/hooks/use-click-outside'
import { ModalContext } from '.'

import { AnimatePresence, motion } from 'framer-motion'
import { IconX } from '@tabler/icons-react'

interface ModalProviderProps {
  children: ReactNode
}

type ModalConfig = {
  content: ReactNode
  preventClose: boolean
  onClose?: () => void
}

const EXCLUDED_IDS_CLICK_OUTSIDE = [
  'dropdown-options-container',
  'toast-notifications-container',
  'popover-content',
  'locationSelectorMap',
]

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const [modalStack, setModalStack] = useState<ModalConfig[]>([])
  const [isInitialRender, setIsInitialRender] = useState(true)

  const isOpen = modalStack.length > 0
  const currentModal = isOpen ? modalStack[modalStack.length - 1] : null

  const close = () => {
    setModalStack((prev) => prev.slice(0, -1))
  }

  const containerRef = useClickOutside<HTMLDivElement>(() => {
    if (currentModal && !currentModal.preventClose && !isInitialRender) {
      close()
      if (currentModal.onClose) {
        currentModal.onClose()
      }
    }
  }, EXCLUDED_IDS_CLICK_OUTSIDE)

  const open = (content: ReactNode, preventClose: boolean = false, onClose?: () => void) => {
    const newModal: ModalConfig = { content, preventClose, onClose }
    setModalStack((prev) => [...prev, newModal])
    setIsInitialRender(true)
  }

  useEffect(() => {
    if (isOpen && isInitialRender) {
      const timer = setTimeout(() => {
        setIsInitialRender(false)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isOpen, isInitialRender])

  return (
    <ModalContext.Provider value={{ open, close, isOpen }}>
      {children}
      {typeof window !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {modalStack.map((modal, index) => {
              const isTop = index === modalStack.length - 1

              return (
                <motion.div
                  key={`modal-backdrop-${index}`}
                  className="bg-primary-950/18 fixed inset-0 z-[60] flex h-full w-full items-start justify-center overflow-y-auto px-4 py-6 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: isTop ? 1 : 0,
                    pointerEvents: isTop ? 'auto' : 'none',
                  }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    ref={isTop ? containerRef : undefined}
                    className={`border-primary-200 bg-primary-50 relative my-auto max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl border p-10 shadow-xl shadow-sky-500/10 ${
                      !isTop ? 'pointer-events-none scale-95 opacity-0' : ''
                    }`}
                    initial={{
                      scale: 0.5,
                      clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)',
                      y: 300,
                    }}
                    animate={{
                      scale: 1,
                      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                      y: 0,
                    }}
                    exit={{
                      scale: 0.5,
                      clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)',
                      y: 350,
                    }}
                  >
                    {modal.content}
                    {isTop && !modal.preventClose && (
                      <button
                        className="text-primary-600/70 absolute top-8 right-8 cursor-pointer transition-colors hover:text-rose-600"
                        onClick={() => {
                          close()
                          if (modal.onClose) {
                            modal.onClose()
                          }
                        }}
                      >
                        <IconX size={18} />
                      </button>
                    )}
                  </motion.div>
                </motion.div>
              )
            })}
          </AnimatePresence>,
          document.body
        )}
    </ModalContext.Provider>
  )
}
