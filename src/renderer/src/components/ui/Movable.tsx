// src/renderer/src/components/ui/Movable.tsx
// Serbest tasima: surukleme tasiyici icon (Grip) uzerinden yapilir.
// Konum, boyut ve z-index localStorage'da sayfa+id bazinda saklanir.
// Sag tik ile "Bring to Front" (One Getir) ve "Send to Back" (Arkaya Gonder) secenekleri sunulur.

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GripHorizontal, ArrowUp, ArrowDown, RotateCcw, Lock, Unlock, EyeOff } from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'
import { useDashboardStore, type WidgetId } from '../../store/useDashboardStore'

interface Offset {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

const offsetStorageKey = (pageKey: string): string => `valute-freemove:${pageKey}`
const sizeStorageKey = (pageKey: string): string => `valute-freesize:${pageKey}`
const zIndexStorageKey = (pageKey: string): string => `valute-freezindex:${pageKey}`
const lockStorageKey = (pageKey: string): string => `valute-freelock:${pageKey}`

function loadLocks(pageKey: string): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(lockStorageKey(pageKey)) || '{}')
  } catch {
    return {}
  }
}

function saveLock(pageKey: string, id: string, locked: boolean): void {
  const all = loadLocks(pageKey)
  if (locked) all[id] = true
  else delete all[id]
  localStorage.setItem(lockStorageKey(pageKey), JSON.stringify(all))
}

function loadOffsets(pageKey: string): Record<string, Offset> {
  try {
    return JSON.parse(localStorage.getItem(offsetStorageKey(pageKey)) || '{}')
  } catch {
    return {}
  }
}

function saveOffset(pageKey: string, id: string, offset: Offset | null): void {
  const all = loadOffsets(pageKey)
  if (offset) all[id] = offset
  else delete all[id]
  localStorage.setItem(offsetStorageKey(pageKey), JSON.stringify(all))
}

function loadSizes(pageKey: string): Record<string, Size> {
  try {
    return JSON.parse(localStorage.getItem(sizeStorageKey(pageKey)) || '{}')
  } catch {
    return {}
  }
}

function saveSize(pageKey: string, id: string, size: Size | null): void {
  const all = loadSizes(pageKey)
  if (size) all[id] = size
  else delete all[id]
  localStorage.setItem(sizeStorageKey(pageKey), JSON.stringify(all))
}

function loadZIndexes(pageKey: string): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(zIndexStorageKey(pageKey)) || '{}')
  } catch {
    return {}
  }
}

function saveZIndex(pageKey: string, id: string, z: number | null): void {
  const all = loadZIndexes(pageKey)
  if (z !== null) all[id] = z
  else delete all[id]
  localStorage.setItem(zIndexStorageKey(pageKey), JSON.stringify(all))
}

interface MovableProps {
  pageKey: string
  id: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
}

