// src/renderer/src/components/ExpenseList.tsx

import React, { useState } from 'react'
import { Expense } from '../../../shared/types'
import { formatCurrency, cn } from '../lib/utils'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Trash2, Plus, Receipt, Check } from 'lucide-react'

interface ExpenseListProps {
  expenses: Expense[]
  currency: string
  onAddExpense: (expense: Omit<Expense, 'id'>) => Promise<void>
  onDeleteExpense: (id: string) => Promise<void>
  projectId: string
}

const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  currency,
  onAddExpense,
  onDeleteExpense,
  projectId
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [isBillable, setIsBillable] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !amount) return

    setIsSubmitting(true)
    try {
      await onAddExpense({
        projectId,
        description: description.trim(),
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        date: new Date(),
        isBillable
      })
      setDescription('')
      setAmount('')
      setIsBillable(true)
      setIsAdding(false)
    } catch (error) {
      console.error('Failed to add expense:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this expense?')) {
      await onDeleteExpense(id)
    }
  }

  // Sort expenses by date, most recent first
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0)
  const billableExpenses = expenses
    .filter((exp) => exp.isBillable)
    .reduce((acc, exp) => acc + exp.amount, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-xl font-semibold text-foreground">
              {formatCurrency(totalExpenses / 100, currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Billable</p>
            <p className="text-xl font-semibold text-green-400">
              {formatCurrency(billableExpenses / 100, currency)}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsAdding(true)} size="sm" disabled={isAdding}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Add Expense Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border/50 rounded-lg p-4 space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Software subscription, Stock photos"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => setIsBillable(!isBillable)}
                className={cn(
                  'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                  isBillable
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-transparent border-border'
                )}
              >
                {isBillable && <Check className="h-3 w-3" />}
              </button>
              <span className="text-sm text-foreground">Billable to client</span>
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Expense'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Expense List */}
      {sortedExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <Receipt className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No expenses recorded.</p>
          <p className="text-sm text-muted-foreground">
            Track software, assets, and other project costs.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full bg-card">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Billable
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-sm text-foreground">{expense.description}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        expense.isBillable
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {expense.isBillable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-foreground text-right font-medium">
                    {formatCurrency(expense.amount / 100, currency)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ExpenseList
