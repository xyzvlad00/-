import { useState, useEffect } from 'react'
import { Activity } from 'lucide-react'
import clsx from 'clsx'
import { performanceMonitor } from '../utils/performance'

interface Props {
  show: boolean
}

export function PerformanceStats({ show }: Props) {
  const [fps, setFps] = useState({ current: 0, average: 0, min: 0, max: 0 })
  const [memory, setMemory] = useState<{ used: number; total: number; limit: number } | null>(null)

  useEffect(() => {
    if (!show) return

    const interval = setInterval(() => {
      const fpsData = performanceMonitor.getFPS()
      setFps({
        current: fpsData.current,
        average: fpsData.average,
        min: Math.round(fpsData.min),
        max: Math.round(fpsData.max),
      })

      const memoryData = performanceMonitor.getMemoryUsage()
      setMemory(memoryData)
    }, 500) // Update every 500ms

    return () => clearInterval(interval)
  }, [show])

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div
        className={clsx(
          'rounded-xl border border-white/20 bg-black/80 p-4 text-xs backdrop-blur-xl',
          'font-mono shadow-2xl',
        )}
      >
        <div className="mb-2 flex items-center gap-2 border-b border-white/20 pb-2">
          <Activity className="h-4 w-4 text-aurora-400" />
          <span className="font-semibold text-white">Performance</span>
        </div>

        {/* FPS */}
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-white/60">FPS:</span>
            <span className={clsx('font-semibold', getFPSColor(fps.current))}>
              {fps.current}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-white/60">Avg:</span>
            <span className="text-white">{fps.average}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-white/60">Min/Max:</span>
            <span className="text-white">
              {fps.min} / {fps.max}
            </span>
          </div>
        </div>

        {/* Memory */}
        {memory && (
          <div className="mt-3 space-y-1 border-t border-white/20 pt-3">
            <div className="flex justify-between gap-4">
              <span className="text-white/60">Memory:</span>
              <span className="text-white">{memory.used} MB</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-white/60">Total:</span>
              <span className="text-white">{memory.total} MB</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-aurora-500 to-purple-500"
                style={{ width: `${(memory.used / memory.limit) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getFPSColor(fps: number): string {
  if (fps >= 55) return 'text-green-400'
  if (fps >= 30) return 'text-yellow-400'
  return 'text-red-400'
}

