import type { LazyExoticComponent } from 'react'
import type { ThemeMode, VisualMode } from '../state/types'

export interface VisualComponentProps {
  sensitivity: number
  smoothMotion: boolean
  theme: ThemeMode
}

export interface VisualDefinition {
  id: VisualMode
  name: string
  description: string
  Component: React.FC<VisualComponentProps> | LazyExoticComponent<React.FC<VisualComponentProps>>
}

