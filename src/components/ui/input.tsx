import {
  type DetailedHTMLProps,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { cn } from '@/utils/cn'

type InputProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  containerProps?: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
  icon?: ReactNode
  label?: string
  labelOffset?: number
  errorMessage?: string
  setValue?: (value: string) => void
  isDropdown?: boolean
}

export const Input = (props: InputProps) => {
  const inputProps = { ...props }
  delete inputProps.containerProps
  delete inputProps.icon
  delete inputProps.errorMessage
  delete inputProps.setValue
  delete inputProps.label
  delete inputProps.labelOffset
  delete inputProps.min
  delete inputProps.max
  delete inputProps.isDropdown

  const minValue = props.min
  const maxValue = props.max

  let id = useId()
  id = props.id || id

  function handleOnChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value

    if (props.type === 'number') {
      if (value === '') {
        if (!props.required) {
          props.setValue?.(value)
          props.onChange?.(event)
        }
        return
      }

      const min = minValue !== undefined ? parseFloat(minValue.toString()) : -Infinity
      const max = maxValue !== undefined ? parseFloat(maxValue.toString()) : Infinity

      if (value === '-' || (value.startsWith('-') && min >= 0)) {
        return
      }

      const numValue = parseFloat(value)

      if (isNaN(numValue) || numValue < min || numValue > max) {
        return
      }
    }

    props.setValue?.(value)
    props.onChange?.(event)
  }

  const handleIncrement = () => {
    const currentValue = parseFloat(props.value?.toString() || '0')
    const step = parseFloat(props.step?.toString() || '1')
    const max = maxValue !== undefined ? parseFloat(maxValue.toString()) : Infinity
    const newValue = currentValue + step
    if (newValue <= max) {
      const roundedValue = Math.round(newValue * 10000) / 10000
      props.setValue?.(roundedValue.toString())
    }
  }

  const handleDecrement = () => {
    const currentValue = parseFloat(props.value?.toString() || '0')
    const step = parseFloat(props.step?.toString() || '1')
    const min = minValue !== undefined ? parseFloat(minValue.toString()) : -Infinity
    const newValue = currentValue - step

    if (newValue < min) {
      return
    }

    const roundedValue = Math.round(newValue * 10000) / 10000

    if (roundedValue >= min) {
      props.setValue?.(roundedValue.toString())
    }
  }

  const currentValue = parseFloat(props.value?.toString() || '0')
  const min = minValue !== undefined ? parseFloat(minValue.toString()) : -Infinity
  const max = maxValue !== undefined ? parseFloat(maxValue.toString()) : Infinity
  const isDecrementDisabled =
    currentValue <= min || currentValue - parseFloat(props.step?.toString() || '1') < min
  const isIncrementDisabled = currentValue >= max

  return (
    <div {...props.containerProps} className={cn('space-y-1.5', props.containerProps?.className)}>
      {props.label && (
        <label htmlFor={id} className="text-primary-900 block text-sm font-medium">
          {props.label}
          {props.required && <span className="text-red-800"> *</span>}
        </label>
      )}
      <div className="border-primary-300 bg-primary-50 relative flex max-w-full flex-1 items-center rounded-lg border transition-all focus-within:border-sky-400/70 focus-within:ring-2 focus-within:ring-sky-500/15">
        <input
          {...inputProps}
          placeholder={props.placeholder}
          className={cn(
            'text-primary-950 block w-full max-w-full bg-transparent px-4 py-2.5 text-sm outline-none',
            props.readOnly && 'cursor-default opacity-70',
            props.disabled && 'cursor-not-allowed opacity-50',
            props.isDropdown && 'cursor-pointer caret-transparent',
            props.icon ? 'cursor-pointer caret-transparent' : '',
            props.icon ? 'pl-10' : 'px-4',
            props.isDropdown && 'pr-10',
            props.type === 'checkbox' && 'accent-primary-700 h-4 w-4',
            props.type === 'number' &&
              '[appearance:textfield] pr-16 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            props.className
          )}
          type={props.type}
          id={id}
          onChange={handleOnChange}
        />
        {props.icon && <div className="text-primary-500/80 absolute left-3">{props.icon}</div>}
        {props.type === 'number' && props.setValue && !props.disabled && (
          <div className="gap-0.1 absolute right-2 mr-1 flex flex-col">
            <button
              type="button"
              onClick={handleIncrement}
              disabled={isIncrementDisabled || props.disabled}
              className={cn(
                'flex items-center justify-center transition-colors',
                isIncrementDisabled || props.disabled
                  ? 'text-primary-300 cursor-not-allowed'
                  : 'text-primary-700 hover:text-primary-900 cursor-pointer'
              )}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleDecrement}
              disabled={isDecrementDisabled || props.disabled}
              className={cn(
                'flex items-center justify-center transition-colors',
                isDecrementDisabled || props.disabled
                  ? 'text-primary-300 cursor-not-allowed'
                  : 'text-primary-700 hover:text-primary-900 cursor-pointer'
              )}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        )}
        {props.isDropdown && props.type !== 'number' && (
          <span className="text-primary-500/80 pointer-events-none absolute right-4">
            <IconChevronDown size={20} />
          </span>
        )}
      </div>
      {props.errorMessage && <p className="text-xs text-red-500">{props.errorMessage}</p>}
    </div>
  )
}
