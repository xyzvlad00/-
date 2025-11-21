/**
 * PWA utilities for service worker registration and install prompts
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      console.log('[PWA] Service Worker registered:', registration.scope)

      // Check for updates periodically
      setInterval(() => {
        registration.update()
      }, 60 * 60 * 1000) // Every hour

      return registration
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error)
      return null
    }
  }

  return null
}

/**
 * Initialize PWA install prompt listener
 */
export function initInstallPrompt(
  onPromptAvailable: (prompt: BeforeInstallPromptEvent) => void,
): void {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault()

    // Stash the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent

    console.log('[PWA] Install prompt available')
    onPromptAvailable(deferredPrompt)
  })

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully')
    deferredPrompt = null
  })
}

/**
 * Show install prompt
 */
export async function showInstallPrompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) {
    return 'unavailable'
  }

  // Show the install prompt
  await deferredPrompt.prompt()

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice

  console.log('[PWA] User choice:', outcome)

  // Clear the deferred prompt
  deferredPrompt = null

  return outcome
}

/**
 * Check if app is installed
 */
export function isAppInstalled(): boolean {
  // Check if running in standalone mode
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  )
}

/**
 * Check if install prompt is available
 */
export function isInstallPromptAvailable(): boolean {
  return deferredPrompt !== null
}

/**
 * Get install instructions based on platform
 */
export function getInstallInstructions(): string {
  const userAgent = navigator.userAgent.toLowerCase()

  if (userAgent.includes('android')) {
    return 'Tap the menu icon and select "Add to Home screen" or "Install app"'
  }

  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'Tap the share button and select "Add to Home Screen"'
  }

  if (userAgent.includes('mac')) {
    return 'Click the install icon in the address bar or use the menu'
  }

  return 'Click the install button to add this app to your device'
}

