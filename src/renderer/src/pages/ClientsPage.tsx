// src/renderer/src/pages/ClientsPage.tsx

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Building2, DollarSign, ChevronRight } from 'lucide-react'
import { useClientStore } from '../store/useClientStore'
import { Button } from '../components/ui/Button'
import { AddClientDialog } from '../components/clients/AddClientDialog'
import { RecordPaymentDialog } from '../components/clients/RecordPaymentDialog'
import type { ClientWithBalance } from '../../../shared/types'

const ClientsPage: React.FC = () => {
  const navigate = useNavigate()
  const { clients, isLoading, fetchClientsWithBalances } = useClientStore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [paymentDialogClient, setPaymentDialogClient] = useState<ClientWithBalance | null>(null)

  useEffect(() => {
    fetchClientsWithBalances()
  }, [fetchClientsWithBalances])

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const getBalanceColor = (balance: number): string => {
    if (balance > 0) return 'text-red-400' // Client owes money
    if (balance < 0) return 'text-green-400' // Client has credit
    return 'text-muted-foreground' // Zero balance
  }

  const getBalanceBadgeClass = (balance: number): string => {
    if (balance > 0) return 'bg-red-500/10 text-red-400 border-red-500/20'
    if (balance < 0) return 'bg-green-500/10 text-green-400 border-green-500/20'
    return 'bg-muted text-muted-foreground border-border'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your clients and track their financial standing
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Client List */}
      {isLoading && clients.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No clients yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            Add your first client to start tracking their projects and payments
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{client.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {client.company && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {client.company}
                        </span>
                      )}
                      <span>{client.projectCount} project{client.projectCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${getBalanceColor(client.balance)}`}>
                      {formatCurrency(Math.abs(client.balance))}
                    </div>
                    <div
                      className={`text-xs px-2 py-0.5 rounded-full border ${getBalanceBadgeClass(client.balance)}`}
                    >
                      {client.balance > 0 ? 'Owes' : client.balance < 0 ? 'Credit' : 'Settled'}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPaymentDialogClient(client)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Record Payment
                  </Button>

                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddClientDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />

      {paymentDialogClient && (
        <RecordPaymentDialog
          open={!!paymentDialogClient}
          onOpenChange={(open) => !open && setPaymentDialogClient(null)}
          clientId={paymentDialogClient.id}
          clientName={paymentDialogClient.name}
        />
      )}
    </div>
  )
}

export default ClientsPage
