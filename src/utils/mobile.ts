// Mobile device detection and optimization utilities

export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0)
}

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent)
}

export const getDevicePerformanceTier = (): 'low' | 'medium' | 'high' => {
  // Check for performance indicators
  const memory = (performance as any).memory?.jsHeapSizeLimit
  const cores = navigator.hardwareConcurrency || 1
  const isMobileDevice = isMobile()

  if (!isMobileDevice) {
    // Desktop - likely high performance
    return 'high'
  }

  // Mobile performance estimation
  if (cores >= 6 && memory > 2000000000) {
    return 'high' // Flagship mobile
  } else if (cores >= 4) {
    return 'medium' // Mid-range mobile
  } else {
    return 'low' // Budget mobile
  }
}

export const getMobileOptimizedSettings = () => {
  const tier = getDevicePerformanceTier()
  const mobile = isMobile()

  return {
    particleReduction: mobile ? (tier === 'low' ? 0.3 : tier === 'medium' ? 0.5 : 0.7) : 1,
    maxFPS: mobile ? (tier === 'low' ? 30 : 60) : 60,
    quality: tier,
    enableTrails: tier !== 'low',
    enableGlow: tier !== 'low',
    resolutionScale: mobile ? (tier === 'low' ? 0.6 : tier === 'medium' ? 0.8 : 0.9) : 1,
  }
}

export const preventMobileBounce = () => {
  // Prevent iOS bounce/scroll
  if (isIOS()) {
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    document.body.style.overflow = 'hidden'
  }
}

export const enableMobileScroll = () => {
  // Re-enable scroll
  if (isIOS()) {
    document.body.style.position = ''
    document.body.style.width = ''
    document.body.style.height = ''
    document.body.style.overflow = ''
  }
}

export const requestWakeLock = async (): Promise<WakeLockSentinel | null> => {
  try {
    if ('wakeLock' in navigator) {
      return await (navigator as any).wakeLock.request('screen')
    }
  } catch (err) {
    console.warn('Wake Lock not supported or denied')
  }
  return null
}

export const getOptimalCanvasSize = (containerWidth: number, containerHeight: number) => {
  const mobile = isMobile()
  const tier = getDevicePerformanceTier()
  
  let scale = 1
  
  if (mobile) {
    if (tier === 'low') {
      scale = 0.5 // 50% resolution
    } else if (tier === 'medium') {
      scale = 0.75 // 75% resolution
    } else {
      scale = 0.85 // 85% resolution
    }
  }
  
  return {
    width: Math.floor(containerWidth * scale),
    height: Math.floor(containerHeight * scale),
    scale,
  }
}

export const addIOSSafeAreas = () => {
  // Add CSS variables for iOS safe areas
  if (isIOS()) {
    const root = document.documentElement
    root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)')
    root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right)')
    root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)')
    root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left)')
  }
}

