import { useEffect } from 'react'
import { useAppStore } from '../state/useAppStore'
import { visualRegistry } from '../visuals/registry'

export function useKeyboardShortcuts() {
  const setVisualMode = useAppStore((state) => state.setVisualMode)
  const toggleTheme = useAppStore((state) => state.toggleTheme)
  const setSensitivity = useAppStore((state) => state.setSensitivity)
  const sensitivity = useAppStore((state) => state.sensitivity)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const key = e.key.toLowerCase()

      if (key >= '1' && key <= '9') {
        const index = parseInt(key) - 1
        if (index < visualRegistry.length) {
          setVisualMode(visualRegistry[index].id)
        }
      }

      if (key === '0') {
        const index = 9
        if (index < visualRegistry.length) {
          setVisualMode(visualRegistry[index].id)
        }
      }

      if (key === 't') {
        toggleTheme()
      }

      if (key === '+' || key === '=') {
        setSensitivity(Math.min(2, sensitivity + 0.1))
      }

      if (key === '-' || key === '_') {
        setSensitivity(Math.max(0.5, sensitivity - 0.1))
      }

      if (key === 'f') {
        const container = document.getElementById('visual-container')
        if (container) {
          if (!document.fullscreenElement) {
            container.requestFullscreen()
          } else {
            document.exitFullscreen()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [setVisualMode, toggleTheme, setSensitivity, sensitivity])
}

