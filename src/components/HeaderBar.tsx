import { useMemo } from 'react'
import clsx from 'clsx'
import { useAppStore } from '../state/useAppStore'
import { enhancedAudioEngine } from '../audio/EnhancedAudioEngine'

const STATUS_COPY: Record<string, { label: string; toneDark: string; toneLight: string }> = {
  idle: { label: 'Idle', toneDark: 'border-white/10 text-white/60', toneLight: 'border-slate-300 text-slate-600' },
  requesting: { label: 'Requesting mic…', toneDark: 'border-amber-300/40 text-amber-200', toneLight: 'border-amber-400 text-amber-700' },
  listening: { label: 'Listening', toneDark: 'border-emerald-400/40 text-emerald-200', toneLight: 'border-emerald-500 text-emerald-700' },
  denied: { label: 'Permission denied', toneDark: 'border-red-400/50 text-red-200', toneLight: 'border-red-400 text-red-700' },
  error: { label: 'Audio error', toneDark: 'border-red-400/50 text-red-200', toneLight: 'border-red-400 text-red-700' },
  unsupported: { label: 'Unsupported', toneDark: 'border-red-400/50 text-red-200', toneLight: 'border-red-400 text-red-700' },
  suspended: { label: 'Tap to start audio', toneDark: 'border-amber-300/40 text-amber-200', toneLight: 'border-amber-400 text-amber-700' },
}

export function HeaderBar() {
  const audioStatus = useAppStore((state) => state.audioStatus)
  const audioMessage = useAppStore((state) => state.audioMessage)
  const theme = useAppStore((state) => state.theme)

  const statusInfo = STATUS_COPY[audioStatus] ?? STATUS_COPY.idle
  const statusTone = theme === 'dark' ? statusInfo.toneDark : statusInfo.toneLight
  const needsAction = useMemo(() => ['denied', 'error', 'unsupported'].includes(audioStatus), [audioStatus])

  return (
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="transition-all duration-300 hover:translate-x-1">
        <p className={clsx('text-sm uppercase tracking-[0.4em] transition-all duration-300', theme === 'dark' ? 'text-white/40 hover:text-white/60' : 'text-slate-500 hover:text-slate-700')}>
          Live VFX
        </p>
        <h1 className={clsx('text-3xl font-semibold md:text-4xl transition-colors duration-300', theme === 'dark' ? 'text-white hover:text-teal-300' : 'text-slate-900 hover:text-sky-600')}>Live VFX Spectrum</h1>
        <p className={clsx('text-sm transition-colors duration-300', theme === 'dark' ? 'text-white/60 hover:text-white/80' : 'text-slate-600 hover:text-slate-800')}>Mic-reactive visuals rendered fully in your browser.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className={clsx('flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg', statusTone)}>
          <span className={clsx('h-2 w-2 rounded-full bg-current transition-transform duration-300 hover:scale-150', audioStatus === 'listening' && 'animate-pulse-slow')} />
          <span>{statusInfo.label}</span>
        </div>
        {audioMessage && (
          <div
            className={clsx(
              'rounded-2xl border px-4 py-2 text-xs',
              theme === 'dark' ? 'border-white/10 text-white/70' : 'border-slate-200 text-slate-600',
            )}
          >
            {audioMessage}
          </div>
        )}
        {audioStatus === 'suspended' && (
          <button
            type="button"
            onClick={() => enhancedAudioEngine.resume()}
            className={clsx(
              'rounded-2xl border border-aurora-500/40 bg-aurora-500/20 px-4 py-2 text-sm shadow-glow transition-all duration-300 hover:scale-110 hover:shadow-xl hover:bg-aurora-500/30',
              theme === 'dark' ? 'text-white' : 'text-slate-900',
            )}
          >
            Tap to Start
          </button>
        )}
        {needsAction && (
          <button
            type="button"
            onClick={() => enhancedAudioEngine.start()}
            className={clsx(
              'rounded-2xl border px-4 py-2 text-sm transition-all duration-300 hover:scale-110 hover:shadow-lg',
              theme === 'dark'
                ? 'border-white/20 text-white/80 hover:border-white/40 hover:bg-white/5'
                : 'border-slate-200 text-slate-700 hover:border-aurora-500/30 hover:bg-slate-50',
            )}
          >
            Retry
          </button>
        )}
      </div>
    </header>
  )
}

