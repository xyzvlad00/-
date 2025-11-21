import { useEffect, useRef } from 'react'
import { useAppStore } from '../state/useAppStore'
import { visualRegistry } from '../visuals/registry'

export function useAutoCycle(enabled: boolean, intervalSeconds: number = 30) {
  const setVisualMode = useAppStore((state) => state.setVisualMode)
  const currentMode = useAppStore((state) => state.visualMode)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const cycleToNext = () => {
      const currentIndex = visualRegistry.findIndex((v) => v.id === currentMode)
      const nextIndex = (currentIndex + 1) % visualRegistry.length
      setVisualMode(visualRegistry[nextIndex].id)
    }

    timerRef.current = window.setInterval(cycleToNext, intervalSeconds * 1000)

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }
    }
  }, [enabled, intervalSeconds, currentMode, setVisualMode])
}

