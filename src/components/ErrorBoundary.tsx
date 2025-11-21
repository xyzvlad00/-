import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
          <div className="max-w-md text-center">
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="mb-2 text-xl font-bold text-red-400">Visual Effect Error</h2>
            <p className="mb-4 text-sm text-red-300/80">
              This visual mode encountered an error and couldn't render.
            </p>
            <details className="mb-4 text-left">
              <summary className="cursor-pointer text-sm text-red-300/60 hover:text-red-300">
                Technical details
              </summary>
              <pre className="mt-2 overflow-auto rounded-lg bg-black/20 p-3 text-xs text-red-200/80">
                {this.state.error?.message}
              </pre>
            </details>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/30"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

