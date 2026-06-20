// src/renderer/src/components/ProjectStats.tsx
// Tek proje icin zaman/kazanc istatistikleri (bugun / 7 gun / 30 gun / tum zamanlar).

import React, { useEffect, useState } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { formatCurrency } from '../lib/utils'
import type { TimeReport } from '../../../shared/types'

interface ProjectStatsProps {
  projectId: string
  currency: string
}

interface Row {
  label: string
  seconds: number
  cents: number
}

const fmt = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const ProjectStats: React.FC<ProjectStatsProps> = ({ projectId, currency }) => {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      try {
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(todayStart)
        weekStart.setDate(weekStart.getDate() - 6)
        const monthStart = new Date(todayStart)
        monthStart.setDate(monthStart.getDate() - 29)
        const allStart = new Date(2000, 0, 1)

        const pick = (report: TimeReport | undefined): { seconds: number; cents: number } => {
          const row = report?.rows.find((r) => r.projectId === projectId)
          return { seconds: row?.totalSeconds ?? 0, cents: row?.billableCents ?? 0 }
        }

        const [t, w, m, a] = await Promise.all([
          window.api.getTimeReport(todayStart.toISOString(), now.toISOString()),
          window.api.getTimeReport(weekStart.toISOString(), now.toISOString()),
          window.api.getTimeReport(monthStart.toISOString(), now.toISOString()),
          window.api.getTimeReport(allStart.toISOString(), now.toISOString())
        ])
        if (cancelled) return
        setRows([
          { label: 'Today', ...pick(t.data) },
          { label: 'Last 7 days', ...pick(w.data) },
          { label: 'Last 30 days', ...pick(m.data) },
          { label: 'All time', ...pick(a.data) }
        ])
      } catch {
        if (!cancelled) setError(true)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [projectId])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          Time & Earnings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-xs text-destructive text-center py-4">Failed to load stats</p>
        ) : !rows ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {rows.map((r) => (
              <div key={r.label} className="rounded-lg bg-accent/40 p-3 text-center">
                <p className="text-lg font-bold tabular-nums">{fmt(r.seconds)}</p>
                <p className="text-xs font-medium text-emerald-500">
                  {formatCurrency(r.cents, currency)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{r.label}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ProjectStats
