// src/renderer/src/components/ScreenshotGallery.tsx
// Screenshot gallery component for project details (Phase 10)

import React, { useEffect, useState, useMemo } from 'react'
import { Camera, Trash2, X, Loader2, ImageOff, Download, FolderOutput } from 'lucide-react'
import { Button } from './ui/Button'
import type { ScreenshotIPC } from '../../../shared/types'

interface Props {
  projectId: string
  blurIntensity: 'off' | 'low' | 'high'
}

export const ScreenshotGallery: React.FC<Props> = ({ projectId, blurIntensity }) => {
  const [screenshots, setScreenshots] = useState<ScreenshotIPC[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotIPC | null>(null)
  const [imageData, setImageData] = useState<Record<string, string>>({})
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())

  // Fetch screenshots on mount
  useEffect(() => {
    fetchScreenshots()
  }, [projectId])

  const fetchScreenshots = async () => {
    setIsLoading(true)
    try {
      const response = await window.api.getScreenshotsByProject(projectId)
      if (response.success && response.data) {
        setScreenshots(response.data)
        // Load thumbnail images
        response.data.forEach((ss) => loadImage(ss.id, ss.filePath))
      }
    } catch (error) {
      console.error('Failed to fetch screenshots:', error)
    }
    setIsLoading(false)
  }

  const loadImage = async (id: string, filePath: string) => {
    if (imageData[id] || loadingImages.has(id)) return

    setLoadingImages((prev) => new Set(prev).add(id))
    try {
      const response = await window.api.getScreenshotImage(filePath)
      if (response.success && response.data) {
        setImageData((prev) => ({ ...prev, [id]: response.data! }))
      }
    } catch (error) {
      console.error('Failed to load image:', error)
    }
    setLoadingImages((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  // Group screenshots by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, ScreenshotIPC[]> = {}
    const today = new Date().toLocaleDateString()
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString()

    screenshots.forEach((ss) => {
      const dateStr = new Date(ss.timestamp).toLocaleDateString()
      let label = dateStr
      if (dateStr === today) label = 'Today'
      else if (dateStr === yesterday) label = 'Yesterday'

      if (!groups[label]) groups[label] = []
      groups[label].push(ss)
    })

    return groups
  }, [screenshots])

  const handleDelete = async (id: string) => {
    const confirmDeduct = window.confirm(
      'Delete this screenshot?\n\nClick OK to also deduct the associated time from the log.\nClick Cancel to delete screenshot only.'
    )

    try {
      await window.api.deleteScreenshot(id, confirmDeduct)
      setScreenshots((prev) => prev.filter((ss) => ss.id !== id))
      if (selectedScreenshot?.id === id) {
        setSelectedScreenshot(null)
      }
    } catch (error) {
      console.error('Failed to delete screenshot:', error)
    }
  }

  const handleExport = async (filePath: string) => {
    try {
      const response = await window.api.exportScreenshot(filePath)
      if (response.success) {
        alert(`Screenshot exported to: ${response.data}`)
      }
    } catch (error) {
      console.error('Failed to export screenshot:', error)
    }
  }

  const handleExportAll = async () => {
    try {
      const response = await window.api.exportAllScreenshots(projectId)
      if (response.success && response.data) {
        alert(`Exported ${response.data.count} screenshots to: ${response.data.folder}`)
      }
    } catch (error) {
      console.error('Failed to export screenshots:', error)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Blur CSS class based on setting
  const blurClass =
    blurIntensity === 'high'
      ? 'blur-lg hover:blur-none transition-all duration-300'
      : blurIntensity === 'low'
        ? 'blur-sm hover:blur-none transition-all duration-300'
        : ''

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (screenshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Camera className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Screenshots Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Screenshots will appear here when captured during timer sessions. Enable screenshot
          tracking in Settings to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {screenshots.length > 0 && (
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={handleExportAll}>
            <FolderOutput className="h-4 w-4 mr-2" />
            Export All ({screenshots.length})
          </Button>
        </div>
      )}

      {Object.entries(groupedByDate).map(([date, items]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((ss) => (
              <div
                key={ss.id}
                className="group relative bg-card border border-border rounded-lg overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedScreenshot(ss)}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-muted flex items-center justify-center">
                  {imageData[ss.id] ? (
                    <img
                      src={`data:image/png;base64,${imageData[ss.id]}`}
                      alt={`Screenshot at ${formatTime(ss.timestamp)}`}
                      className={`w-full h-full object-cover ${blurClass}`}
                    />
                  ) : loadingImages.has(ss.id) ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <ImageOff className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                {/* Timestamp */}
                <div className="p-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatTime(ss.timestamp)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(ss.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Lightbox Modal */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-12 right-0 text-white hover:bg-white/10"
              onClick={() => setSelectedScreenshot(null)}
            >
              <X className="h-5 w-5" />
            </Button>

            {imageData[selectedScreenshot.id] ? (
              <img
                src={`data:image/png;base64,${imageData[selectedScreenshot.id]}`}
                alt={`Screenshot at ${formatTime(selectedScreenshot.timestamp)}`}
                className={`w-full rounded-lg ${blurClass}`}
              />
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-white/80 text-sm">
                {new Date(selectedScreenshot.timestamp).toLocaleString()}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(selectedScreenshot.filePath)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(selectedScreenshot.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScreenshotGallery
