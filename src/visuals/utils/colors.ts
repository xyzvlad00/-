/**
 * Color utility functions for visual effects
 * Provides consistent color generation and gradient helpers
 */

/**
 * Convert HSL to RGB color string
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0,
    g = 0,
    b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else if (h >= 300 && h < 360) {
    r = c
    g = 0
    b = x
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

/**
 * Generate HSL color string
 */
export function hsl(hue: number, saturation: number, lightness: number, alpha?: number): string {
  if (alpha !== undefined) {
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
  }
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * Generate RGB color string
 */
export function rgb(r: number, g: number, b: number, alpha?: number): string {
  if (alpha !== undefined) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Create a radial gradient
 */
export function createRadialGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  stops: Array<{ offset: number; color: string }>,
): CanvasGradient {
  const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius)
  stops.forEach(({ offset, color }) => {
    gradient.addColorStop(offset, color)
  })
  return gradient
}

/**
 * Create a linear gradient
 */
export function createLinearGradient(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  stops: Array<{ offset: number; color: string }>,
): CanvasGradient {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
  stops.forEach(({ offset, color }) => {
    gradient.addColorStop(offset, color)
  })
  return gradient
}

/**
 * Generate color from frequency ratio (0-1)
 */
export function frequencyColor(ratio: number, time: number, energyBoost: number): string {
  const hue = (ratio * 280 + time * 30 + energyBoost * 60) % 360
  const saturation = 85 + energyBoost * 15
  const lightness = 60 + energyBoost * 20
  return hsl(hue, saturation, lightness)
}

/**
 * Generate color with audio influence
 */
export function audioColor(
  baseHue: number,
  magnitude: number,
  time: number,
  alpha: number = 1,
): string {
  const hue = (baseHue + magnitude * 80 + time * 20) % 360
  const saturation = 85 + magnitude * 10
  const lightness = 55 + magnitude * 25
  return hsl(hue, saturation, lightness, alpha)
}

/**
 * Interpolate between two colors
 */
export function lerpColor(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  t: number,
): { r: number; g: number; b: number } {
  return {
    r: color1.r + (color2.r - color1.r) * t,
    g: color1.g + (color2.g - color1.g) * t,
    b: color1.b + (color2.b - color1.b) * t,
  }
}

/**
 * Get color palette for theme
 */
export function getThemePalette(theme: 'dark' | 'light'): {
  primary: string[]
  secondary: string[]
  accent: string[]
} {
  if (theme === 'dark') {
    return {
      primary: ['rgba(64,243,255,1)', 'rgba(90,105,255,1)', 'rgba(255,112,203,1)'],
      secondary: ['rgba(30,30,60,1)', 'rgba(40,20,50,1)', 'rgba(20,40,60,1)'],
      accent: ['rgba(255,200,100,1)', 'rgba(100,255,200,1)', 'rgba(200,100,255,1)'],
    }
  } else {
    return {
      primary: ['rgba(10,25,45,1)', 'rgba(30,80,120,1)', 'rgba(255,90,120,1)'],
      secondary: ['rgba(200,210,230,1)', 'rgba(220,200,230,1)', 'rgba(200,220,240,1)'],
      accent: ['rgba(255,150,50,1)', 'rgba(50,200,150,1)', 'rgba(150,50,200,1)'],
    }
  }
}

