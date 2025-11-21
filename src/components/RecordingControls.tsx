import { useState, useCallback } from 'react'
import { Circle, Square, Download } from 'lucide-react'
import clsx from 'clsx'
import { canvasRecorder } from '../utils/recorder'

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function RecordingControls({ canvasRef }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  const startRecording = useCallback(async () => {
    if (!canvasRef.current) {
      alert('Canvas not available')
      return
    }

    try {
      await canvasRecorder.start(canvasRef.current, {
        fps: 30,
        videoBitsPerSecond: 5000000, // 5 Mbps for better quality
      })

      setIsRecording(true)
      setRecordingTime(0)

      // Update recording time every second
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      // Store interval ID to clear later
      ;(window as any).__recordingInterval = interval
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to start recording. Please check your permissions.')
    }
  }, [canvasRef])

  const stopRecording = useCallback(async () => {
    // Clear interval
    const interval = (window as any).__recordingInterval
    if (interval) {
      clearInterval(interval)
      delete (window as any).__recordingInterval
    }

    try {
      await canvasRecorder.download()
      setIsRecording(false)
      setRecordingTime(0)
    } catch (error) {
      console.error('Failed to stop recording:', error)
    }
  }, [])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-3">
      {!isRecording ? (
        <button
          onClick={startRecording}
          className={clsx(
            'flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white',
            'transition-all hover:scale-105 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30',
          )}
          aria-label="Start recording"
        >
          <Circle className="h-4 w-4 fill-current" />
          <span>Record</span>
        </button>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5">
            <Circle className="h-3 w-3 animate-pulse fill-red-500 text-red-500" />
            <span className="font-mono text-sm font-semibold text-white">
              {formatTime(recordingTime)}
            </span>
          </div>

          <button
            onClick={stopRecording}
            className={clsx(
              'flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white',
              'border border-white/20 transition-all hover:bg-white/20',
            )}
            aria-label="Stop recording and download"
          >
            <Square className="h-4 w-4" />
            <Download className="h-4 w-4" />
            <span>Stop & Download</span>
          </button>
        </>
      )}
    </div>
  )
}

