import clsx from 'clsx'
import { visualRegistry } from '../visuals/registry'
import { useAppStore } from '../state/useAppStore'

interface ControlsPanelProps {
  autoCycle: boolean
  setAutoCycle: (value: boolean) => void
}

export function ControlsPanel({ autoCycle, setAutoCycle }: ControlsPanelProps) {
  const visualMode = useAppStore((state) => state.visualMode)
  const setVisualMode = useAppStore((state) => state.setVisualMode)
  const sensitivity = useAppStore((state) => state.sensitivity)
  const setSensitivity = useAppStore((state) => state.setSensitivity)
  const smoothMotion = useAppStore((state) => state.smoothMotion)
  const toggleSmoothMotion = useAppStore((state) => state.toggleSmoothMotion)
  const theme = useAppStore((state) => state.theme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)

  const isDark = theme === 'dark'

  return (
    <aside
      className={clsx(
        'w-full max-w-sm rounded-3xl p-6 text-sm backdrop-blur-md lg:max-w-xs transition-all duration-500 hover:shadow-2xl',
        isDark ? 'border border-white/5 bg-black/40 text-white/90 hover:border-white/10 hover:bg-black/50' : 'border border-black/10 bg-white text-slate-700 shadow-xl hover:shadow-3xl',
      )}
    >
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between transition-all duration-300 hover:translate-x-1">
          <h2 className={clsx('text-lg font-semibold transition-colors duration-300', isDark ? 'text-white hover:text-teal-300' : 'text-slate-900 hover:text-sky-600')}>Visual Modes</h2>
          <span className={clsx('text-xs uppercase tracking-[0.2em] transition-colors duration-300', isDark ? 'text-white/50 hover:text-white/70' : 'text-slate-500 hover:text-slate-700')}>Live</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {visualRegistry.map((visual) => {
            const isActive = visualMode === visual.id
            return (
              <button
                key={visual.id}
                type="button"
                onClick={() => setVisualMode(visual.id)}
                aria-label={`Switch to ${visual.name} visual mode`}
                aria-pressed={isActive}
                className={clsx(
                  'rounded-2xl border px-3 py-3 text-left transition-all duration-300 hover:scale-110 hover:shadow-xl hover:-translate-y-1',
                  isDark
                    ? isActive
                      ? 'border-aurora-500/70 bg-aurora-500/10 text-white shadow-glow'
                      : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10'
                    : isActive
                      ? 'border-aurora-500/40 bg-aurora-500/10 text-slate-900 shadow-glow'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-aurora-500/30 hover:bg-slate-100',
                )}
              >
                <p className="text-sm font-semibold">{visual.name}</p>
                <p className={clsx('text-xs', isDark ? 'text-white/60' : 'text-slate-500')}>{visual.description}</p>
              </button>
            )
          })}
        </div>
      </section>
      <section className="mb-8 space-y-4">
        <div className="group">
          <div className="mb-2 flex items-center justify-between transition-all duration-300 group-hover:translate-x-1">
            <h3 className={clsx('font-semibold transition-colors duration-300', isDark ? 'text-white group-hover:text-teal-300' : 'text-slate-900 group-hover:text-sky-600')}>Sensitivity</h3>
            <span className={clsx('text-xs transition-colors duration-300', isDark ? 'text-white/60 group-hover:text-white/80' : 'text-slate-500 group-hover:text-slate-700')}>{sensitivity.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={sensitivity}
            onChange={(event) => setSensitivity(parseFloat(event.target.value))}
            aria-label="Audio sensitivity level"
            aria-valuenow={sensitivity}
            aria-valuemin={0.5}
            aria-valuemax={2}
            className="w-full accent-aurora-500"
          />
        </div>
        <label
          className={clsx(
            'flex items-center justify-between rounded-2xl border px-3 py-2',
            isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50',
          )}
        >
          <div>
            <p className={clsx('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>Smooth motion</p>
            <p className={clsx('text-xs', isDark ? 'text-white/60' : 'text-slate-500')}>Stabilize visuals vs. responsiveness</p>
          </div>
          <input
            type="checkbox"
            checked={smoothMotion}
            onChange={toggleSmoothMotion}
            aria-label="Toggle smooth motion"
            className="h-5 w-5 accent-aurora-500"
          />
        </label>
        <label
          className={clsx(
            'flex items-center justify-between rounded-2xl border px-3 py-2',
            isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50',
          )}
        >
          <div>
            <p className={clsx('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>Auto-cycle</p>
            <p className={clsx('text-xs', isDark ? 'text-white/60' : 'text-slate-500')}>Rotate effects every 30s</p>
          </div>
          <input
            type="checkbox"
            checked={autoCycle}
            onChange={(e) => setAutoCycle(e.target.checked)}
            aria-label="Toggle auto-cycle mode"
            className="h-5 w-5 accent-aurora-500"
          />
        </label>
        <label
          className={clsx(
            'flex items-center justify-between rounded-2xl border px-3 py-2',
            isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50',
          )}
        >
          <div>
            <p className={clsx('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>Theme</p>
            <p className={clsx('text-xs', isDark ? 'text-white/60' : 'text-slate-500')}>Switch between dark & light</p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            className={clsx('rounded-full px-4 py-1 text-sm', isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-900')}
          >
            {isDark ? 'Dark' : 'Light'}
          </button>
        </label>
      </section>
      <section
        className={clsx(
          'rounded-2xl border p-4 text-xs',
          isDark ? 'border-white/10 bg-white/5 text-white/60' : 'border-slate-200 bg-slate-50 text-slate-500',
        )}
      >
        <p className="mb-2">Keyboard shortcuts: 1-9 for modes, T for theme, F for fullscreen, +/- for sensitivity</p>
        <p>Visuals are powered by live microphone input. Adjust sensitivity if your space is quiet or loud.</p>
      </section>
    </aside>
  )
}

