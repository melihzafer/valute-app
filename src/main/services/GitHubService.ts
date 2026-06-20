// src/main/services/GitHubService.ts
// Service for integrating with GitHub APIs (Milestone M3)

import { getDb } from '../db/index'
import { projects, tasks } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { getSetting } from './SettingsService'
import { v4 as uuidv4 } from 'uuid'

interface RepoSummary {
  openIssuesCount: number
  openPrsCount: number
}

/**
 * Helper to parse owner and repo name from GitHub URL
 */
export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  if (!url) return null
  const cleanUrl = url.trim()
  const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (match) {
    const owner = match[1]
    const repo = match[2]
      .replace(/\.git$/, '')
      .split('#')[0]
      .split('?')[0]
    return { owner, repo }
  }
  return null
}

/**
 * Fetch open issues and PR counts for a GitHub repo
 */
export async function getRepoSummary(githubUrl: string): Promise<RepoSummary> {
  const parsed = parseGithubUrl(githubUrl)
  if (!parsed) {
    throw new Error('Invalid GitHub URL')
  }

  const { owner, repo } = parsed
  const pat = await getSetting('github.pat')
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Valute-App'
  }

  if (pat) {
    // Parse PAT if it has quotes around it (due to JSON.stringify)
    let cleanPat = pat.trim()
    if (cleanPat.startsWith('"') && cleanPat.endsWith('"')) {
      cleanPat = cleanPat.substring(1, cleanPat.length - 1)
    }
    if (cleanPat) {
      headers['Authorization'] = `token ${cleanPat}`
    }
  }

  try {
    // Query issues count
    const issuesRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${owner}/${repo}+type:issue+state:open`,
      { headers }
    )
    if (!issuesRes.ok) {
      const errText = await issuesRes.text()
      throw new Error(`GitHub API error: ${issuesRes.status} ${errText}`)
    }
    const issuesData = (await issuesRes.json()) as any
    const openIssuesCount = issuesData.total_count ?? 0

    // Query PRs count
    const prsRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${owner}/${repo}+type:pr+state:open`,
      { headers }
    )
    if (!prsRes.ok) {
      const errText = await prsRes.text()
      throw new Error(`GitHub API error: ${prsRes.status} ${errText}`)
    }
    const prsData = (await prsRes.json()) as any
    const openPrsCount = prsData.total_count ?? 0

    return { openIssuesCount, openPrsCount }
  } catch (error: any) {
    console.error(`[GitHubService] Failed to get repo summary for ${owner}/${repo}:`, error)
    return { openIssuesCount: 0, openPrsCount: 0 }
  }
}

/**
 * Create a GitHub issue from a local task
 */
export async function createGithubIssue(
  taskId: string,
  projectId: string,
  title: string,
  notes: string | null
): Promise<{ issueNumber: number; issueUrl: string }> {
  const db = getDb()
  const project = db.select().from(projects).where(eq(projects.id, projectId)).get()
  if (!project || !project.githubUrl) {
    throw new Error('Project does not have a linked GitHub repository')
  }

  const parsed = parseGithubUrl(project.githubUrl)
  if (!parsed) {
    throw new Error('Invalid project GitHub URL')
  }

  const pat = await getSetting('github.pat')
  if (!pat) {
    throw new Error('GitHub Personal Access Token (PAT) is not configured in settings')
  }

  let cleanPat = pat.trim()
  if (cleanPat.startsWith('"') && cleanPat.endsWith('"')) {
    cleanPat = cleanPat.substring(1, cleanPat.length - 1)
  }

  if (!cleanPat) {
    throw new Error('GitHub PAT is empty')
  }

  const { owner, repo } = parsed
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      Authorization: `token ${cleanPat}`,
      'User-Agent': 'Valute-App'
    },
    body: JSON.stringify({
      title,
      body: notes || 'Created from Valute tasks'
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create issue: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as any
  const issueNumber = data.number
  const issueUrl = data.html_url

  // Link issue to local task
  db.update(tasks)
    .set({
      githubIssueNumber: issueNumber,
      githubIssueUrl: issueUrl
    })
    .where(eq(tasks.id, taskId))
    .run()

  return { issueNumber, issueUrl }
}

/**
 * Sync todos from GitHub repository for a project
 */
export async function syncGithubIssues(projectId: string): Promise<void> {
  const db = getDb()
  const project = db.select().from(projects).where(eq(projects.id, projectId)).get()
  if (!project || !project.githubUrl) {
    return
  }

  const parsed = parseGithubUrl(project.githubUrl)
  if (!parsed) return

  const { owner, repo } = parsed
  const pat = await getSetting('github.pat')
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Valute-App'
  }

  if (pat) {
    let cleanPat = pat.trim()
    if (cleanPat.startsWith('"') && cleanPat.endsWith('"')) {
      cleanPat = cleanPat.substring(1, cleanPat.length - 1)
    }
    if (cleanPat) {
      headers['Authorization'] = `token ${cleanPat}`
    }
  }

  try {
    // Get all issues (both open and closed)
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`,
      { headers }
    )
    if (!response.ok) return

    const issues = (await response.json()) as any[]
    for (const issue of issues) {
      // Skip pull requests
      if (issue.pull_request) continue

      const issueNumber = issue.number
      const issueUrl = issue.html_url
      const title = issue.title
      const body = issue.body || ''
      const isClosed = issue.state === 'closed'

      // Check labels for 'doing' or 'in-progress'
      const labels = (issue.labels || []).map((l: any) => l.name.toLowerCase())
      let mappedStatus: 'todo' | 'doing' | 'done' = 'todo'
      if (isClosed) {
        mappedStatus = 'done'
      } else if (labels.includes('doing') || labels.includes('in-progress')) {
        mappedStatus = 'doing'
      }

      // Check if task already exists with this issue number
      const existingTask = db
        .select()
        .from(tasks)
        .where(and(eq(tasks.projectId, projectId), eq(tasks.githubIssueNumber, issueNumber)))
        .get()

      if (existingTask) {
        // Sync status if it changed
        const updateData: any = {
          title,
          notes: body || existingTask.notes
        }
        if (existingTask.status !== mappedStatus) {
          updateData.status = mappedStatus
          updateData.completedAt = mappedStatus === 'done' ? new Date() : null
        }
        db.update(tasks).set(updateData).where(eq(tasks.id, existingTask.id)).run()
      } else {
        // Create new task linked to this issue
        db.insert(tasks)
          .values({
            id: uuidv4(),
            title,
            notes: body,
            status: mappedStatus,
            priority: 'medium',
            area: 'work',
            projectId,
            githubIssueNumber: issueNumber,
            githubIssueUrl: issueUrl,
            createdAt: new Date(),
            completedAt: mappedStatus === 'done' ? new Date() : null
          } as any)
          .run()
      }
    }
  } catch (error) {
    console.error(`[GitHubService] Failed to sync issues for ${owner}/${repo}:`, error)
  }
}
