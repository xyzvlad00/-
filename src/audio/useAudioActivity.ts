import { useEffect, useState } from 'react'
import { enhancedAudioEngine } from './EnhancedAudioEngine'

export function useAudioActivity() {
  const [activity, setActivity] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActivity(enhancedAudioEngine.getFrame().overallVolume)
    }, 400)

    return () => clearInterval(interval)
  }, [])

  return activity
}

