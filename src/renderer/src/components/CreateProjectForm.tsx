// src/renderer/src/components/CreateProjectForm.tsx
// Linear-style Project Creation Form with Visual Card Selection

import React, { useState, useEffect } from 'react'
import { Clock, Hash, DollarSign, Repeat } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useProjectStore } from '../store/useProjectStore'
import { useClientStore } from '../store/useClientStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { toast } from '../store/useToastStore'
import type { PricingModel } from '../../../shared/types'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { Dialog } from './ui/Dialog'
import { MoneyInput } from './ui/MoneyInput'
import type { Project } from '../../../shared/types'
import { formatGithubUrl } from '../lib/utils'

interface CreateProjectFormProps {
  onSubmit: (projectData: Omit<Project, 'id' | 'createdAt'>) => Promise<void>
  initialData?: Project | null
  onClose: () => void
}

interface PricingCard {
  model: PricingModel
  icon: React.ElementType
  label: string
  description: string
}

const pricingCards: PricingCard[] = [
  {
    model: 'HOURLY',
    icon: Clock,
    label: 'Hourly',
    description: 'Track time and bill by the hour'
  },
  {
    model: 'UNIT_BASED',
    icon: Hash,
    label: 'Unit-Based',
    description: 'Fixed price per deliverable'
  },
  {
    model: 'FIXED',
    icon: DollarSign,
    label: 'Fixed Price',
    description: 'One-time project total'
  },
  {
    model: 'SUBSCRIPTION',
    icon: Repeat,
    label: 'Subscription',
    description: 'Recurring monthly revenue'
  }
]

