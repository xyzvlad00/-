import { useEffect, useState } from 'react'
import { audioEngine } from './AudioEngine'

export function useAudioActivity() {
  const [activity, setActivity] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActivity(audioEngine.getFrame().overallVolume)
    }, 400)

    return () => clearInterval(interval)
  }, [])

  return activity
}

