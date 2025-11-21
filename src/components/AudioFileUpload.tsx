import { useRef } from 'react'
import { Upload, Music } from 'lucide-react'
import clsx from 'clsx'
import { audioEngine } from '../audio/AudioEngine'

interface Props {
  onFileLoaded?: (filename: string) => void
}

export function AudioFileUpload({ onFileLoaded }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if it's an audio file
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file')
      return
    }

    try {
      await audioEngine.loadAudioFile(file)
      onFileLoaded?.(file.name)
    } catch (error) {
      console.error('Failed to load audio file:', error)
      alert('Failed to load audio file')
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload audio file"
      />

      <button
        onClick={handleClick}
        className={clsx(
          'group relative w-full overflow-hidden rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-4',
          'transition-all hover:border-aurora-400/50 hover:bg-white/10',
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-gradient-to-br from-aurora-500 to-purple-500 p-3">
            <Upload className="h-5 w-5 text-white" />
          </div>

          <div className="text-center">
            <p className="font-semibold text-white">Upload Audio File</p>
            <p className="mt-1 text-xs text-white/60">MP3, WAV, OGG, or other audio formats</p>
          </div>
        </div>

        {/* Animated background on hover */}
        <div
          className={clsx(
            'pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100',
            'bg-gradient-to-r from-aurora-500/10 via-purple-500/10 to-pink-500/10',
          )}
        />
      </button>

      <div className="flex items-center gap-2 text-xs text-white/50">
        <Music className="h-3 w-3" />
        <span>Or use your microphone for real-time visualization</span>
      </div>
    </div>
  )
}

