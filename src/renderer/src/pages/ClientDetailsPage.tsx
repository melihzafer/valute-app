// src/renderer/src/pages/ClientDetailsPage.tsx

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  Folder,
  Trash2,
  Edit2
} from 'lucide-react'
import { useClientStore } from '../store/useClientStore'
import { Button } from '../components/ui/Button'
import { RecordPaymentDialog } from '../components/clients/RecordPaymentDialog'
import { EditClientDialog } from '../components/clients/EditClientDialog'
import { LedgerTable } from '../components/clients/LedgerTable'
import type { ProjectIPC, ClientBalance } from '../../../shared/types'

type TabType = 'overview' | 'projects' | 'ledger'

const ClientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    currentClient,
    currentLedger,
    selectClient,
    clearCurrentClient,
    deleteClient,
    isLoading
  } = useClientStore()

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [clientProjects, setClientProjects] = useState<ProjectIPC[]>([])
  const [clientBalance, setClientBalance] = useState<ClientBalance | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      selectClient(id)
      fetchClientData(id)
    }
    return () => clearCurrentClient()
  }, [id])

  const fetchClientData = async (clientId: string) => {
    try {
      const [projectsRes, balanceRes] = await Promise.all([
        window.api.getProjectsByClient(clientId),
        window.api.getClientBalance(clientId)
      ])

      if (projectsRes.success && projectsRes.data) {
        setClientProjects(projectsRes.data)
      }
      if (balanceRes.success && balanceRes.data) {
        setClientBalance(balanceRes.data)
      }
    } catch (error) {
      console.error('Failed to fetch client data:', error)
    }
  }

  const handleDelete = async () => {
    if (!currentClient) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${currentClient.name}"? This will also delete all associated payments.`
    )

    if (confirmed) {
      setIsDeleting(true)
      try {
        await deleteClient(currentClient.id)
        navigate('/clients')
      } catch (error) {
        console.error('Failed to delete client:', error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const getBalanceColor = (balance: number): string => {
    if (balance > 0) return 'text-red-400'
    if (balance < 0) return 'text-green-400'
    return 'text-muted-foreground'
  }

  const getBalanceBadgeClass = (balance: number): string => {
    if (balance > 0) return 'bg-red-500/10 text-red-400 border-red-500/20'
    if (balance < 0) return 'bg-green-500/10 text-green-400 border-green-500/20'
    return 'bg-muted text-muted-foreground border-border'
  }

  if (isLoading && !currentClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!currentClient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Client not found</p>
        <Button variant="ghost" onClick={() => navigate('/clients')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Button>
      </div>
    )
  }

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'ledger', label: 'Ledger', icon: FileText }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{currentClient.name}</h1>
              {clientBalance && (
                <span
                  className={`text-sm px-2 py-0.5 rounded-full border ${getBalanceBadgeClass(clientBalance.balance)}`}
                >
                  {clientBalance.balance > 0
                    ? `Owes ${formatCurrency(clientBalance.balance)}`
                    : clientBalance.balance < 0
                      ? `Credit ${formatCurrency(Math.abs(clientBalance.balance))}`
                      : 'Settled'}
                </span>
              )}
            </div>
            {currentClient.company && (
              <p className="text-muted-foreground">{currentClient.company}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button onClick={() => setIsPaymentDialogOpen(true)}>
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <div className="space-y-3">
                {currentClient.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${currentClient.email}`} className="text-primary hover:underline">
                      {currentClient.email}
                    </a>
                  </div>
                )}
                {currentClient.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${currentClient.phone}`} className="hover:underline">
                      {currentClient.phone}
                    </a>
                  </div>
                )}
                {currentClient.address && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{currentClient.address}</span>
                  </div>
                )}
                {!currentClient.email && !currentClient.phone && !currentClient.address && (
                  <p className="text-muted-foreground text-sm">No contact information added</p>
                )}
              </div>
              {currentClient.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{currentClient.notes}</p>
                </div>
              )}
            </div>

            {/* Balance Summary Card */}
            {clientBalance && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Financial Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Invoiced</span>
                    <span className="font-medium">{formatCurrency(clientBalance.totalInvoiced)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Paid</span>
                    <span className="font-medium text-green-400">
                      {formatCurrency(clientBalance.totalPaid)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Current Balance</span>
                      <span className={`text-xl font-bold ${getBalanceColor(clientBalance.balance)}`}>
                        {formatCurrency(Math.abs(clientBalance.balance))}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {clientBalance.balance > 0
                        ? 'Client owes this amount'
                        : clientBalance.balance < 0
                          ? 'Client has credit'
                          : 'All payments settled'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            {clientProjects.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium">No projects yet</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Projects linked to this client will appear here
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {clientProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {project.pricingModel} • {project.currency}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          project.status === 'active'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ledger' && <LedgerTable entries={currentLedger} />}
      </div>

      {/* Dialogs */}
      <RecordPaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        clientId={currentClient.id}
        clientName={currentClient.name}
        onSuccess={() => {
          if (id) fetchClientData(id)
        }}
      />

      <EditClientDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        client={currentClient}
      />
    </div>
  )
}

export default ClientDetailsPage
