import React, { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Keyboard, X } from 'lucide-react'
import Sidebar from './Sidebar'
import TimerWidget from './TimerWidget'
import { CommandMenu } from './CommandMenu'
import { Toaster } from './ui/Toast'
import OnboardingModal from './OnboardingModal'
import { useTimerStore } from '../store/useTimerStore'
import { useProjectStore } from '../store/useProjectStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useUIStore } from '../store/useUIStore'
import { useDashboardStore } from '../store/useDashboardStore'
import { applyTheme } from '../lib/themes'

const getPageKeyFromPath = (pathname: string): string => {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return 'dashboard'
  return parts[0]
}

const canvasPages = ['dashboard']

const Layout: React.FC = () => {
  const { timerState, isRunning, pauseTimer, resumeTimer, stopTimer, loadTimerState, tick } =
    useTimerStore()
  const { fetchProjects } = useProjectStore()
  const { loadSettings } = useSettingsStore()
  const { theme, customTheme, fontScale, pageZooms, setPageZoom } = useUIStore()
  const { pathname } = useLocation()
  const pageKey = getPageKeyFromPath(pathname)
  const zoom = pageZooms[pageKey] ?? 1
  const mainRef = useRef<HTMLDivElement>(null)

  const isCanvasPage = canvasPages.includes(pageKey)
  const isCanvasLocked = useDashboardStore((state) => state.isCanvasLocked)

  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const lockedScrollPos = useRef({ scrollLeft: 0, scrollTop: 0 })

  // Listen for "?" key to toggle shortcuts menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }

      if (e.key === '?') {
        e.preventDefault()
        setIsShortcutsOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Capture scroll position on lock and clean up panning state
  useEffect(() => {
    if (isCanvasLocked) {
      setIsSpacePressed(false)
      setIsPanning(false)
      if (mainRef.current) {
        lockedScrollPos.current = {
          scrollLeft: mainRef.current.scrollLeft,
          scrollTop: mainRef.current.scrollTop
        }
      }
    }
  }, [isCanvasLocked])

  // Listen for Space key to toggle panning mode (only on dashboard page)
  useEffect(() => {
    if (pageKey !== 'dashboard') {
      setIsSpacePressed(false)
      setIsPanning(false)
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }
      if (useDashboardStore.getState().isCanvasLocked) {
        const scrollKeys = [
          'Space',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'PageUp',
          'PageDown',
          'Home',
          'End'
        ]
        if (scrollKeys.includes(e.code) || scrollKeys.includes(e.key)) {
          e.preventDefault()
        }
        return
      }
      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
      }
    }

    const handleBlur = () => {
      setIsSpacePressed(false)
      setIsPanning(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [pageKey])

  interface MiniWidget {
    id: string
    left: number
    top: number
    width: number
    height: number
  }

  const [scrollState, setScrollState] = useState({
    scrollLeft: 0,
    scrollTop: 0,
    scrollWidth: 1,
    scrollHeight: 1,
    clientWidth: 1,
    clientHeight: 1
  })
  const [widgets, setWidgets] = useState<MiniWidget[]>([])

  // Update scroll bounds whenever main container scrolls or window resizes
  useEffect(() => {
    const main = mainRef.current
    if (!main || pageKey !== 'dashboard') return

    const handleScroll = () => {
      if (useDashboardStore.getState().isCanvasLocked) {
        main.scrollLeft = lockedScrollPos.current.scrollLeft
        main.scrollTop = lockedScrollPos.current.scrollTop
        return
      }
      setScrollState({
        scrollLeft: main.scrollLeft,
        scrollTop: main.scrollTop,
        scrollWidth: main.scrollWidth || 1,
        scrollHeight: main.scrollHeight || 1,
        clientWidth: main.clientWidth || 1,
        clientHeight: main.clientHeight || 1
      })
    }

    handleScroll()

    main.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)

    return () => {
      main.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [pageKey])

  // Track position of widgets on the dashboard in real-time when panning/Space is held
  useEffect(() => {
    if (!isSpacePressed || !mainRef.current || pageKey !== 'dashboard') {
      setWidgets([])
      return
    }

    const updateWidgets = () => {
      const main = mainRef.current
      if (!main) return
      const mainRect = main.getBoundingClientRect()
      const elements = main.querySelectorAll('.group\\/movable')
      const list: MiniWidget[] = []

      elements.forEach((el, index) => {
        const rect = el.getBoundingClientRect()
        const left = rect.left - mainRect.left + main.scrollLeft
        const top = rect.top - mainRect.top + main.scrollTop
        list.push({
          id: el.getAttribute('data-movable-id') || `widget-${index}`,
          left,
          top,
          width: rect.width,
          height: rect.height
        })
      })
      setWidgets(list)
    }

    updateWidgets()
    const interval = setInterval(updateWidgets, 500)
    return () => clearInterval(interval)
  }, [isSpacePressed, pageKey])

  // Apply theme to document root
  useEffect(() => {
    applyTheme(theme, customTheme)
  }, [theme, customTheme])

  // Kok font boyutu: tum rem tabanli olculer (Tailwind) birlikte olceklenir
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}px`
  }, [fontScale])

  // App-wide bootstrap: restore timer, load projects & settings once
  useEffect(() => {
    loadTimerState()
    fetchProjects()
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Global 1s tick so the timer is live on every page, not just the dashboard
  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => tick(), 1000)
    return () => clearInterval(interval)
  }, [isRunning, tick])

  // Handle Ctrl + Scroll zoom & Normal Scroll block when locked
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const locked = useDashboardStore.getState().isCanvasLocked

      // Block all wheel/scroll/zoom events on the dashboard canvas when locked
      if (locked && pageKey === 'dashboard') {
        e.preventDefault()
        return
      }

      if (e.ctrlKey) {
        e.preventDefault()
        const zoomStep = 0.05
        const delta = -e.deltaY
        const currentZoom = useUIStore.getState().pageZooms[pageKey] ?? 1
        let nextZoom = currentZoom
        if (delta > 0) {
          nextZoom = Math.min(2.5, currentZoom + zoomStep)
        } else {
          nextZoom = Math.max(0.4, currentZoom - zoomStep)
        }
        setPageZoom(pageKey, parseFloat(nextZoom.toFixed(2)))
      }
    }

    const mainElement = mainRef.current
    if (mainElement) {
      mainElement.addEventListener('wheel', handleWheel, { passive: false })
    }
    return () => {
      if (mainElement) {
        mainElement.removeEventListener('wheel', handleWheel)
      }
    }
  }, [pageKey, setPageZoom])

  // Listen for reset requests from pages
  useEffect(() => {
    const handleRequestReset = (e: Event) => {
      const customEvent = e as CustomEvent
      const targetPageKey = customEvent.detail?.pageKey
      if (targetPageKey) {
        setPageZoom(targetPageKey, 1)
        try {
          localStorage.removeItem(`valute-freemove:${targetPageKey}`)
          localStorage.removeItem(`valute-freesize:${targetPageKey}`)
          localStorage.removeItem(`valute-freezindex:${targetPageKey}`)
          localStorage.removeItem(`valute-freelock:${targetPageKey}`)
        } catch (err) {
          console.error(err)
        }
        window.dispatchEvent(
          new CustomEvent('valute-reset-layout', { detail: { pageKey: targetPageKey } })
        )
        if (targetPageKey === 'dashboard') {
          useDashboardStore.getState().resetLayout()
          if (mainRef.current) {
            const container = mainRef.current
            container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2
            container.scrollTop = (container.scrollHeight - container.clientHeight) / 2
          }
        }
      }
    }
    window.addEventListener('valute-request-reset-layout', handleRequestReset)
    return () => window.removeEventListener('valute-request-reset-layout', handleRequestReset)
  }, [setPageZoom])

  // Auto-unlock dashboard canvas when navigating away from dashboard
  useEffect(() => {
    if (pageKey !== 'dashboard' && useDashboardStore.getState().isCanvasLocked) {
      useDashboardStore.getState().setCanvasLocked(false)
    }
  }, [pageKey])

  // Center scroll position on mount or pageKey change to dashboard
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    if (pageKey === 'dashboard' && mainRef.current) {
      const container = mainRef.current
      timer = setTimeout(() => {
        container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2
        container.scrollTop = (container.scrollHeight - container.clientHeight) / 2
        // If the canvas mounted locked, keep the lock anchored to the centered
        // position — otherwise a locked reload strands the user in the empty
        // top-left corner with no way to scroll or zoom back to their widgets.
        lockedScrollPos.current = {
          scrollLeft: container.scrollLeft,
          scrollTop: container.scrollTop
        }
      }, 50)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [pageKey])

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <CommandMenu />
      <Sidebar />
      <main
        ref={mainRef}
        className={`flex-1 ${
          isCanvasPage && pageKey === 'dashboard'
            ? isCanvasLocked
              ? 'overflow-hidden'
              : 'overflow-auto no-scrollbar'
            : 'overflow-y-auto overflow-x-hidden'
        } ${
          isSpacePressed && !isCanvasLocked
            ? isPanning
              ? 'cursor-grabbing select-none'
              : 'cursor-grab select-none'
            : ''
        }`}
        onPointerDown={(e) => {
          if (isCanvasLocked || !isSpacePressed || e.button !== 0 || !mainRef.current) return
          setIsPanning(true)
          mainRef.current.setPointerCapture(e.pointerId)
          panStart.current = {
            x: e.clientX,
            y: e.clientY,
            scrollLeft: mainRef.current.scrollLeft,
            scrollTop: mainRef.current.scrollTop
          }
        }}
        onPointerMove={(e) => {
          if (!isPanning || !mainRef.current) return
          const dx = e.clientX - panStart.current.x
          const dy = e.clientY - panStart.current.y
          mainRef.current.scrollLeft = panStart.current.scrollLeft - dx
          mainRef.current.scrollTop = panStart.current.scrollTop - dy
        }}
        onPointerUp={(e) => {
          if (isPanning && mainRef.current) {
            mainRef.current.releasePointerCapture(e.pointerId)
            setIsPanning(false)
          }
        }}
        onPointerCancel={(e) => {
          if (isPanning && mainRef.current) {
            mainRef.current.releasePointerCapture(e.pointerId)
            setIsPanning(false)
          }
        }}
      >
        <div className={pageKey === 'dashboard' ? 'p-[1200px] w-fit' : 'p-8'}>
          <Outlet />
        </div>
      </main>
      <TimerWidget
        timerState={timerState}
        onPause={pauseTimer}
        onResume={resumeTimer}
        onStop={stopTimer}
      />
      {isCanvasPage && (
        <div className="fixed bottom-8 right-8 z-50 bg-background/95 backdrop-blur-md border border-border px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (isCanvasLocked) return
                const currentZoom = pageZooms[pageKey] ?? 1
                setPageZoom(pageKey, Math.max(0.4, parseFloat((currentZoom - 0.1).toFixed(2))))
              }}
              disabled={isCanvasLocked}
              className={`h-5 w-5 rounded-full hover:bg-accent flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground font-bold ${
                isCanvasLocked ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              title="Zoom Out"
            >
              -
            </button>
            <span className="min-w-10 text-center font-mono select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => {
                if (isCanvasLocked) return
                const currentZoom = pageZooms[pageKey] ?? 1
                setPageZoom(pageKey, Math.min(2.5, parseFloat((currentZoom + 0.1).toFixed(2))))
              }}
              disabled={isCanvasLocked}
              className={`h-5 w-5 rounded-full hover:bg-accent flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground font-bold ${
                isCanvasLocked ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              title="Zoom In"
            >
              +
            </button>
          </div>
        </div>
      )}
      {isSpacePressed && pageKey === 'dashboard' && (
        <div
          className="fixed bottom-24 right-8 z-[1000] bg-background/90 backdrop-blur-md border border-border p-2 rounded-xl shadow-2xl w-48 transition-all animate-in fade-in zoom-in-95 duration-200"
          style={{
            height: `${Math.round(176 * (scrollState.scrollHeight / scrollState.scrollWidth)) + 36}px`,
            minHeight: '100px',
            maxHeight: '260px'
          }}
        >
          <div className="relative w-full h-[calc(100%-20px)] bg-muted/30 rounded-lg overflow-hidden border border-border/50">
            {widgets.map((w) => {
              const scale = 176 / scrollState.scrollWidth
              return (
                <div
                  key={w.id}
                  className="absolute bg-primary/20 border border-primary/30 rounded-sm"
                  style={{
                    left: `${w.left * scale}px`,
                    top: `${w.top * scale}px`,
                    width: `${w.width * scale}px`,
                    height: `${w.height * scale}px`
                  }}
                />
              )
            })}
            {(() => {
              const scale = 176 / scrollState.scrollWidth
              return (
                <div
                  className="absolute border-2 border-primary bg-primary/10 rounded"
                  style={{
                    left: `${scrollState.scrollLeft * scale}px`,
                    top: `${scrollState.scrollTop * scale}px`,
                    width: `${scrollState.clientWidth * scale}px`,
                    height: `${scrollState.clientHeight * scale}px`
                  }}
                />
              )
            })()}
          </div>
          <div className="text-[10px] text-center text-muted-foreground mt-1.5 font-bold uppercase tracking-wider select-none">
            Minimap
          </div>
        </div>
      )}
      {isShortcutsOpen && (
        <div
          className="fixed inset-0 z-[1100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsShortcutsOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-card/95 border border-border rounded-xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsShortcutsOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold tracking-tight text-foreground mb-6 flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-primary animate-pulse" />
              Keyboard Shortcuts
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Global Actions
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm py-1 border-b border-border/40">
                    <span className="text-foreground/90 font-medium">Open Command Menu</span>
                    <kbd className="px-2 py-0.5 rounded border border-border bg-muted font-mono text-xs shadow-sm">
                      Ctrl + K
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1 border-b border-border/40">
                    <span className="text-foreground/90 font-medium">Toggle Shortcut Help</span>
                    <kbd className="px-2 py-0.5 rounded border border-border bg-muted font-mono text-xs shadow-sm">
                      ?
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1 border-b border-border/40">
                    <span className="text-foreground/90 font-medium">Global Play/Pause Timer</span>
                    <kbd className="px-2 py-0.5 rounded border border-border bg-muted font-mono text-xs shadow-sm">
                      Ctrl + Alt + Space
                    </kbd>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Dashboard Canvas (Unlocked)
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm py-1 border-b border-border/40">
                    <span className="text-foreground/90 font-medium">Pan Canvas</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      Hold{' '}
                      <kbd className="px-2 py-0.5 rounded border border-border bg-muted font-mono text-xs shadow-sm">
                        Space
                      </kbd>{' '}
                      + Drag
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1 border-b border-border/40">
                    <span className="text-foreground/90 font-medium">Zoom Canvas</span>
                    <span className="text-xs text-muted-foreground">Scroll or Pinch</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1 border-b border-border/40">
                    <span className="text-foreground/90 font-medium">Move Widgets</span>
                    <span className="text-xs text-muted-foreground">Drag widget headers</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center text-xs text-muted-foreground">
              Click anywhere outside or press{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono text-[10px]">
                Esc
              </kbd>{' '}
              to close.
            </div>
          </div>
        </div>
      )}
      <Toaster />
      <OnboardingModal />
    </div>
  )
}

export default Layout
