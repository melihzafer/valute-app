// src/renderer/src/components/clients/RecordSettlementDialog.tsx
// Record a payment (settlement) from any page — client is chosen from a picker.

import React, { useState } from 'react'
import { X, DollarSign, Calendar as CalendarIcon } from 'lucide-react'
import { useClientStore } from '../../store/useClientStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import type { PaymentMethod } from '../../../../shared/types'

interface RecordSettlementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Optional pre-selected client (e.g. when opened from a specific client) */
  preselectedClientId?: string
  /** Optional pre-filled amount (e.g. exact outstanding balance) */
  suggestedAmountCents?: number
  onSuccess?: () => void
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' }
]

export const RecordSettlementDialog: React.FC<RecordSettlementDialogProps> = ({
  open,
  onOpenChange,
  preselectedClientId,
  suggestedAmountCents,
  onSuccess
}) => {
  const { clients, fetchClientsWithBalances, addPayment, isLoading } = useClientStore()
  const [formData, setFormData] = useState({
    clientId: preselectedClientId || '',
    amount: suggestedAmountCents ? (suggestedAmountCents / 100).toFixed(2) : '',
    date: new Date().toISOString().split('T')[0],
    method: 'bank_transfer' as PaymentMethod,
    reference: '',
    notes: ''
  })
  const [error, setError] = useState<string | null>(null)

  // Make sure the client list is loaded for the picker.
  React.useEffect(() => {
    if (open && clients.length === 0) {
      fetchClientsWithBalances()
    }
  }, [open, clients.length, fetchClientsWithBalances])

  // Keep the picker in sync when a pre-selected client is provided.
  React.useEffect(() => {
    if (open && preselectedClientId) {
      setFormData((prev) => ({ ...prev, clientId: preselectedClientId }))
    }
  }, [open, preselectedClientId])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)

    if (!formData.clientId) {
      setError('Please choose a client')
      return
    }
    const amountCents = Math.round(parseFloat(formData.amount) * 100)
    if (isNaN(amountCents) || amountCents <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }
    if (!formData.date) {
      setError('Please select a date')
      return
    }

    try {
      await addPayment({
        clientId: formData.clientId,
        amount: amountCents,
        date: new Date(formData.date).toISOString(),
        method: formData.method,
        reference: formData.reference.trim() || undefined,
        notes: formData.notes.trim() || undefined
      })
      setFormData({
        clientId: preselectedClientId || '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        method: 'bank_transfer',
        reference: '',
        notes: ''
      })
      onSuccess?.()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record settlement')
    }
  }

  const handleClose = (): void => {
    setFormData({
      clientId: preselectedClientId || '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      method: 'bank_transfer',
      reference: '',
      notes: ''
    })
    setError(null)
    onOpenChange(false)
  }

  if (!open) return null

  const owingClients = clients.filter((c) => c.balance > 0)
  const selectedClient = clients.find((c) => c.id === formData.clientId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Record Settlement</h2>
            <p className="text-sm text-muted-foreground">
              Log a payment you received for finished work
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <select
              id="client"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="">— Select a client —</option>
              {owingClients.length > 0 && (
                <optgroup label="Owes you money">
                  {owingClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (owes {((c.balance || 0) / 100).toFixed(2)})
                    </option>
                  ))}
                </optgroup>
              )}
              {clients
                .filter((c) => c.balance <= 0)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            {selectedClient && (
              <p className="text-xs text-muted-foreground">
                Current balance:{' '}
                <span
                  className={
                    (selectedClient.balance || 0) > 0
                      ? 'text-amber-500 font-medium'
                      : 'text-muted-foreground'
                  }
                >
                  {((selectedClient.balance || 0) / 100).toFixed(2)}{' '}
                  {selectedClient.balance > 0 ? 'outstanding' : 'settled'}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <div className="relative">
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker()
                  } catch {}
                }}
                required
                className="pr-10 cursor-pointer"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Method *</Label>
            <select
              id="method"
              value={formData.method}
              onChange={(e) =>
                setFormData({ ...formData, method: e.target.value as PaymentMethod })
              }
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference / Transaction ID</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Check #, Transaction ID, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes about this settlement..."
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm resize-none h-20 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border flex-shrink-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Recording...' : 'Record Settlement'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
