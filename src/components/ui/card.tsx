import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

type CardProps = {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export const Card = ({ children, className, onClick }: CardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'border-primary-200/90 bg-primary-50/95 rounded-xl border p-5 shadow-sm',
        onClick && 'cursor-pointer transition-shadow hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export const CardTitle = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <span className={cn('text-primary-950 text-base font-semibold', className)}>{children}</span>
  )
}

export const CardDescription = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => {
  return <p className={cn('text-primary-900/75 text-sm', className)}>{children}</p>
}

export const CardContent = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => {
  return <div className={cn('', className)}>{children}</div>
}