const CreateProjectForm: React.FC<CreateProjectFormProps> = ({ initialData, onClose }) => {
  const addProject = useProjectStore((state) => state.addProject)
  const updateProject = useProjectStore((state) => state.updateProject)
  const { clients, fetchClientsWithBalances } = useClientStore()
  const settings = useSettingsStore((s) => s.settings)

  // Load clients on mount
  useEffect(() => {
    fetchClientsWithBalances()
  }, [fetchClientsWithBalances])

  // Form State
  const [name, setName] = useState(initialData?.name || '')
  const [clientId, setClientId] = useState<string>((initialData as any)?.clientId || '')
  const [clientName, setClientName] = useState(initialData?.clientName || '')
  const [pricingModel, setPricingModel] = useState<PricingModel>(
    initialData?.pricingModel || 'HOURLY'
  )
  const [rate, setRate] = useState<number>(
    initialData?.hourlyRate ? initialData.hourlyRate / 100 : 0
  )
  const [fixedPrice, setFixedPrice] = useState<number>(
    initialData?.fixedPrice ? initialData.fixedPrice / 100 : 0
  )
  const [unitName, setUnitName] = useState(initialData?.unitName || '')
  const [currency, setCurrency] = useState<string>(
    initialData?.currency || settings.general.currency
  )
  const [workflowStatus, setWorkflowStatus] = useState<'active' | 'on_hold' | 'done'>(
    (initialData as any)?.workflowStatus || 'active'
  )
  const [githubUrl, setGithubUrl] = useState(initialData?.githubUrl || '')
  const [localPath, setLocalPath] = useState(initialData?.localPath || '')
  const [runCommand, setRunCommand] = useState((initialData as any)?.runCommand || '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currencies: { value: string; label: string }[] = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'TRY', label: 'TRY (₺)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' },
    { value: 'JPY', label: 'JPY (¥)' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    console.log('=== FORM SUBMIT STARTED ===')
    console.log('Name:', name)
    console.log('Pricing Model:', pricingModel)
    console.log('Rate:', rate)
    console.log('Fixed Price:', fixedPrice)

    // Validation
    if (!name.trim()) {
      setError('Project name is required.')
      console.log('VALIDATION FAILED: Name is empty')
      return
    }

    if (pricingModel === 'UNIT_BASED' && !unitName.trim()) {
      setError('Unit name is required for unit-based pricing.')
      console.log('VALIDATION FAILED: Unit name required')
      return
    }

    if (pricingModel === 'FIXED' && fixedPrice <= 0) {
      setError('Fixed price must be greater than zero.')
      console.log('VALIDATION FAILED: Fixed price <= 0')
      return
    }

    if ((pricingModel === 'HOURLY' || pricingModel === 'UNIT_BASED') && rate <= 0) {
      setError('Rate must be greater than zero.')
      console.log('VALIDATION FAILED: Rate <= 0')
      return
    }

    console.log('Validation passed, submitting...')
    setIsSubmitting(true)

    try {
      // Prepare payload with correct field mapping
      const projectPayload: any = {
        name: name.trim(),
        clientId: clientId || undefined, // Link to client entity
        clientName: clientName.trim() || undefined,
        pricingModel, // This will be mapped to 'type' in the backend
        currency,
        status: initialData?.status || 'active',
        workflowStatus
      }

      // Set rates based on pricing model
      if (pricingModel === 'HOURLY' || pricingModel === 'UNIT_BASED') {
        projectPayload.hourlyRate = Math.round(rate * 100) // Convert to cents
        projectPayload.fixedPrice = undefined
      } else if (pricingModel === 'FIXED') {
        projectPayload.fixedPrice = Math.round(fixedPrice * 100) // Convert to cents
        projectPayload.hourlyRate = 0
      } else if (pricingModel === 'SUBSCRIPTION') {
        projectPayload.hourlyRate = Math.round(rate * 100) // Monthly rate in cents
        projectPayload.fixedPrice = undefined
      }

      // Set unit name for unit-based
      if (pricingModel === 'UNIT_BASED') {
        projectPayload.unitName = unitName.trim()
      } else {
        projectPayload.unitName = undefined
      }

      projectPayload.githubUrl = formatGithubUrl(githubUrl) || undefined
      projectPayload.localPath = localPath.trim() || undefined
      projectPayload.runCommand = runCommand.trim() || undefined

      console.log('Project payload:', JSON.stringify(projectPayload, null, 2))
      console.log('Calling API...')

      if (initialData) {
        console.log('Updating project:', initialData.id)
        await updateProject(initialData.id, projectPayload)
      } else {
        console.log('Creating new project...')
        const result = await addProject(projectPayload)
        console.log('Create result:', result)
      }

      console.log('SUCCESS! Project saved.')
      toast.success(initialData ? 'Project updated' : 'Project created')

      // Success - reset and close
      setName('')
      setClientId('')
      setClientName('')
      setPricingModel('HOURLY')
      setRate(0)
      setFixedPrice(0)
      setUnitName('')
      setCurrency(settings.general.currency)
      onClose()
    } catch (err: any) {
      console.error('ERROR creating project:', err)
      const errorMsg = err.message || 'Failed to create/update project. Please try again.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
      console.log('=== FORM SUBMIT ENDED ===')
    }
  }

  // Get rate label based on pricing model
  const getRateLabel = () => {
    switch (pricingModel) {
      case 'HOURLY':
        return 'Hourly Rate'
      case 'UNIT_BASED':
        return `Price per ${unitName || 'Unit'}`
      case 'SUBSCRIPTION':
        return 'Monthly Rate'
      default:
        return 'Rate'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-2 bg-transparent">
      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 animate-in fade-in">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Two-column layout for wide modals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Basic Information */}
        <div className="space-y-4">
          {/* Project Name */}
          <div className="space-y-2">
            <label htmlFor="projectName" className="block text-sm font-medium text-foreground">
              Project Name *
            </label>
            <Input
              id="projectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Website Redesign"
              required
            />
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <label htmlFor="clientId" className="block text-sm font-medium text-foreground">
              Client
            </label>
            <Select
              id="clientId"
              value={clientId}
              onChange={(e) => {
                const selectedId = e.target.value
                setClientId(selectedId)
                // Auto-fill clientName from selected client
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
            <p className="text-xs text-muted-foreground">
              Link this project to an existing client for balance tracking
            </p>
          </div>

          {/* Client Name (legacy/manual entry) */}
          <div className="space-y-2">
            <label htmlFor="clientName" className="block text-sm font-medium text-foreground">
              Client Name (Manual)
            </label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g., Acme Corp"
              disabled={!!clientId}
            />
            {clientId && (
              <p className="text-xs text-muted-foreground">Auto-filled from selected client</p>
            )}
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <label htmlFor="currency" className="block text-sm font-medium text-foreground">
              Currency *
            </label>
            <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {currencies.map((curr) => (
                <option key={curr.value} value={curr.value}>
                  {curr.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Workflow Status */}
          <div className="space-y-2">
            <label htmlFor="workflowStatus" className="block text-sm font-medium text-foreground">
              Status
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

          {/* GitHub URL */}
          <div className="space-y-2">
            <label htmlFor="githubUrl" className="block text-sm font-medium text-foreground">
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

          {/* Local Path */}
          <div className="space-y-2">
            <label htmlFor="localPath" className="block text-sm font-medium text-foreground">
              Local Repository Path
            </label>
            <div className="flex gap-2">
              <Input
                id="localPath"
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                placeholder="e.g. D:\Projects\my-project"
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

          {/* Run Command */}
          <div className="space-y-2">
            <label htmlFor="runCommand" className="block text-sm font-medium text-foreground">
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

        {/* Right Column: Pricing & Rates */}
        <div className="space-y-4">
          {/* Pricing Model - Visual Cards */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">Pricing Model *</label>
            <div className="grid grid-cols-2 gap-3">
              {pricingCards.map((card) => {
                const Icon = card.icon
                const isSelected = pricingModel === card.model

                return (
                  <button
                    key={card.model}
                    type="button"
                    onClick={() => setPricingModel(card.model)}
                    className={twMerge(
                      clsx(
                        'relative p-4 rounded-lg border transition-all duration-200',
                        'hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring',
                        'text-left group',
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10'
                          : 'bg-accent/50 border-border'
                      )
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={clsx(
                          'p-2 rounded-md transition-colors',
                          isSelected
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={clsx(
                            'text-sm font-semibold mb-1',
                            isSelected ? 'text-primary' : 'text-foreground'
                          )}
                        >
                          {card.label}
                        </div>
                        <div className="text-xs text-muted-foreground leading-tight">
                          {card.description}
                        </div>
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-in zoom-in" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dynamic Fields Based on Pricing Model */}
          {pricingModel === 'UNIT_BASED' && (
            <div className="space-y-4 p-4 bg-primary/5 border border-primary/20 rounded-md animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <label htmlFor="unitName" className="block text-sm font-medium text-foreground">
                  Unit Name *
                  <span className="ml-2 text-xs text-muted-foreground">
                    (e.g., "Page", "Article", "Video")
                  </span>
                </label>
                <Input
                  id="unitName"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="e.g., Page"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="unitRate" className="block text-sm font-medium text-foreground">
                  {getRateLabel()} *
                </label>
                <MoneyInput
                  id="unitRate"
                  value={rate}
                  onChange={setRate}
                  placeholder="e.g., 85 or 85.50"
                  required
                />
              </div>
            </div>
          )}

          {pricingModel === 'HOURLY' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-foreground">
                Hourly Rate *
              </label>
              <MoneyInput
                id="hourlyRate"
                value={rate}
                onChange={setRate}
                placeholder="e.g., 15 or 15.50"
                required
              />
            </div>
          )}

          {pricingModel === 'FIXED' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label htmlFor="fixedPrice" className="block text-sm font-medium text-foreground">
                Total Amount *
              </label>
              <MoneyInput
                id="fixedPrice"
                value={fixedPrice}
                onChange={setFixedPrice}
                placeholder="e.g., 5000 or 5000.00"
                required
              />
            </div>
          )}

          {pricingModel === 'SUBSCRIPTION' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label htmlFor="monthlyRate" className="block text-sm font-medium text-foreground">
                Monthly Rate *
              </label>
              <MoneyInput
                id="monthlyRate"
                value={rate}
                onChange={setRate}
                placeholder="e.g., 400 or 400.00"
                required
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  )
}

// Wrapper component to use with Dialog. Open state can be controlled externally
// (e.g. opened from the command menu) via `open` / `onOpenChange`.
export const CreateProjectModal: React.FC<
  Omit<CreateProjectFormProps, 'onClose'> & {
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
> = ({ open: controlledOpen, onOpenChange, ...props }) => {
  const [internalOpen, setInternalOpen] = useState(false)

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  const handleClose = () => setIsOpen(false)

  return (
    <Dialog
      trigger={<Button>{props.initialData ? 'Edit Project' : 'Create New Project'}</Button>}
      title={props.initialData ? 'Edit Project' : 'Create New Project'}
      open={isOpen}
      onOpenChange={setIsOpen}
      size="wide"
    >
      <CreateProjectForm {...props} onClose={handleClose} />
    </Dialog>
  )
}

export default CreateProjectForm
