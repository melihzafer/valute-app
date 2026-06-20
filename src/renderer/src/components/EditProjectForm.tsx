// src/renderer/src/components/EditProjectForm.tsx

import React, { useState, useEffect } from 'react'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { Dialog } from './ui/Dialog'
import { MoneyInput } from './ui/MoneyInput'
import { Project } from '../../../shared/types'
import { Edit } from 'lucide-react'
import { useClientStore } from '../store/useClientStore'
import { toast } from '../store/useToastStore'
import { formatGithubUrl } from '../lib/utils'

interface EditProjectFormProps {
  projectToEdit: Project
  onSubmit: (projectData: Omit<Project, 'id' | 'createdAt'>) => Promise<void>
  onClose: () => void
  showArchiveField?: boolean
}

const CURRENCIES: { value: string; label: string }[] = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'TRY', label: 'TRY (₺)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'JPY', label: 'JPY (¥)' }
]

const EditProjectForm: React.FC<EditProjectFormProps> = ({
  projectToEdit,
  onSubmit,
  onClose,
  showArchiveField = true
}) => {
  const { clients, fetchClientsWithBalances } = useClientStore()

  // Load clients on mount
  useEffect(() => {
    fetchClientsWithBalances()
  }, [fetchClientsWithBalances])

  const [name, setName] = useState(projectToEdit.name)
  const [clientId, setClientId] = useState<string>((projectToEdit as any).clientId || '')
  const [clientName, setClientName] = useState(projectToEdit.clientName || '')
  const [hourlyRate, setHourlyRate] = useState<number>(projectToEdit.hourlyRate / 100) // Convert from cents to dollars
  const [currency, setCurrency] = useState<string>(projectToEdit.currency)
  const [status, setStatus] = useState<'active' | 'archived'>(projectToEdit.status)
  const [workflowStatus, setWorkflowStatus] = useState<'active' | 'on_hold' | 'done'>(
    projectToEdit.workflowStatus || 'active'
  )
  const [githubUrl, setGithubUrl] = useState<string>(projectToEdit.githubUrl || '')
  const [localPath, setLocalPath] = useState<string>(projectToEdit.localPath || '')
  const [runCommand, setRunCommand] = useState<string>((projectToEdit as any).runCommand || '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name || hourlyRate <= 0 || !currency) {
      setError('Please fill in all fields correctly.')
      return
    }

    setIsSubmitting(true)
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
        status,
        workflowStatus,
        githubUrl: formatGithubUrl(githubUrl) || undefined,
        localPath: localPath.trim() || undefined,
        runCommand: runCommand.trim() || undefined
      } as any

      await onSubmit(updatedProjectData)
      toast.success('Project updated')
      onClose()
    } catch (err: any) {
      console.error('Edit project error:', err)
      const errorMsg =
        (err.errors && Array.isArray(err.errors)
          ? err.errors.map((e: any) => e.message).join(', ')
          : null) ||
        err.message ||
        'Failed to update project. Please try again.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-2 bg-transparent">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 animate-in fade-in">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Two-column layout for wide modals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column */}
        <div className="space-y-4">
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
            <MoneyInput
              id="hourlyRate"
              value={hourlyRate}
              onChange={setHourlyRate}
              placeholder="e.g., 15 or 15.50"
              required
            />
          </div>
          <div>
            <label htmlFor="githubUrl" className="block text-sm font-medium text-foreground mb-2">
              GitHub Repository URL
            </label>
            <Input
              id="githubUrl"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              onBlur={() => setGithubUrl(formatGithubUrl(githubUrl))}
              placeholder="e.g. username/repo"
            />
          </div>
          <div>
            <label htmlFor="localPath" className="block text-sm font-medium text-foreground mb-2">
              Local Repository Path
            </label>
            <div className="flex gap-2">
              <Input
                id="localPath"
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                placeholder="D:\Projects\my-project"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const res = await window.api.showOpenDialog({ properties: ['openDirectory'] })
                  if (!res.canceled && res.filePaths.length > 0) {
                    setLocalPath(res.filePaths[0])
                  }
                }}
              >
                Browse
              </Button>
            </div>
          </div>
          <div>
            <label htmlFor="runCommand" className="block text-sm font-medium text-foreground mb-2">
              Run Command
            </label>
            <Input
              id="runCommand"
              value={runCommand}
              onChange={(e) => setRunCommand(e.target.value)}
              placeholder="e.g. npm run dev"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-foreground mb-2">
              Currency
            </label>
            <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((curr) => (
                <option key={curr.value} value={curr.value}>
                  {curr.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label
              htmlFor="workflowStatus"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Lifecycle
            </label>
            <Select
              id="workflowStatus"
              value={workflowStatus}
              onChange={(e) => setWorkflowStatus(e.target.value as 'active' | 'on_hold' | 'done')}
            >
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="done">Done</option>
            </Select>
          </div>
          {showArchiveField && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                Archive State
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
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Update Project'}
        </Button>
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
      size="wide"
    >
      <EditProjectForm projectToEdit={project} onSubmit={handleSubmit} onClose={handleClose} />
    </Dialog>
  )
}

export default EditProjectForm
