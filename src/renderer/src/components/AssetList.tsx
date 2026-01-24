// src/renderer/src/components/AssetList.tsx
// Asset Vault - Link files/folders to projects

import { useState, useEffect } from 'react'
import { Folder, File, ExternalLink, Plus, Trash2, Copy, Check } from 'lucide-react'
import { Button } from './ui/Button'
import type { AssetIPC } from '../../../shared/types'

interface AssetListProps {
  projectId: string
}

export function AssetList({ projectId }: AssetListProps) {
  const [assets, setAssets] = useState<AssetIPC[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Fetch assets on mount
  useEffect(() => {
    fetchAssets()
  }, [projectId])

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const response = await window.api.getAssetsByProject(projectId)
      if (response.success && response.data) {
        setAssets(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAsset = async () => {
    try {
      const result = await window.api.showOpenDialog({
        properties: ['openFile', 'openDirectory']
      })

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        const fileName = filePath.split(/[/\\]/).pop() || 'Untitled'

        // Determine type based on path (simple heuristic)
        const isDirectory = !filePath.includes('.')
        const type: 'folder' | 'file' = isDirectory ? 'folder' : 'file'

        const response = await window.api.createAsset({
          projectId,
          name: fileName,
          path: filePath,
          type
        })

        if (response.success && response.data) {
          setAssets((prev) => [...prev, response.data!])
        }
      }
    } catch (error) {
      console.error('Failed to add asset:', error)
    }
  }

  const handleOpenAsset = async (path: string) => {
    try {
      const response = await window.api.openAsset(path)
      if (!response.success) {
        console.error('Failed to open asset:', response.error)
      }
    } catch (error) {
      console.error('Failed to open asset:', error)
    }
  }

  const handleDeleteAsset = async (id: string) => {
    try {
      const response = await window.api.deleteAsset(id)
      if (response.success) {
        setAssets((prev) => prev.filter((asset) => asset.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete asset:', error)
    }
  }

  const handleCopyPath = async (id: string, path: string) => {
    try {
      await navigator.clipboard.writeText(path)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy path:', error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'folder':
        return <Folder className="w-4 h-4 text-yellow-500" />
      case 'link':
        return <ExternalLink className="w-4 h-4 text-blue-500" />
      default:
        return <File className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Loading assets...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Linked Resources</h3>
        <Button variant="outline" size="sm" onClick={handleAddAsset}>
          <Plus className="w-4 h-4 mr-1" />
          Link Resource
        </Button>
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No linked resources yet</p>
          <p className="text-xs mt-1">Click "Link Resource" to add files or folders</p>
        </div>
      ) : (
        <div className="space-y-1">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleOpenAsset(asset.path)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', asset.path)
                e.dataTransfer.effectAllowed = 'copy'
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getIcon(asset.type)}
                <span className="text-sm truncate">{asset.name}</span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1 hover:bg-muted rounded"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopyPath(asset.id, asset.path)
                  }}
                  title="Copy path"
                >
                  {copiedId === asset.id ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
                <button
                  className="p-1 hover:bg-destructive/10 rounded"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteAsset(asset.id)
                  }}
                  title="Remove link"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Drag an asset to copy its path. Click to open in your system.
      </p>
    </div>
  )
}
