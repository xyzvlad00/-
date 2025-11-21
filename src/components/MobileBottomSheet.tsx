import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { X, ChevronUp, ChevronDown } from 'lucide-react'

interface MobileBottomSheetProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  title: string
}

export function MobileBottomSheet({ children, isOpen, onClose, title }: MobileBottomSheetProps) {
  const [height, setHeight] = useState<'collapsed' | 'half' | 'full'>('half')
  const sheetRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const currentYRef = useRef(0)

  useEffect(() => {
    if (!isOpen) {
      setHeight('half')
    }
  }, [isOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    currentYRef.current = e.touches[0].clientY
  }

  const handleTouchEnd = () => {
    const deltaY = currentYRef.current - startYRef.current

    if (Math.abs(deltaY) > 50) {
      if (deltaY < 0) {
        // Swipe up
        if (height === 'collapsed') setHeight('half')
        else if (height === 'half') setHeight('full')
      } else {
        // Swipe down
        if (height === 'full') setHeight('half')
        else if (height === 'half') setHeight('collapsed')
        else onClose()
      }
    }
  }

  const heightStyles = {
    collapsed: 'h-16',
    half: 'h-[50vh]',
    full: 'h-[85vh]',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-40',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={clsx(
          'fixed bottom-0 left-0 right-0 bg-night-800/95 backdrop-blur-xl rounded-t-3xl shadow-2xl transition-transform duration-300 z-50',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          heightStyles[height]
        )}
      >
        {/* Handle */}
        <div
          className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-white/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {height === 'collapsed' && (
              <p className="text-xs text-white/60 mt-0.5">Tap to expand</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {height !== 'full' && (
              <button
                onClick={() => setHeight('full')}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Expand"
              >
                <ChevronUp className="w-5 h-5 text-white/70" />
              </button>
            )}
            {height !== 'collapsed' && (
              <button
                onClick={() => setHeight('collapsed')}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Collapse"
              >
                <ChevronDown className="w-5 h-5 text-white/70" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={clsx(
          'px-6 py-4 overflow-y-auto',
          height === 'collapsed' && 'hidden'
        )}
        style={{ maxHeight: 'calc(100% - 100px)' }}
        >
          {children}
        </div>
      </div>
    </>
  )
}

