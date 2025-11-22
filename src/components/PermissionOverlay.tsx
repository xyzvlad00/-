import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { Upload } from 'lucide-react'
import { enhancedAudioEngine } from '../audio/EnhancedAudioEngine'
import { useAppStore } from '../state/useAppStore'

export function PermissionOverlay() {
  const audioStatus = useAppStore((state) => state.audioStatus)
  const audioMessage = useAppStore((state) => state.audioMessage)
  const theme = useAppStore((state) => state.theme)
  const [isVisible, setIsVisible] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Handle audio file upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file (MP3, WAV, OGG, etc.)')
      return
    }

    try {
      await enhancedAudioEngine.loadAudioFile(file)
      console.log(`[PermissionOverlay] Loaded audio file: ${file.name}`)
    } catch (error) {
      console.error('[PermissionOverlay] Failed to load audio file:', error)
      alert('Failed to load audio file. Please try another file.')
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
              ? 'Microphone access is required for live visualization. If you denied permission, you can reset it in your browser settings or use an audio file instead.'
              : isSuspended
              ? 'Tap the button below or anywhere on the screen to activate audio.'
              : 'Setting up audio engine and requesting microphone permission...')}
        </p>
        
        {/* Mobile HTTPS warning */}
        {isBlocking && typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && (
          <div className={clsx(
            'mb-4 p-3 rounded-xl border text-xs',
            isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800'
          )}>
            <strong>⚠️ HTTPS Required:</strong> Microphone access requires a secure connection (HTTPS). The app is currently loaded over HTTP, which may be why permission was denied.
          </div>
        )}
        
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
          <div className="space-y-3">
            <button
              type="button"
              onClick={primaryAction.handler}
              className={clsx(
                'w-full inline-flex items-center justify-center rounded-2xl border border-aurora-500/40 bg-aurora-500/20 px-6 py-3 text-sm font-semibold shadow-glow transition-all hover:scale-105 active:scale-95',
                isDark ? 'text-white hover:bg-aurora-500/30' : 'text-slate-900 hover:bg-aurora-500/30',
              )}
            >
              {primaryAction.label}
            </button>
            
            {/* Alternative: Upload audio file (especially useful when mic is denied) */}
            {isBlocking && (
              <>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <div className="h-px flex-1 bg-white/10" />
                  <span>OR</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Upload audio file"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={clsx(
                    'w-full inline-flex items-center justify-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold transition-all hover:scale-105 active:scale-95',
                    isDark
                      ? 'border-white/20 bg-white/5 text-white/90 hover:bg-white/10 hover:border-white/30'
                      : 'border-slate-300 bg-slate-50 text-slate-900 hover:bg-slate-100',
                  )}
                >
                  <Upload className="w-4 h-4" />
                  Upload Audio File
                </button>
                
                <p className="text-xs text-white/50 text-center">
                  Use MP3, WAV, or OGG files to visualize without microphone
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

