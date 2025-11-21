import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { audioEngine } from './audio/AudioEngine'
import { useAppStore } from './state/useAppStore'
import { HeaderBar } from './components/HeaderBar'
import { ControlsPanel } from './components/ControlsPanel'
import { VisualHost } from './components/VisualHost'
import { PermissionOverlay } from './components/PermissionOverlay'
import { PrivacyNotice } from './components/PrivacyNotice'
import { InstallPrompt } from './components/InstallPrompt'
import { PerformanceStats } from './components/PerformanceStats'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAutoCycle } from './hooks/useAutoCycle'
import { performanceMonitor } from './utils/performance'

function App() {
  const theme = useAppStore((state) => state.theme)
  const [autoCycle, setAutoCycle] = useState(false)
  const [showPerformance, setShowPerformance] = useState(false)

  useKeyboardShortcuts()
  useAutoCycle(autoCycle, 30)

  useEffect(() => {
    audioEngine.start()
    performanceMonitor.start()
    
    // Toggle performance stats with Shift+P
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'P') {
        setShowPerformance(prev => !prev)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    
    return () => {
      audioEngine.stop()
      performanceMonitor.stop()
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  return (
    <div
      className={clsx(
        'min-h-screen bg-gradient-to-b from-night-900 via-night-900 to-black text-white transition-colors',
        theme === 'light' && 'from-white via-slate-100 to-slate-200 text-slate-900',
      )}
    >
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:gap-6 lg:px-6 lg:py-6">
        <div className="flex flex-1 flex-col gap-4">
          <HeaderBar />
          <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
            <div className="relative flex-1">
              <VisualHost />
            </div>
            <div className="lg:hidden">
              <ControlsPanel autoCycle={autoCycle} setAutoCycle={setAutoCycle} />
            </div>
          </div>
          <PermissionOverlay />
          <div>
            <PrivacyNotice />
          </div>
        </div>
        <div className="hidden lg:block lg:w-80 xl:w-96">
          <ControlsPanel autoCycle={autoCycle} setAutoCycle={setAutoCycle} />
        </div>
      </div>
      <InstallPrompt />
      <PerformanceStats show={showPerformance} />
    </div>
  )
}

export default App
