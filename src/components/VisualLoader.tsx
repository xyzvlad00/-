import clsx from 'clsx'

interface VisualLoaderProps {
  theme?: 'dark' | 'light'
}

/**
 * Loading placeholder for lazy-loaded visual components
 */
export function VisualLoader({ theme = 'dark' }: VisualLoaderProps) {
  const isDark = theme === 'dark'

  return (
    <div
      className={clsx(
        'flex h-full w-full items-center justify-center',
        isDark ? 'bg-night-900/50' : 'bg-slate-100/50',
      )}
    >
      <div className="text-center">
        {/* Animated loading spinner */}
        <div
          className={clsx(
            'mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-solid',
            isDark
              ? 'border-aurora-500/20 border-t-aurora-500'
              : 'border-slate-300 border-t-slate-600',
          )}
          role="status"
          aria-label="Loading visual effect"
        />
        
        {/* Loading text */}
        <p
          className={clsx(
            'text-sm font-medium tracking-wider',
            isDark ? 'text-white/60' : 'text-slate-600',
          )}
        >
          Loading Visual...
        </p>

        {/* Animated dots */}
        <div className="mt-2 flex justify-center gap-1">
          <span
            className={clsx(
              'h-1.5 w-1.5 animate-pulse rounded-full',
              isDark ? 'bg-aurora-400' : 'bg-slate-500',
            )}
            style={{ animationDelay: '0ms' }}
          />
          <span
            className={clsx(
              'h-1.5 w-1.5 animate-pulse rounded-full',
              isDark ? 'bg-aurora-400' : 'bg-slate-500',
            )}
            style={{ animationDelay: '150ms' }}
          />
          <span
            className={clsx(
              'h-1.5 w-1.5 animate-pulse rounded-full',
              isDark ? 'bg-aurora-400' : 'bg-slate-500',
            )}
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  )
}

