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
      // Show immediately for blocking states
      setIsVisible(true)
    } else if (['idle', 'requesting'].includes(audioStatus)) {
      // Add delay for non-blocking states
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 500) // 500ms delay to prevent flash
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
  const primaryAction =
    audioStatus === 'suspended'
      ? { label: 'Tap to start', handler: () => enhancedAudioEngine.resume() }
      : { label: 'Retry microphone access', handler: () => enhancedAudioEngine.start() }

  const isDark = theme === 'dark'

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg',
        isDark ? 'bg-black/80' : 'bg-slate-100/95',
      )}
    >
      <div
        className={clsx(
          'relative max-w-md rounded-3xl border p-8 text-center',
          isDark ? 'border-white/10 bg-black/60 text-white shadow-glow' : 'border-slate-300 bg-white text-slate-900 shadow-xl ring ring-slate-200',
        )}
      >
        <p className={clsx('mb-2 text-xs uppercase tracking-[0.3em]', isDark ? 'text-white/40' : 'text-slate-500')}>
          Microphone access
        </p>
        <h2 className={clsx('mb-3 text-2xl font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
          {audioStatus === 'requesting' && 'Preparing audio engine…'}
          {audioStatus === 'idle' && 'Initializing audio engine…'}
          {audioStatus === 'denied' && 'Permission denied'}
          {audioStatus === 'error' && 'Audio engine error'}
          {audioStatus === 'unsupported' && 'Audio not supported'}
          {audioStatus === 'suspended' && 'Tap anywhere to resume audio'}
        </h2>
        <p className={clsx('text-sm', isDark ? 'text-white/70' : 'text-slate-600')}>
          {audioMessage ??
            (isBlocking
              ? 'The app needs your microphone to render real-time visuals. Check browser settings and try again.'
              : 'Requesting permission to use your microphone. You might see a browser prompt.')}
        </p>
        <button
          type="button"
          onClick={primaryAction.handler}
          className={clsx(
            'mt-6 inline-flex items-center justify-center rounded-2xl border border-aurora-500/40 bg-aurora-500/20 px-5 py-2 text-sm font-semibold shadow-glow',
            isDark ? 'text-white' : 'text-slate-900',
          )}
        >
          {primaryAction.label}
        </button>
      </div>
    </div>
  )
}

