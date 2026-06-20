// src/renderer/src/components/ui/ZoomableCanvas.tsx
// Zoomable Canvas: Sayfa icerigini zoom durumuna göre scale eder. Header disinda kalir.

import React from 'react'
import { useUIStore } from '../../store/useUIStore'

interface ZoomableCanvasProps {
  pageKey: string
  className?: string
  children: React.ReactNode
}

export const ZoomableCanvas: React.FC<ZoomableCanvasProps> = ({
  pageKey,
  className = '',
  children
}) => {
  const pageZooms = useUIStore((state) => state.pageZooms || {})
  const zoom = pageZooms[pageKey] ?? 1

  return (
    <div
      className={`origin-top-left transition-transform duration-75 ${className}`}
      style={{
        transform: `scale(${zoom})`,
        width: '1280px',
        minHeight: '100%'
      }}
    >
      {children}
    </div>
  )
}

export default ZoomableCanvas
