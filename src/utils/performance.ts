/**
 * Performance monitoring utilities
 * Tracks key metrics and provides insights into app performance
 */

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
}

interface FPSMetrics {
  current: number
  average: number
  min: number
  max: number
  samples: number[]
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private fpsMetrics: FPSMetrics = {
    current: 0,
    average: 0,
    min: Infinity,
    max: 0,
    samples: [],
  }
  private lastFrameTime: number = 0
  private frameCount: number = 0
  private isMonitoring: boolean = false

  /**
   * Start monitoring performance
   */
  start(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.lastFrameTime = performance.now()
    this.monitorFPS()
    this.trackWebVitals()

    console.log('[Performance] Monitoring started')
  }

  /**
   * Stop monitoring performance
   */
  stop(): void {
    this.isMonitoring = false
    console.log('[Performance] Monitoring stopped')
  }

  /**
   * Monitor FPS
   */
  private monitorFPS(): void {
    if (!this.isMonitoring) return

    const now = performance.now()
    const delta = now - this.lastFrameTime
    this.lastFrameTime = now

    if (delta > 0) {
      const fps = 1000 / delta
      this.fpsMetrics.current = Math.round(fps)

      // Keep last 60 samples (1 second at 60fps)
      this.fpsMetrics.samples.push(fps)
      if (this.fpsMetrics.samples.length > 60) {
        this.fpsMetrics.samples.shift()
      }

      // Calculate statistics
      this.fpsMetrics.average =
        Math.round(
          this.fpsMetrics.samples.reduce((a, b) => a + b, 0) / this.fpsMetrics.samples.length
        )
      this.fpsMetrics.min = Math.min(this.fpsMetrics.min, fps)
      this.fpsMetrics.max = Math.max(this.fpsMetrics.max, fps)
    }

    this.frameCount++
    requestAnimationFrame(() => this.monitorFPS())
  }

  /**
   * Track Web Vitals (Core Web Vitals)
   */
  private trackWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime, 'ms')
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.recordMetric('FID', entry.processingStart - entry.startTime, 'ms')
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })

        // Cumulative Layout Shift (CLS)
        let clsScore = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsScore += entry.value
              this.recordMetric('CLS', clsScore, 'score')
            }
          })
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        console.warn('[Performance] Could not observe Web Vitals:', error)
      }
    }

    // Time to First Byte (TTFB)
    if (performance.timing) {
      const ttfb = performance.timing.responseStart - performance.timing.requestStart
      if (ttfb > 0) {
        this.recordMetric('TTFB', ttfb, 'ms')
      }
    }
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, unit: string = 'ms'): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const metrics = this.metrics.get(name)!
    metrics.push(metric)

    // Keep only last 100 samples per metric
    if (metrics.length > 100) {
      metrics.shift()
    }

    console.log(`[Performance] ${name}: ${value.toFixed(2)} ${unit}`)
  }

  /**
   * Get FPS metrics
   */
  getFPS(): FPSMetrics {
    return { ...this.fpsMetrics }
  }

  /**
   * Get all metrics
   */
  getMetrics(): Map<string, PerformanceMetric[]> {
    return new Map(this.metrics)
  }

  /**
   * Get metric summary
   */
  getMetricSummary(name: string): {
    average: number
    min: number
    max: number
    latest: number
  } | null {
    const metrics = this.metrics.get(name)
    if (!metrics || metrics.length === 0) return null

    const values = metrics.map((m) => m.value)
    return {
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1],
    }
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage(): {
    used: number
    total: number
    limit: number
  } | null {
    const memory = (performance as any).memory
    if (!memory) return null

    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const fps = this.getFPS()
    const memory = this.getMemoryUsage()

    let report = '=== Performance Report ===\n\n'

    // FPS
    report += `FPS:\n`
    report += `  Current: ${fps.current}\n`
    report += `  Average: ${fps.average}\n`
    report += `  Min: ${Math.round(fps.min)}\n`
    report += `  Max: ${Math.round(fps.max)}\n\n`

    // Memory
    if (memory) {
      report += `Memory:\n`
      report += `  Used: ${memory.used} MB\n`
      report += `  Total: ${memory.total} MB\n`
      report += `  Limit: ${memory.limit} MB\n\n`
    }

    // Metrics
    report += `Metrics:\n`
    this.metrics.forEach((metrics, name) => {
      const summary = this.getMetricSummary(name)
      if (summary) {
        report += `  ${name}:\n`
        report += `    Average: ${summary.average.toFixed(2)} ${metrics[0].unit}\n`
        report += `    Min: ${summary.min.toFixed(2)} ${metrics[0].unit}\n`
        report += `    Max: ${summary.max.toFixed(2)} ${metrics[0].unit}\n`
      }
    })

    return report
  }

  /**
   * Log performance report to console
   */
  logReport(): void {
    console.log(this.generateReport())
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()
    this.fpsMetrics = {
      current: 0,
      average: 0,
      min: Infinity,
      max: 0,
      samples: [],
    }
    this.frameCount = 0
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Mark a performance event
 */
export function mark(name: string): void {
  performance.mark(name)
}

/**
 * Measure time between two marks
 */
export function measure(name: string, startMark: string, endMark: string): number {
  performance.measure(name, startMark, endMark)
  const measures = performance.getEntriesByName(name, 'measure')
  if (measures.length > 0) {
    const duration = measures[measures.length - 1].duration
    performanceMonitor.recordMetric(name, duration, 'ms')
    return duration
  }
  return 0
}

/**
 * Track component render time
 */
export function trackRender(componentName: string, callback: () => void): void {
  const startMark = `${componentName}-start`
  const endMark = `${componentName}-end`
  const measureName = `${componentName}-render`

  mark(startMark)
  callback()
  mark(endMark)
  measure(measureName, startMark, endMark)
}

/**
 * Debounced performance logger (logs every 10 seconds)
 */
let lastLogTime = 0
export function logPerformance(): void {
  const now = Date.now()
  if (now - lastLogTime > 10000) {
    performanceMonitor.logReport()
    lastLogTime = now
  }
}

