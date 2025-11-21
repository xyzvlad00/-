/**
 * Shape drawing utility functions for visual effects
 * Provides reusable shape drawing primitives
 */

/**
 * Draw a regular polygon
 */
export function drawPolygon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  sides: number,
  rotation: number = 0,
): void {
  if (sides < 3) return

  ctx.beginPath()
  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * Math.PI * 2 + rotation - Math.PI / 2
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

/**
 * Draw a star shape
 */
export function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number,
  points: number,
  rotation: number = 0,
): void {
  if (points < 3) return

  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 + rotation - Math.PI / 2
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

/**
 * Draw a circle with segments
 */
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  segments: number = 32,
): void {
  ctx.beginPath()
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

/**
 * Draw a rounded rectangle
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.arcTo(x + width, y, x + width, y + radius, radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
  ctx.lineTo(x + radius, y + height)
  ctx.arcTo(x, y + height, x, y + height - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
}

/**
 * Draw a wave line
 */
export function drawWaveLine(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  amplitude: number,
  frequency: number,
  phase: number = 0,
  segments: number = 50,
): void {
  ctx.beginPath()
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const x = startX + (endX - startX) * t
    const y = startY + (endY - startY) * t
    const wave = Math.sin(t * frequency * Math.PI * 2 + phase) * amplitude
    
    const dx = endX - startX
    const dy = endY - startY
    const length = Math.sqrt(dx * dx + dy * dy)
    
    const nx = -dy / length
    const ny = dx / length
    
    const px = x + nx * wave
    const py = y + ny * wave
    
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
}

/**
 * Draw a spiral
 */
export function drawSpiral(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  startRadius: number,
  endRadius: number,
  turns: number,
  segments: number = 100,
): void {
  ctx.beginPath()
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const angle = t * turns * Math.PI * 2
    const radius = startRadius + (endRadius - startRadius) * t
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
}

/**
 * Draw a petal shape
 */
export function drawPetal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  width: number,
  rotation: number = 0,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(width, length * 0.5, 0, length)
  ctx.quadraticCurveTo(-width, length * 0.5, 0, 0)
  ctx.closePath()
  
  ctx.restore()
}

/**
 * Draw a diamond
 */
export function drawDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x, y - height)
  ctx.lineTo(x + width, y)
  ctx.lineTo(x, y + height)
  ctx.lineTo(x - width, y)
  ctx.closePath()
}

/**
 * Draw a hexagon
 */
export function drawHexagon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number = 0,
): void {
  drawPolygon(ctx, x, y, radius, 6, rotation)
}

/**
 * Draw a gear tooth pattern
 */
export function drawGear(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  teeth: number,
  rotation: number = 0,
): void {
  ctx.beginPath()
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i / (teeth * 2)) * Math.PI * 2 + rotation
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

/**
 * Apply glow effect to current path
 */
export function applyGlow(
  ctx: CanvasRenderingContext2D,
  color: string,
  blur: number,
): void {
  ctx.shadowColor = color
  ctx.shadowBlur = blur
}

/**
 * Clear glow effect
 */
export function clearGlow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
}