export const Movable: React.FC<MovableProps> = ({
  pageKey,
  id,
  disabled = false,
  className = '',
  children,
  minWidth = 200,
  maxWidth = 1280,
  minHeight = 100,
  maxHeight = 1000
}) => {
  const [offset, setOffset] = useState<Offset>(() => loadOffsets(pageKey)[id] ?? { x: 0, y: 0 })
  const [size, setSize] = useState<Size | null>(() => loadSizes(pageKey)[id] ?? null)
  const [zIndex, setZIndex] = useState<number>(() => loadZIndexes(pageKey)[id] ?? 10)
  const [isLocked, setIsLocked] = useState<boolean>(() => !!loadLocks(pageKey)[id])
  const isCanvasLocked = useDashboardStore((state) => state.isCanvasLocked)
  const locked = isLocked || isCanvasLocked

  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const startDrag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)
  const startResize = useRef<{ px: number; py: number; sw: number; sh: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const resizeHandleRef = useRef<HTMLDivElement>(null)

  const pageZooms = useUIStore((state) => state.pageZooms || {})
  const zoom = pageZooms[pageKey] ?? 1

  // Close context menu on click elsewhere
  useEffect(() => {
    const closeMenu = () => setContextMenu(null)
    if (contextMenu) {
      window.addEventListener('click', closeMenu)
      window.addEventListener('contextmenu', closeMenu)
    }
    return () => {
      window.removeEventListener('click', closeMenu)
      window.removeEventListener('contextmenu', closeMenu)
    }
  }, [contextMenu])

  // Listen for global page layout resets
  useEffect(() => {
    const handleReset = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.pageKey === pageKey) {
        setOffset({ x: 0, y: 0 })
        setSize(null)
        setZIndex(10)
        setIsLocked(false)
      }
    }
    window.addEventListener('valute-reset-layout', handleReset)
    return () => window.removeEventListener('valute-reset-layout', handleReset)
  }, [pageKey])

  // Handle drag pointer down
  const onDragPointerDown = (e: React.PointerEvent): void => {
    if (disabled || locked || e.button !== 0) return
    e.stopPropagation()

    setDragging(true)
    startDrag.current = {
      px: e.clientX,
      py: e.clientY,
      ox: offset.x,
      oy: offset.y
    }

    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId)
    }
  }

  // Handle drag pointer move
  const onDragPointerMove = (e: React.PointerEvent): void => {
    if (!dragging || !startDrag.current) return
    e.preventDefault()

    setOffset({
      x: startDrag.current.ox + (e.clientX - startDrag.current.px) / zoom,
      y: startDrag.current.oy + (e.clientY - startDrag.current.py) / zoom
    })
  }

  // Handle drag pointer up
  const onDragPointerUp = (e: React.PointerEvent): void => {
    if (dragging) {
      if (containerRef.current) {
        containerRef.current.releasePointerCapture(e.pointerId)
      }
      setDragging(false)
      startDrag.current = null
      saveOffset(pageKey, id, offset.x === 0 && offset.y === 0 ? null : offset)
    }
  }

  // Handle resize pointer down
  const onResizePointerDown = (e: React.PointerEvent): void => {
    if (disabled || locked || e.button !== 0) return
    e.stopPropagation()

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    // BoundingClientRect size is scaled by zoom, so we need the unscaled size.
    const currentWidth = size ? size.width : rect.width / zoom
    const currentHeight = size ? size.height : rect.height / zoom

    startResize.current = {
      px: e.clientX,
      py: e.clientY,
      sw: currentWidth,
      sh: currentHeight
    }
    setResizing(true)

    if (resizeHandleRef.current) {
      resizeHandleRef.current.setPointerCapture(e.pointerId)
    }
  }

  // Handle resize pointer move
  const onResizePointerMove = (e: React.PointerEvent): void => {
    if (!resizing || !startResize.current) return
    e.stopPropagation()
    e.preventDefault()

    const deltaX = (e.clientX - startResize.current.px) / zoom
    const deltaY = (e.clientY - startResize.current.py) / zoom

    const newWidth = Math.min(maxWidth, Math.max(minWidth, startResize.current.sw + deltaX))
    const newHeight = Math.min(maxHeight, Math.max(minHeight, startResize.current.sh + deltaY))

    const newSize = { width: newWidth, height: newHeight }
    setSize(newSize)
    saveSize(pageKey, id, newSize)
  }

  // Handle resize pointer up
  const onResizePointerUp = (e: React.PointerEvent): void => {
    if (resizing) {
      e.stopPropagation()
      if (resizeHandleRef.current) {
        resizeHandleRef.current.releasePointerCapture(e.pointerId)
      }
      setResizing(false)
      startResize.current = null
    }
  }

  // Handle right-click context menu
  const onContextMenu = (e: React.MouseEvent): void => {
    if (disabled || isCanvasLocked) return
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const bringToFront = (e: React.MouseEvent): void => {
    e.stopPropagation()
    const all = loadZIndexes(pageKey)
    const values = Object.values(all)
    const max = values.length > 0 ? Math.max(...values) : 10
    const newZ = max + 1
    setZIndex(newZ)
    saveZIndex(pageKey, id, newZ)
    setContextMenu(null)
  }

  const sendToBack = (e: React.MouseEvent): void => {
    e.stopPropagation()
    const all = loadZIndexes(pageKey)
    const values = Object.values(all)
    const min = values.length > 0 ? Math.min(...values) : 10
    const newZ = Math.max(1, min - 1)
    setZIndex(newZ)
    saveZIndex(pageKey, id, newZ)
    setContextMenu(null)
  }

  // Double click resets position, size and z-index
  const onReset = (e: React.MouseEvent): void => {
    e.stopPropagation()
    setOffset({ x: 0, y: 0 })
    setSize(null)
    setZIndex(10)
    setIsLocked(false)
    saveOffset(pageKey, id, null)
    saveSize(pageKey, id, null)
    saveZIndex(pageKey, id, null)
    saveLock(pageKey, id, false)
    setContextMenu(null)
  }

  const moved = offset.x !== 0 || offset.y !== 0

  return (
    <div
      ref={containerRef}
      onPointerMove={onDragPointerMove}
      onPointerUp={onDragPointerUp}
      onPointerCancel={onDragPointerUp}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onContextMenu={onContextMenu}
      data-movable-id={id}
      className={`${className} ${dragging ? 'z-50 opacity-90' : ''} ${
        moved ? 'relative' : ''
      } relative group/movable`}
      style={{
        transform: moved || dragging ? `translate(${offset.x}px, ${offset.y}px)` : undefined,
        width: size ? `${size.width}px` : undefined,
        height: size ? `${size.height}px` : undefined,
        minWidth: `${minWidth}px`,
        maxWidth: maxWidth ? `${maxWidth}px` : undefined,
        minHeight: `${minHeight}px`,
        maxHeight: maxHeight ? `${maxHeight}px` : undefined,
        zIndex: dragging ? 9999 : hovered ? zIndex + 100 : zIndex,
        touchAction: dragging ? 'none' : undefined,
        transition: dragging || resizing ? 'none' : 'transform 150ms ease'
      }}
    >
      {!disabled && !locked && (
        <>
          {/* Drag Handle Icon - top left */}
          <div
            ref={dragHandleRef}
            onPointerDown={onDragPointerDown}
            onDoubleClick={onReset}
            className="absolute -top-2 -left-2 z-[60] h-6 w-6 rounded-full bg-background border border-border shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground hover:scale-110 transition-all opacity-0 group-hover/movable:opacity-100 duration-150"
            title="Drag to move • Double-click to reset"
          >
            <GripHorizontal className="h-3.5 w-3.5" />
          </div>

          {/* Custom Resize Handle - bottom right */}
          <div
            ref={resizeHandleRef}
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            onPointerCancel={onResizePointerUp}
            className="absolute bottom-1 right-1 z-[60] h-4 w-4 cursor-se-resize flex items-end justify-end p-0.5 opacity-0 group-hover/movable:opacity-100 transition-opacity duration-150"
            title="Drag to resize"
          >
            <svg
              className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-foreground transition-colors"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="6" x2="6" y2="22" />
              <line x1="22" y1="12" x2="12" y2="22" />
              <line x1="22" y1="18" x2="18" y2="22" />
            </svg>
          </div>
        </>
      )}
      {locked && hovered && (
        <div className="absolute -top-2 -right-2 z-[60] h-6 w-6 rounded-full bg-background border border-border shadow-md flex items-center justify-center text-muted-foreground animate-in fade-in zoom-in-95 duration-100">
          <Lock className="h-3 w-3 text-red-500" />
        </div>
      )}
      <div
        className={`w-full flex flex-col overflow-hidden [&>*]:w-full [&>*]:flex [&>*]:flex-col [&>*]:overflow-auto [&_p]:whitespace-normal [&_p]:break-words [&_span]:break-words [&_div]:break-words [&_textarea]:w-full [&_textarea]:h-full [&_textarea]:resize-none ${
          size ? 'h-full [&>*]:h-full' : ''
        }`}
      >
        {children}
      </div>

      {/* Right-click Context Menu */}
      {contextMenu &&
        createPortal(
          <div
            className="fixed z-[99999] bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-lg py-1 w-44 text-sm animate-in fade-in zoom-in-95 duration-100"
            style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={bringToFront}
              className="w-full text-left px-3 py-2 hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
            >
              <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
              Bring to Front
            </button>
            <button
              onClick={sendToBack}
              className="w-full text-left px-3 py-2 hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
            >
              <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
              Send to Back
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                const nextLock = !isLocked
                setIsLocked(nextLock)
                saveLock(pageKey, id, nextLock)
                setContextMenu(null)
              }}
              className="w-full text-left px-3 py-2 hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2 font-medium"
            >
              {isLocked ? (
                <>
                  <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                  Unlock Layout
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Lock Layout
                </>
              )}
            </button>
            {pageKey === 'dashboard' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  useDashboardStore.getState().toggleWidget(id as WidgetId)
                  setContextMenu(null)
                }}
                className="w-full text-left px-3 py-2 hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
              >
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                Hide Widget
              </button>
            )}
            <div className="border-t border-border my-1" />
            <button
              onClick={onReset}
              className="w-full text-left px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Layout
            </button>
          </div>,
          document.body
        )}
    </div>
  )
}

export default Movable
