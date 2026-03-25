/**
 * Application configuration
 *
 * Uses environment variables at build time (Vite will replace import.meta.env.* at build time)
 * For development, these can be set in .env files
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
