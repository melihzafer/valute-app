// src/renderer/src/components/EditProjectForm.tsx

import React, { useState, useEffect } from 'react'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { Dialog } from './ui/Dialog'
import { Project } from '../../../shared/types'
import { Edit } from 'lucide-react'
import { useClientStore } from '../store/useClientStore'

interface EditProjectFormProps {
  projectToEdit: Project
  onSubmit: (projectData: Omit<Project, 'id' | 'createdAt'>) => Promise<void>
  onClose: () => void
}

const EditProjectForm: React.FC<EditProjectFormProps> = ({ projectToEdit, onSubmit, onClose }) => {
  const { clients, fetchClientsWithBalances } = useClientStore()

  // Load clients on mount
  useEffect(() => {
    fetchClientsWithBalances()
  }, [fetchClientsWithBalances])

  const [name, setName] = useState(projectToEdit.name)
  const [clientId, setClientId] = useState<string>((projectToEdit as any).clientId || '')
  const [clientName, setClientName] = useState(projectToEdit.clientName || '')
  const [hourlyRate, setHourlyRate] = useState<number>(projectToEdit.hourlyRate / 10000) // Convert from cents to dollars
  const [currency, setCurrency] = useState<string>(projectToEdit.currency)
  const [status, setStatus] = useState<'active' | 'archived'>(projectToEdit.status)
  const [error, setError] = useState<string | null>(null)

  const currencies = ['USD', 'EUR', 'GBP', 'TRY']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name || hourlyRate <= 0 || !currency) {
      setError('Please fill in all fields correctly.')
      return
    }

    try {
      const updatedProjectData = {
        name,
        clientId: clientId || undefined,
        clientName: clientName || undefined,
        pricingModel: projectToEdit.pricingModel,
        hourlyRate: Math.round(hourlyRate * 100),
        fixedPrice: projectToEdit.fixedPrice || 0,
        unitName: projectToEdit.unitName || undefined,
        currency,
        status
      } as any

      await onSubmit(updatedProjectData)
      onClose()
    } catch (err: any) {
      console.error('Edit project error:', err)
      if (err.errors && Array.isArray(err.errors)) {
        // Zod validation errors from backend
        const errorMessages = err.errors.map((e: any) => e.message).join(', ')
        setError(`Validation failed: ${errorMessages}`)
      } else {
        setError(err.message || 'Failed to update project. Please try again.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 animate-in fade-in">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <div>
        <label htmlFor="projectName" className="block text-sm font-medium text-foreground mb-2">
          Project Name
        </label>
        <Input
          id="projectName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Website Redesign"
          required
        />
      </div>
      <div>
        <label htmlFor="clientId" className="block text-sm font-medium text-foreground mb-2">
          Client
        </label>
        <Select
          id="clientId"
          value={clientId}
          onChange={(e) => {
            const selectedId = e.target.value
            setClientId(selectedId)
            const selectedClient = clients.find((c) => c.id === selectedId)
            if (selectedClient) {
              setClientName(selectedClient.name)
            } else {
              setClientName('')
            }
          }}
        >
          <option value="">No client selected</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
              {client.company ? ` (${client.company})` : ''}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="hourlyRate" className="block text-sm font-medium text-foreground mb-2">
          Hourly Rate
        </label>
        <Input
          id="hourlyRate"
          type="number"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
          placeholder="e.g., 50"
          required
          min="0"
          step="0.01"
        />
      </div>
      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-foreground mb-2">
          Currency
        </label>
        <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {currencies.map((curr) => (
            <option key={curr} value={curr}>
              {curr}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
          Status
        </label>
        <Select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'active' | 'archived')}
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </Select>
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Update Project</Button>
      </div>
    </form>
  )
}

// Wrapper component to use with Dialog
export const EditProjectModal: React.FC<
  { project: Project } & Pick<EditProjectFormProps, 'onSubmit'>
> = ({ project, onSubmit }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleSubmit = async (projectData: Omit<Project, 'id' | 'createdAt'>): Promise<void> => {
    await onSubmit(projectData)
    setIsOpen(false) // Close modal after successful submit
  }

  return (
    <Dialog
      trigger={
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      }
      title="Edit Project"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <EditProjectForm projectToEdit={project} onSubmit={handleSubmit} onClose={handleClose} />
    </Dialog>
  )
}

export default EditProjectForm
