import { useAppStore } from '../state/useAppStore'

export function PrivacyNotice() {
  const theme = useAppStore((state) => state.theme)
  const isDark = theme === 'dark'

  return (
    <div
      className={
        isDark
          ? 'rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs text-white/70 backdrop-blur'
          : 'rounded-2xl border border-black/10 bg-white px-5 py-3 text-xs text-slate-600 shadow'
      }
    >
      Audio is processed live in your browser only. Nothing is recorded or stored.
    </div>
  )
}

