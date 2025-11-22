import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { enhancedAudioEngine } from '../audio/EnhancedAudioEngine'
import { useAppStore } from '../state/useAppStore'

export function PermissionOverlay() {
  const audioStatus = useAppStore((state) => state.audioStatus)
  const audioMessage = useAppStore((state) => state.audioMessage)
  const theme = useAppStore((state) => state.theme)
  const [isVisible, setIsVisible] = useState(false)

  // Add delay before showing overlay to prevent flashing on mobile
  useEffect(() => {
    if (['denied', 'error', 'unsupported', 'suspended'].includes(audioStatus)) {
      // Show immediately for important states
      setIsVisible(true)
    } else if (['idle', 'requesting'].includes(audioStatus)) {
      // Add delay for transient states
      const timer = setTimeout(() => {
        // Only show if still in the same state (prevents flash)
        const currentStatus = useAppStore.getState().audioStatus
        if (['idle', 'requesting'].includes(currentStatus)) {
          setIsVisible(true)
        }
      }, 800) // Longer delay to prevent flash during initialization
      return () => clearTimeout(timer)
    } else {
      // Hide for listening state
      setIsVisible(false)
    }
  }, [audioStatus])

  const shouldShow = ['idle', 'requesting', 'denied', 'error', 'unsupported', 'suspended'].includes(audioStatus)

  if (!shouldShow || !isVisible) {
    return null
  }

  const isBlocking = ['denied', 'error', 'unsupported'].includes(audioStatus)
  const isSuspended = audioStatus === 'suspended'
  
  const primaryAction =
    isSuspended
      ? { label: 'Tap to start audio', handler: () => enhancedAudioEngine.resume() }
      : isBlocking
      ? { label: 'Retry microphone access', handler: () => enhancedAudioEngine.start() }
      : { label: 'Starting...', handler: () => {} }

  const isDark = theme === 'dark'

  // Make entire overlay clickable for suspended state (mobile-friendly)
  const handleOverlayClick = () => {
    if (isSuspended) {
      primaryAction.handler()
    }
  }

  return (
    <div
      onClick={handleOverlayClick}
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg transition-opacity duration-300',
        isDark ? 'bg-black/80' : 'bg-slate-100/95',
        isSuspended && 'cursor-pointer',
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()} // Prevent bubbling when clicking the card itself
        className={clsx(
          'relative max-w-md mx-4 rounded-3xl border p-8 text-center animate-fade-in-scale',
          isDark ? 'border-white/10 bg-black/60 text-white shadow-glow' : 'border-slate-300 bg-white text-slate-900 shadow-xl ring ring-slate-200',
        )}
      >
        <p className={clsx('mb-2 text-xs uppercase tracking-[0.3em]', isDark ? 'text-white/40' : 'text-slate-500')}>
          {audioStatus === 'requesting' ? 'Initializing' : 'Microphone access'}
        </p>
        <h2 className={clsx('mb-3 text-2xl font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
          {audioStatus === 'requesting' && 'Preparing audio engine…'}
          {audioStatus === 'idle' && 'Starting audio engine…'}
          {audioStatus === 'denied' && 'Permission denied'}
          {audioStatus === 'error' && 'Audio engine error'}
          {audioStatus === 'unsupported' && 'Audio not supported'}
          {audioStatus === 'suspended' && 'Audio ready'}
        </h2>
        <p className={clsx('text-sm mb-4', isDark ? 'text-white/70' : 'text-slate-600')}>
          {audioMessage ??
            (isBlocking
              ? 'The app needs your microphone to render real-time visuals. Check browser settings and try again.'
              : isSuspended
              ? 'Tap the button below or anywhere on the screen to activate audio.'
              : 'Setting up audio engine and requesting microphone permission...')}
        </p>
        
        {/* Show loading spinner for requesting state */}
        {audioStatus === 'requesting' && (
          <div className="flex justify-center mb-4">
            <div className={clsx(
              'w-8 h-8 border-3 border-t-transparent rounded-full animate-spin',
              isDark ? 'border-aurora-500' : 'border-sky-500'
            )} />
          </div>
        )}
        
        {/* Only show button for actionable states */}
        {(isBlocking || isSuspended) && (
          <button
            type="button"
            onClick={primaryAction.handler}
            className={clsx(
              'inline-flex items-center justify-center rounded-2xl border border-aurora-500/40 bg-aurora-500/20 px-6 py-3 text-sm font-semibold shadow-glow transition-all hover:scale-105 active:scale-95',
              isDark ? 'text-white hover:bg-aurora-500/30' : 'text-slate-900 hover:bg-aurora-500/30',
            )}
          >
            {primaryAction.label}
          </button>
        )}
      </div>
    </div>
  )
}

