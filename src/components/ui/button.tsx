import { cn } from '@/utils/cn'
import { IconLoader2 } from '@tabler/icons-react'
import { type HTMLMotionProps, motion } from 'framer-motion'

type ButtonProps = Readonly<
  Omit<HTMLMotionProps<'button'>, 'ref'> & {
    children: React.ReactNode
    className?: string
    icon?: React.ReactNode
    isLoading?: boolean
    disableOnLoading?: boolean
    iconPosition?: 'left' | 'right'
    altColor?: boolean
    variant?: 'primary' | 'alt' | 'error' | 'grey' | 'success'
    size?: 'xs' | 'sm' | 'md' | 'lg'
  }
>

export const Button = ({
  children,
  className,
  icon,
  isLoading,
  disableOnLoading = true,
  iconPosition = 'left',
  altColor,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) => {
  const isDisabled = Boolean(props.disabled) || (disableOnLoading && Boolean(isLoading))

  if (altColor) {
    variant = 'alt'
  }

  const sizeClasses = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
  }[size]

  return (
    <motion.button
      {...props}
      disabled={isDisabled}
      whileTap={{ scale: isDisabled ? 1 : 0.95 }}
      className={cn(
        'focus-visible:ring-primary-500/30 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-default disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm',
        sizeClasses,
        isDisabled && 'cursor-default opacity-50',
        variant === 'primary' &&
          'border-primary-700 bg-primary-700 text-primary-50 hover:border-primary-800 hover:bg-primary-800',
        variant === 'alt' &&
          'border-sky-300 bg-sky-50 text-sky-900 hover:border-sky-400 hover:bg-sky-100',
        variant === 'error' &&
          'border-rose-600 bg-rose-600 text-white hover:border-rose-700 hover:bg-rose-700',
        variant === 'grey' &&
          'border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-100',
        variant === 'success' &&
          'border-emerald-600 bg-emerald-600 text-emerald-50 hover:border-emerald-700 hover:bg-emerald-700',
        className
      )}
    >
      {iconPosition === 'left' && (isLoading ? <IconLoader2 className="animate-spin" /> : icon)}
      {children}
      {iconPosition === 'right' && (isLoading ? <IconLoader2 className="animate-spin" /> : icon)}
    </motion.button>
  )
}
