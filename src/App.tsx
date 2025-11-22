import { useEffect, useState, useMemo } from 'react'
import clsx from 'clsx'
import { Settings2 } from 'lucide-react'
import { enhancedAudioEngine } from './audio/EnhancedAudioEngine'
import { useAppStore } from './state/useAppStore'
import { HeaderBar } from './components/HeaderBar'
import { ControlsPanel } from './components/ControlsPanel'
import { VisualHost } from './components/VisualHost'
import { PermissionOverlay } from './components/PermissionOverlay'
import { PrivacyNotice } from './components/PrivacyNotice'
import { InstallPrompt } from './components/InstallPrompt'
import { PerformanceStats } from './components/PerformanceStats'
import { MobileBottomSheet } from './components/MobileBottomSheet'
import { LoadingScreen } from './components/LoadingScreen'
// import { DebugPanel } from './components/DebugPanel'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useTouchGestures } from './hooks/useTouchGestures'
import { useAutoCycle } from './hooks/useAutoCycle'
import { performanceMonitor } from './utils/performance'
import { isMobile, preventMobileBounce, enableMobileScroll, addIOSSafeAreas, requestWakeLock } from './utils/mobile'

function App() {
  const theme = useAppStore((state) => state.theme)
  const [autoCycle, setAutoCycle] = useState(false)
  const [showPerformance, setShowPerformance] = useState(false)
  const [showMobileControls, setShowMobileControls] = useState(false)
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null)
  const [loadingComplete, setLoadingComplete] = useState(false)

  // Memoize mobile detection to prevent re-renders
  const mobile = useMemo(() => isMobile(), [])

  useKeyboardShortcuts()
  useTouchGestures() // Mobile gesture support
  useAutoCycle(autoCycle, 30)

  useEffect(() => {
    // Only initialize after loading is complete
    if (!loadingComplete) return

    enhancedAudioEngine.start()
    performanceMonitor.start()
    
    // Mobile optimizations
    if (mobile) {
      preventMobileBounce()
      addIOSSafeAreas()
      
      // Request wake lock to prevent screen dimming
      requestWakeLock().then(lock => setWakeLock(lock))
    }
    
    // Toggle performance stats with Shift+P
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'P') {
        setShowPerformance(prev => !prev)
      }
    }
    
    // Handle visibility change to re-acquire wake lock
    const handleVisibilityChange = () => {
      if (mobile && !document.hidden && !wakeLock) {
        requestWakeLock().then(lock => setWakeLock(lock))
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      enhancedAudioEngine.stop()
      performanceMonitor.stop()
      window.removeEventListener('keydown', handleKeyPress)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      if (mobile) {
        enableMobileScroll()
        if (wakeLock) {
          wakeLock.release()
        }
      }
    }
  }, [mobile, wakeLock, loadingComplete])

  return (
    <>
      {/* Loading screen with animated logo */}
      {!loadingComplete && (
        <LoadingScreen onComplete={() => setLoadingComplete(true)} />
      )}

      {/* Main application - starts invisible, fades in after loading */}
      <div
        className={clsx(
          'min-h-screen text-white',
          theme === 'light' && 'text-slate-900',
          mobile && 'pb-safe' // iOS safe area
        )}
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a14 60%, #000000 100%)'
            : 'linear-gradient(to bottom, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
          opacity: loadingComplete ? 1 : 0,
          transition: loadingComplete ? 'opacity 2s ease-in 0.3s' : 'none',
        }}
      >
        <div className={clsx(
          'mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:gap-6 lg:px-6 lg:py-6',
          mobile && 'px-2 py-2 gap-2'
        )}>
          <div className="flex flex-1 flex-col gap-4">
            <HeaderBar />
            <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
              <div className="relative flex-1">
                <VisualHost />
                
                {/* Mobile floating controls button */}
                {mobile && (
                  <button
                    onClick={() => setShowMobileControls(true)}
                    className="fixed bottom-6 right-6 z-30 p-4 bg-aurora-500 hover:bg-aurora-600 text-white rounded-full shadow-2xl transition-all active:scale-95"
                    aria-label="Open controls"
                  >
                    <Settings2 className="w-6 h-6" />
                  </button>
                )}
              </div>
              
              {/* Desktop controls (hidden on mobile) */}
              {!mobile && (
                <div className="lg:hidden">
                  <ControlsPanel autoCycle={autoCycle} setAutoCycle={setAutoCycle} />
                </div>
              )}
            </div>
            <PermissionOverlay />
            {!mobile && (
              <PrivacyNotice />
            )}
          </div>
          <div className="hidden lg:block lg:w-80 xl:w-96">
            <ControlsPanel autoCycle={autoCycle} setAutoCycle={setAutoCycle} />
          </div>
        </div>
        
        {/* Mobile Bottom Sheet Controls */}
        {mobile && (
          <MobileBottomSheet
            isOpen={showMobileControls}
            onClose={() => setShowMobileControls(false)}
            title="Controls"
          >
            <ControlsPanel autoCycle={autoCycle} setAutoCycle={setAutoCycle} />
          </MobileBottomSheet>
        )}
        
        <InstallPrompt />
        <PerformanceStats show={showPerformance} />
        {/* <DebugPanel /> */}
      </div>
    </>
  )
}

export default App
