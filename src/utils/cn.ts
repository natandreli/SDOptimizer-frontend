import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge CSS classes.
 * Combines clsx for conditional classes and tailwind-merge for Tailwind CSS conflicts.
 * @param inputs - Class names, objects, or arrays of class names.
 * @returns A single string with merged class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
