// src/renderer/src/components/clients/EditPaymentDialog.tsx

import React, { useState, useEffect } from 'react'
import { X, DollarSign, Calendar as CalendarIcon } from 'lucide-react'
import { useClientStore } from '../../store/useClientStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import type { Payment, PaymentMethod } from '../../../../shared/types'

interface EditPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: Payment | null
  clientName: string
  onSuccess?: () => void
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' }
]

export const EditPaymentDialog: React.FC<EditPaymentDialogProps> = ({
  open,
  onOpenChange,
  payment,
  clientName,
  onSuccess
}) => {
  const { updatePayment, isLoading } = useClientStore()
  const [formData, setFormData] = useState({
    amount: '',
    date: '',
    method: 'bank_transfer' as PaymentMethod,
    reference: '',
    notes: ''
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (payment && open) {
      // payment.date can be Date object or ISO string
      const dateStr = payment.date
        ? new Date(payment.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]

      setFormData({
        amount: (payment.amount / 100).toFixed(2),
        date: dateStr,
        method: payment.method || 'bank_transfer',
        reference: payment.reference || '',
        notes: payment.notes || ''
      })
      setError(null)
    }
  }, [payment, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payment) return
    setError(null)

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
      await updatePayment(payment.id, {
        amount: amountCents,
        date: new Date(formData.date),
        method: formData.method,
        reference: formData.reference.trim() || undefined,
        notes: formData.notes.trim() || undefined
      })
      onSuccess?.()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update payment')
    }
  }

  const handleClose = () => {
    setError(null)
    onOpenChange(false)
  }

  if (!open || !payment) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Edit Payment</h2>
            <p className="text-sm text-muted-foreground">From {clientName}</p>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-amount">Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="edit-amount"
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
            <Label htmlFor="edit-date">Date *</Label>
            <div className="relative">
              <Input
                id="edit-date"
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
            <Label htmlFor="edit-method">Payment Method *</Label>
            <select
              id="edit-method"
              value={formData.method}
              onChange={(e) =>
                setFormData({ ...formData, method: e.target.value as PaymentMethod })
              }
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-reference">Reference / Tx ID</Label>
            <Input
              id="edit-reference"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="e.g. Bank Ref #, Check #"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal payment details"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border mt-4 flex-shrink-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
