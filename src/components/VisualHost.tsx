import { useState, useEffect, Suspense } from 'react'
import clsx from 'clsx'
import { getVisualById, visualRegistry } from '../visuals/registry'
import { useAppStore } from '../state/useAppStore'
import { useAudioActivity } from '../audio/useAudioActivity'
import { ErrorBoundary } from './ErrorBoundary'
import { VisualLoader } from './VisualLoader'

export function VisualHost() {
  const visualMode = useAppStore((state) => state.visualMode)
  const sensitivity = useAppStore((state) => state.sensitivity)
  const smoothMotion = useAppStore((state) => state.smoothMotion)
  const theme = useAppStore((state) => state.theme)
  const status = useAppStore((state) => state.audioStatus)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showUI, setShowUI] = useState(true)
  
  const VisualComponent = getVisualById(visualMode).Component
  const activity = useAudioActivity()

  const isDark = theme === 'dark'

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement
      setIsFullscreen(isNowFullscreen)
      setShowUI(true)
      
      if (isNowFullscreen) {
        const timer = setTimeout(() => {
          setShowUI(false)
        }, 3000)
        return () => clearTimeout(timer)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    const container = document.getElementById('visual-container')
    if (!container) return

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true))
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false))
    }
  }

  return (
    <>
      <div
        id="visual-container"
        role="region"
        aria-label="Audio Visualizer Display"
        className={clsx(
          'relative flex-1 overflow-hidden rounded-[32px] border',
          'min-h-[420px] w-full',
          'shadow-[0_20px_60px_rgba(0,0,0,0.35)]',
          isDark ? 'border-white/5 bg-night-900/70' : 'border-black/10 bg-white',
        )}
      >
        <ErrorBoundary>
          <Suspense fallback={<VisualLoader theme={theme} />}>
            <VisualComponent sensitivity={sensitivity} smoothMotion={smoothMotion} theme={theme} />
          </Suspense>
        </ErrorBoundary>
        <div
          className={clsx(
            'pointer-events-none absolute left-6 top-6 rounded-full border px-4 py-1 text-xs uppercase tracking-[0.2em] backdrop-blur transition-opacity duration-500',
            isDark ? 'border-white/10 bg-black/40 text-white/70' : 'border-slate-200 bg-white/90 text-slate-700',
            isFullscreen && !showUI && 'opacity-0',
          )}
        >
          {visualRegistry.find((visual) => visual.id === visualMode)?.name ?? 'Visual'}
        </div>
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode'}
          className={clsx(
            'absolute right-6 top-6 rounded-full border px-4 py-1 text-xs uppercase tracking-[0.2em] backdrop-blur transition-all duration-500',
            isDark
              ? 'border-white/10 bg-black/40 text-white/70 hover:bg-black/60'
              : 'border-slate-200 bg-white/90 text-slate-700 hover:bg-white',
            isFullscreen && !showUI && 'opacity-0 pointer-events-none',
          )}
        >
          {isFullscreen ? '⊗ Exit' : '⛶ Fullscreen'}
        </button>
      </div>
      {status === 'listening' && activity < 0.02 && (
        <p className={clsx('mt-3 text-center text-sm', isDark ? 'text-white/60' : 'text-slate-600')}>
          Try playing music or making some noise to wake the visuals.
        </p>
      )}
    </>
  )
}

