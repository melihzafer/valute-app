// src/renderer/src/components/clients/LedgerTable.tsx

import React from 'react'
import { FileText, DollarSign } from 'lucide-react'
import type { LedgerEntry } from '../../../../shared/types'

interface LedgerTableProps {
  entries: LedgerEntry[]
}

export const LedgerTable: React.FC<LedgerTableProps> = ({ entries }) => {
  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(cents) / 100)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium">No transactions yet</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Invoices and payments will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Date</th>
            <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">Type</th>
            <th className="text-left text-sm font-medium text-muted-foreground px-4 py-3">
              Description
            </th>
            <th className="text-right text-sm font-medium text-muted-foreground px-4 py-3">
              Amount
            </th>
            <th className="text-right text-sm font-medium text-muted-foreground px-4 py-3">
              Balance
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3 text-sm">{formatDate(entry.date)}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                    entry.type === 'invoice'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-green-500/10 text-green-400 border border-green-500/20'
                  }`}
                >
                  {entry.type === 'invoice' ? (
                    <FileText className="h-3 w-3" />
                  ) : (
                    <DollarSign className="h-3 w-3" />
                  )}
                  {entry.type === 'invoice' ? 'Invoice' : 'Payment'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">{entry.description}</td>
              <td
                className={`px-4 py-3 text-sm text-right font-medium ${
                  entry.type === 'invoice' ? 'text-foreground' : 'text-green-400'
                }`}
              >
                {entry.type === 'invoice' ? '+' : '-'}
                {formatCurrency(entry.amount)}
              </td>
              <td
                className={`px-4 py-3 text-sm text-right font-medium ${
                  entry.runningBalance > 0
                    ? 'text-red-400'
                    : entry.runningBalance < 0
                      ? 'text-green-400'
                      : 'text-muted-foreground'
                }`}
              >
                {formatCurrency(entry.runningBalance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
