import { create } from 'zustand'
import type { AudioStatus, ThemeMode, VisualMode } from './types'

interface AppState {
  audioStatus: AudioStatus
  audioMessage?: string
  visualMode: VisualMode
  sensitivity: number
  smoothMotion: boolean
  theme: ThemeMode
  setAudioStatus: (status: AudioStatus, message?: string) => void
  setVisualMode: (mode: VisualMode) => void
  setSensitivity: (value: number) => void
  toggleSmoothMotion: () => void
  toggleTheme: () => void
}

export const useAppStore = create<AppState>((set) => ({
  audioStatus: 'idle',
  audioMessage: undefined,
  visualMode: 'morph-kaleid',
  sensitivity: 1,
  smoothMotion: true,
  theme: 'dark',
  setAudioStatus: (audioStatus, audioMessage) => set({ audioStatus, audioMessage }),
  setVisualMode: (visualMode) => set({ visualMode }),
  setSensitivity: (sensitivity) => set({ sensitivity }),
  toggleSmoothMotion: () => set((state) => ({ smoothMotion: !state.smoothMotion })),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),
}))

