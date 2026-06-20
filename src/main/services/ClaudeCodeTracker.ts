// src/main/services/ClaudeCodeTracker.ts
// Tracks Claude Code processes: spawn, poll output, detect progress/status

import { spawn, type ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import type { ClaudeCodeStatus, ClaudeGoalSession } from '../../shared/types'
import { sendMessage, sendStatusUpdate } from './TelegramService'
import * as TaskService from './TaskService'

// In-memory state for the current Claude Code session
let currentSession: ClaudeGoalSession | null = null
let claudeProcess: ChildProcess | null = null
let pollInterval: ReturnType<typeof setInterval> | null = null
let outputBuffer = ''
let startTime: number | null = null

const POLL_INTERVAL_MS = 5000 // check every 5 seconds

export function getStatus(): ClaudeCodeStatus {
  if (!currentSession || !claudeProcess) {
    return {
      running: false,
      pid: null,
      goal: null,
      progress: 0,
      lastOutput: '',
      elapsedSeconds: 0
    }
  }

  const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0

  return {
    running: claudeProcess.exitCode === null,
    pid: currentSession.pid,
    goal: currentSession.goal,
    progress: currentSession.progress,
    lastOutput: currentSession.lastOutput,
    elapsedSeconds: elapsed
  }
}

function estimateProgress(output: string): number {
  const lower = output.toLowerCase()

  // Try to find percentage patterns
  const percentMatch = lower.match(/(\d+)%\s*(complete|done|finished|progress)/)
  if (percentMatch) return Math.min(parseInt(percentMatch[1], 10), 100)

  // Count various progress indicators
  let progress = 0

  // Starting phases
  if (/starting|beginning|initializing|setup/i.test(lower)) progress = 5
  if (/analyz|understand|read|examine/i.test(lower)) progress = 15
  if (/plann|design|architect/i.test(lower)) progress = 25

  // Implementation phases
  if (/implement|creat|build|writ|add/i.test(lower)) progress = 40
  if (/refactor|modify|updat|chang|edit/i.test(lower)) progress = 55
  if (/test|debug|fix|check|verif/i.test(lower)) progress = 70

  // Completion phases
  if (/review|finaliz|polish|clean/i.test(lower)) progress = 85
  if (/complete|done|finish|success/i.test(lower)) progress = 95
  if (/error|fail|issue|problem/i.test(lower)) progress = Math.max(progress - 20, 10)

  // If we see done/finished patterns, near 100
  if (/task complete|all done|finished successfully/i.test(lower)) progress = 100

  return Math.min(progress, 100)
}

async function onProcessOutput(text: string): Promise<void> {
  if (!currentSession) return

  outputBuffer += text
  // Keep buffer manageable
  if (outputBuffer.length > 10000) {
    outputBuffer = outputBuffer.slice(-5000)
  }

  const newProgress = estimateProgress(outputBuffer)
  currentSession.lastOutput = text.trim().split('\n').filter(Boolean).slice(-3).join('\n')
  currentSession.progress = Math.max(currentSession.progress, newProgress)
}

async function onProcessExit(code: number | null, signal: string | null): Promise<void> {
  if (!currentSession) return

  const isError = code !== 0 || signal !== null
  currentSession.status = isError ? 'failed' : 'completed'
  currentSession.completedAt = new Date().toISOString()
  currentSession.progress = isError ? Math.min(currentSession.progress, 90) : 100

  // Update the linked task
  if (currentSession.taskId) {
    try {
      await TaskService.updateTask(currentSession.taskId, {
        status: isError ? 'todo' : 'done',
        notes: currentSession.lastOutput
      })
    } catch {
      // ignore task update errors
    }
  }

  // Send Telegram notification
  try {
    await sendStatusUpdate(
      currentSession.projectName,
      currentSession.goal,
      currentSession.status,
      currentSession.progress
    )
    currentSession.telegramNotified = true
  } catch {
    // ignore telegram errors
  }

  cleanupProcess()
}

function cleanupProcess(): void {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  // Don't null claudeProcess immediately — getStatus still reads it
  // Set a small delay so final status can be read
  setTimeout(() => {
    claudeProcess = null
    startTime = null
    outputBuffer = ''
  }, 100)
}

export async function startClaudeCode(
  projectPath: string,
  goal?: string,
  projectName?: string,
  projectId?: string
): Promise<{ pid: number }> {
  // Kill existing session if any
  await stopClaudeCode()

  const claudePath = process.platform === 'win32' ? 'claude.cmd' : 'claude'
  const args: string[] = []

  if (goal) {
    // Use -p for direct prompt with goal
    args.push('-p', `I need to accomplish this goal: ${goal}. Work on it step by step. When you are done, say "TASK COMPLETE" and summarize what was done.`)
  }

  return new Promise((resolve, reject) => {
    try {
      const proc = spawn(claudePath, args, {
        cwd: projectPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      })

      claudeProcess = proc
      startTime = Date.now()

      const sessionId = crypto.randomUUID()

      currentSession = {
        id: sessionId,
        projectId: projectId || '',
        projectName: projectName || path.basename(projectPath),
        goal: goal || 'No specific goal',
        pid: proc.pid || null,
        status: 'running',
        progress: 0,
        lastOutput: '',
        startedAt: new Date().toISOString(),
        completedAt: null,
        taskId: null,
        telegramNotified: false
      }

      // Create a task for this goal
      if (projectId && goal) {
        TaskService.createTask({
          title: `🎯 Claude Code: ${goal}`,
          notes: `Project: ${projectName || projectPath}\nGoal: ${goal}\nStarted: ${currentSession.startedAt}`,
          status: 'doing',
          priority: 'high',
          area: 'work',
          projectId
        }).then((task) => {
          if (currentSession && task) {
            currentSession.taskId = task.id
          }
        }).catch(() => {
          // ignore
        })
      }

      // Send Telegram notification
      if (goal) {
        sendStatusUpdate(
          currentSession.projectName,
          currentSession.goal,
          'running',
          0
        ).catch(() => {})
      }

      // Handle stdout data
      proc.stdout?.on('data', (data: Buffer) => {
        const text = data.toString('utf8')
        onProcessOutput(text)
      })

      // Handle stderr data
      proc.stderr?.on('data', (data: Buffer) => {
        const text = data.toString('utf8')
        onProcessOutput(`[stderr] ${text}`)
      })

      // Handle process exit
      proc.on('exit', (code, signal) => {
        onProcessExit(code, signal)
      })

      proc.on('error', (err) => {
        console.error('Claude Code spawn error:', err)
        if (currentSession) {
          currentSession.status = 'failed'
          currentSession.lastOutput = `Failed to start: ${err.message}`
        }
        cleanupProcess()
        reject(err)
      })

      // Start periodic status polling
      pollInterval = setInterval(() => {
        if (currentSession && currentSession.status === 'running') {
          // Send periodic Telegram update every 5 minutes (every 60 polls)
          const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
          if (elapsed > 0 && elapsed % 300 < POLL_INTERVAL_MS / 1000) {
            sendStatusUpdate(
              currentSession.projectName,
              currentSession.goal,
              'running',
              currentSession.progress
            ).catch(() => {})
          }
        }
      }, POLL_INTERVAL_MS)

      resolve({ pid: proc.pid || 0 })
    } catch (err) {
      reject(err)
    }
  })
}

export async function stopClaudeCode(): Promise<void> {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }

  if (claudeProcess && claudeProcess.exitCode === null) {
    // Send stop notification
    if (currentSession) {
      currentSession.status = 'stopped'
      currentSession.completedAt = new Date().toISOString()
      try {
        await sendStatusUpdate(
          currentSession.projectName,
          currentSession.goal,
          'stopped',
          currentSession.progress
        )
      } catch {
        // ignore
      }
    }
    claudeProcess.kill('SIGTERM')
    // Force kill after 3 seconds
    setTimeout(() => {
      if (claudeProcess && claudeProcess.exitCode === null) {
        claudeProcess.kill('SIGKILL')
      }
    }, 3000)
  }

  claudeProcess = null
  currentSession = null
  startTime = null
  outputBuffer = ''
}
