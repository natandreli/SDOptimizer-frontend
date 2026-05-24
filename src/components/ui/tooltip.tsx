import { IconInfoSmall } from '@tabler/icons-react'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface InfoTooltipProps {
  content: ReactNode
  className?: string
}

export function InfoTooltip({ content, className = '' }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      let left = rect.left + window.scrollX
      const tooltipWidth = 192

      if (left + tooltipWidth > window.innerWidth) {
        left = window.innerWidth - tooltipWidth - 16
      }

      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left,
      })
    }
  }

  const handleMouseEnter = () => {
    updateCoords()
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  useEffect(() => {
    if (!isVisible) return
    const handleScroll = () => updateCoords()
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isVisible])

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className="border-primary-300 text-primary-700 hover:bg-primary-100 focus-visible:ring-primary-300 flex h-4 w-4 cursor-help items-center justify-center rounded-full border text-[10px] leading-none font-semibold transition-colors focus:outline-none focus-visible:ring-2"
        aria-label="Information"
      >
        <IconInfoSmall className="h-5 w-5" />
      </button>

      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {isVisible && (
                <motion.div
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.15 }}
                  className="border-primary-200 bg-primary-50 text-primary-800 pointer-events-none absolute z-[99999] w-48 rounded-md border p-2 text-[11px] leading-snug shadow-xl"
                  style={{
                    top: `${coords.top}px`,
                    left: `${coords.left}px`,
                  }}
                >
                  {content}
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )
        : null}
    </div>
  )
}
