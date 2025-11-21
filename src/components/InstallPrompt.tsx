import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'
import clsx from 'clsx'
import {
  initInstallPrompt,
  showInstallPrompt,
  isAppInstalled,
  getInstallInstructions,
} from '../utils/pwa'

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (isAppInstalled()) {
      setIsInstalled(true)
      return
    }

    // Initialize install prompt
    initInstallPrompt(() => {
      // Show prompt after a short delay
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000) // 3 seconds after page load
    })
  }, [])

  const handleInstall = async () => {
    const outcome = await showInstallPrompt()

    if (outcome === 'accepted') {
      setShowPrompt(false)
      setIsInstalled(true)
    } else if (outcome === 'unavailable') {
      // Show platform-specific instructions
      alert(getInstallInstructions())
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again this session
    sessionStorage.setItem('install-prompt-dismissed', 'true')
  }

  // Don't show if installed or dismissed this session
  if (isInstalled || sessionStorage.getItem('install-prompt-dismissed')) {
    return null
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div
        className={clsx(
          'relative rounded-2xl border-2 border-aurora-400/30 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl',
          'animate-in slide-in-from-bottom-4 duration-300',
        )}
      >
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-lg p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Dismiss install prompt"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-gradient-to-br from-aurora-500 to-purple-500 p-3">
            <Download className="h-6 w-6 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">Install Audio Visualizer</h3>
            <p className="mt-1 text-sm text-white/70">
              Add to your home screen for a better experience. Works offline and loads faster!
            </p>

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleInstall}
                className={clsx(
                  'rounded-xl bg-gradient-to-r from-aurora-500 to-purple-500 px-6 py-2.5 text-sm font-semibold text-white',
                  'transition-all hover:scale-105 hover:shadow-lg hover:shadow-aurora-500/30',
                )}
              >
                Install
              </button>

              <button
                onClick={handleDismiss}
                className={clsx(
                  'rounded-xl border border-white/20 px-6 py-2.5 text-sm font-semibold text-white/80',
                  'transition-all hover:bg-white/10',
                )}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

