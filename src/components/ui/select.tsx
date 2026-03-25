import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { IconChevronDown } from '@tabler/icons-react'
import { useClickOutside } from '@/hooks/use-click-outside'
import { cn } from '@/utils/cn'

interface SelectOption {
  value: string
  label: string
  subtitle?: string
}

interface SelectProps {
  label?: string
  placeholder?: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
}

export const Select = ({
  label,
  placeholder = 'Select an option...',
  value,
  options,
  onChange,
  required = false,
  disabled = false,
  className,
}: SelectProps) => {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const containerRef = useClickOutside<HTMLDivElement>(() => setOpen(false))
  const triggerRef = useRef<HTMLButtonElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      })
    }
  }

  useEffect(() => {
    if (open) {
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)

      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [open])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative space-y-1.5', className)}>
      {label && (
        <label className="text-primary-900 block text-sm font-medium">
          {label}
          {required && <span className="text-red-800"> *</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          'border-primary-300 bg-primary-50 relative flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition-all',
          'focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/15 focus:outline-none',
          disabled && 'cursor-not-allowed opacity-60',
          !disabled && 'hover:border-primary-400 cursor-pointer'
        )}
      >
        <div className="flex-1 truncate">
          {selectedOption ? (
            <div>
              <div className="text-primary-950 font-medium">{selectedOption.label}</div>
              {selectedOption.subtitle && (
                <div className="text-primary-700/80 mt-0.5 text-xs">{selectedOption.subtitle}</div>
              )}
            </div>
          ) : (
            <span className="text-primary-700/70">{placeholder}</span>
          )}
        </div>
        <IconChevronDown
          size={20}
          className={cn(
            'text-primary-500/80 ml-2 flex-shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {typeof window !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="border-primary-300 bg-primary-50 fixed z-[99999] max-h-80 overflow-auto rounded-lg border shadow-xl"
                style={{
                  top: `${position.top}px`,
                  left: `${position.left}px`,
                  width: `${position.width}px`,
                  originY: 0,
                }}
              >
                {options.map((option) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full cursor-pointer px-4 py-3 text-left transition-colors',
                      'hover:bg-primary-100',
                      option.value === value && 'bg-primary-100/70'
                    )}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    <div className="text-primary-950 text-sm font-medium">{option.label}</div>
                    {option.subtitle && (
                      <div className="text-primary-700/80 mt-0.5 text-xs">{option.subtitle}</div>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
