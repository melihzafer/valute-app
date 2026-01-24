// src/main/services/AssetService.ts
// Asset Vault - Link files/folders to projects

import { v4 as uuidv4 } from 'uuid'
import { eq } from 'drizzle-orm'
import { shell } from 'electron'
import { getDb } from '../db/index'
import { assets } from '../db/schema'

export interface Asset {
  id: string
  projectId: string
  name: string
  path: string
  type: 'folder' | 'file' | 'link'
  createdAt: Date | null
}

/**
 * Create a new asset (link a file/folder to a project)
 */
export async function createAsset(data: Omit<Asset, 'id' | 'createdAt'>): Promise<Asset> {
  const db = getDb()

  const newAsset = {
    id: uuidv4(),
    projectId: data.projectId,
    name: data.name,
    path: data.path,
    type: data.type
  }

  db.insert(assets).values(newAsset).run()

  const inserted = db.select().from(assets).where(eq(assets.id, newAsset.id)).get()

  return inserted as Asset
}

/**
 * Get all assets for a project
 */
export async function getAssetsByProject(projectId: string): Promise<Asset[]> {
  const db = getDb()

  const result = db.select().from(assets).where(eq(assets.projectId, projectId)).all()

  return result as Asset[]
}

/**
 * Delete an asset (does NOT delete the actual file/folder)
 */
export async function deleteAsset(id: string): Promise<void> {
  const db = getDb()
  db.delete(assets).where(eq(assets.id, id)).run()
}

/**
 * Open an asset in the OS default application
 * Uses Electron's shell.openPath for security (only opens local paths)
 */
export async function openAsset(path: string): Promise<string> {
  // shell.openPath returns an empty string on success, or an error message
  const result = await shell.openPath(path)
  return result
}

/**
 * Get a single asset by ID
 */
export async function getAssetById(id: string): Promise<Asset | null> {
  const db = getDb()
  const result = db.select().from(assets).where(eq(assets.id, id)).get()
  return result as Asset | null
}
