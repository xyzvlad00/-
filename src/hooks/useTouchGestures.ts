import { useEffect, useRef } from 'react'
import { useAppStore } from '../state/useAppStore'
import { visualRegistry } from '../visuals/registry'

// Touch gesture controls for mobile
export function useTouchGestures() {
  const visualMode = useAppStore((state) => state.visualMode)
  const setVisualMode = useAppStore((state) => state.setVisualMode)
  const sensitivity = useAppStore((state) => state.sensitivity)
  const setSensitivity = useAppStore((state) => state.setSensitivity)
  
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastPinchDistanceRef = useRef<number | null>(null)

  useEffect(() => {
    let touchStartX = 0
    let touchStartY = 0
    let touchStartTime = 0

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - track for swipe
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
        touchStartTime = Date.now()
        touchStartRef.current = { x: touchStartX, y: touchStartY, time: touchStartTime }
      } else if (e.touches.length === 2) {
        // Two fingers - track for pinch
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        lastPinchDistanceRef.current = Math.sqrt(dx * dx + dy * dy)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastPinchDistanceRef.current) {
        // Pinch to zoom (adjust sensitivity)
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        const delta = (distance - lastPinchDistanceRef.current) / 100
        const newSensitivity = Math.max(0.5, Math.min(2.0, sensitivity + delta))
        setSensitivity(parseFloat(newSensitivity.toFixed(1)))
        
        lastPinchDistanceRef.current = distance
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1 && touchStartRef.current) {
        const touchEndX = e.changedTouches[0].clientX
        const touchEndY = e.changedTouches[0].clientY
        const touchEndTime = Date.now()

        const deltaX = touchEndX - touchStartRef.current.x
        const deltaY = touchEndY - touchStartRef.current.y
        const deltaTime = touchEndTime - touchStartRef.current.time

        // Detect swipe (minimum distance and speed)
        const absX = Math.abs(deltaX)
        const absY = Math.abs(deltaY)
        
        if (deltaTime < 500 && absX > 80 && absX > absY * 2) {
          // Horizontal swipe
          const currentIndex = visualRegistry.findIndex(v => v.id === visualMode)
          
          if (deltaX > 0) {
            // Swipe right - previous mode
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : visualRegistry.length - 1
            setVisualMode(visualRegistry[prevIndex].id)
            
            // Haptic feedback if available
            if ('vibrate' in navigator) {
              navigator.vibrate(50)
            }
          } else {
            // Swipe left - next mode
            const nextIndex = currentIndex < visualRegistry.length - 1 ? currentIndex + 1 : 0
            setVisualMode(visualRegistry[nextIndex].id)
            
            // Haptic feedback if available
            if ('vibrate' in navigator) {
              navigator.vibrate(50)
            }
          }
        }
      }

      // Reset tracking
      touchStartRef.current = null
      lastPinchDistanceRef.current = null
    }

    // Add listeners with passive: false for preventDefault
    const visualContainer = document.getElementById('visual-container')
    if (visualContainer) {
      visualContainer.addEventListener('touchstart', handleTouchStart, { passive: false })
      visualContainer.addEventListener('touchmove', handleTouchMove, { passive: false })
      visualContainer.addEventListener('touchend', handleTouchEnd, { passive: true })
    }

    return () => {
      if (visualContainer) {
        visualContainer.removeEventListener('touchstart', handleTouchStart)
        visualContainer.removeEventListener('touchmove', handleTouchMove)
        visualContainer.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [visualMode, setVisualMode, sensitivity, setSensitivity])
}

