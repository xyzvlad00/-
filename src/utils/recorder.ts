/**
 * Canvas recorder for capturing visualization sessions
 * Uses Canvas.captureStream() and MediaRecorder API
 */

export class CanvasRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  private stream: MediaStream | null = null
  private isRecording: boolean = false

  /**
   * Start recording from a canvas element
   */
  async start(canvas: HTMLCanvasElement, options?: {
    mimeType?: string
    videoBitsPerSecond?: number
    audioBitsPerSecond?: number
    fps?: number
  }): Promise<void> {
    if (this.isRecording) {
      console.warn('[Recorder] Already recording')
      return
    }

    const fps = options?.fps || 30
    this.stream = canvas.captureStream(fps)

    // Add audio if available
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioTrack = audioStream.getAudioTracks()[0]
      this.stream.addTrack(audioTrack)
    } catch (error) {
      console.warn('[Recorder] Could not capture audio:', error)
    }

    // Determine best supported mime type
    const mimeType = options?.mimeType || this.getBestMimeType()

    const recorderOptions: MediaRecorderOptions = {
      mimeType,
      videoBitsPerSecond: options?.videoBitsPerSecond || 2500000, // 2.5 Mbps
      audioBitsPerSecond: options?.audioBitsPerSecond || 128000,   // 128 kbps
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, recorderOptions)
      this.recordedChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }

      this.mediaRecorder.onerror = (event: Event) => {
        console.error('[Recorder] MediaRecorder error:', event)
        this.stop()
      }

      this.mediaRecorder.start(100) // Collect data every 100ms
      this.isRecording = true

      console.log('[Recorder] Recording started with:', mimeType)
    } catch (error) {
      console.error('[Recorder] Failed to start recording:', error)
      this.cleanup()
      throw error
    }
  }

  /**
   * Stop recording and return the recorded video
   */
  async stop(): Promise<Blob | null> {
    if (!this.isRecording || !this.mediaRecorder) {
      return null
    }

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null)
        return
      }

      this.mediaRecorder.onstop = () => {
        if (this.recordedChunks.length === 0) {
          resolve(null)
          return
        }

        const mimeType = this.mediaRecorder?.mimeType || 'video/webm'
        const blob = new Blob(this.recordedChunks, { type: mimeType })
        
        this.cleanup()
        this.isRecording = false

        console.log('[Recorder] Recording stopped, size:', blob.size, 'bytes')
        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  /**
   * Download the recorded video
   */
  async download(filename?: string): Promise<void> {
    const blob = await this.stop()
    if (!blob) {
      console.warn('[Recorder] No recording to download')
      return
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = filename || `visualization-${Date.now()}.webm`
    document.body.appendChild(a)
    a.click()

    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  }

  /**
   * Get recording state
   */
  getState(): 'inactive' | 'recording' | 'paused' {
    if (!this.mediaRecorder) return 'inactive'
    return this.mediaRecorder.state
  }

  /**
   * Check if currently recording
   */
  isActive(): boolean {
    return this.isRecording
  }

  /**
   * Get supported mime types
   */
  private getBestMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4',
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return 'video/webm' // Fallback
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.recordedChunks = []
  }
}

// Singleton instance
export const canvasRecorder = new CanvasRecorder()

