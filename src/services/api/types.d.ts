export interface Toast {
  id: string
  content: React.ReactNode
  type: 'default' | 'success' | 'error' | 'warning' | 'loading'
}
