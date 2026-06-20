// src/renderer/src/pages/FinancePage.tsx
// Finance hub: cash flow, invoices, client balances, top earners — fully wired e2e.

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  DollarSign,
  Receipt,
  TrendingUp,
  TrendingDown,
  Users,
  Loader2,
  CheckCircle2,
  Send,
  Trophy,
  BarChart3,
  Pencil,
  Trash2,
  Plus,
  Mail
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { formatCurrency } from '../lib/utils'
import { useSettingsStore } from '../store/useSettingsStore'
import { toast } from '../store/useToastStore'
import { EditPaymentDialog } from '../components/clients/EditPaymentDialog'
import { RecordSettlementDialog } from '../components/clients/RecordSettlementDialog'
import type {
  DashboardStats,
  ChartDataPoint,
  InvoiceIPC,
  ClientWithBalance,
  TimeReportRow,
  PaymentIPC,
  ProjectIPC
} from '../../../shared/types'

const formatHours = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-500/10 text-blue-500',
  paid: 'bg-emerald-500/10 text-emerald-500',
  overdue: 'bg-red-500/10 text-red-500'
}

const FinancePage: React.FC = () => {
  const navigate = useNavigate()
  const { settings } = useSettingsStore()
  const currency = settings.general.currency || 'USD'

  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [chartDays, setChartDays] = useState(30)
  const [invoices, setInvoices] = useState<InvoiceIPC[]>([])
  const [clients, setClients] = useState<ClientWithBalance[]>([])
  const [topProjects, setTopProjects] = useState<TimeReportRow[]>([])
  const [paymentsList, setPaymentsList] = useState<PaymentIPC[]>([])
  const [projects, setProjects] = useState<ProjectIPC[]>([])
  const [reportRows, setReportRows] = useState<TimeReportRow[]>([])
  const [financeTab, setFinanceTab] = useState<'invoices' | 'payments'>('invoices')
  const [selectedPayment, setSelectedPayment] = useState<PaymentIPC | null>(null)
  const [isEditPaymentOpen, setIsEditPaymentOpen] = useState(false)
  const [isSettlementOpen, setIsSettlementOpen] = useState(false)
  const [settlementDefaultClientId, setSettlementDefaultClientId] = useState<string | undefined>(
    undefined
  )

  const loadAll = async (): Promise<void> => {
    try {
      const now = new Date()
      const monthStart = new Date(now)
      monthStart.setDate(monthStart.getDate() - 29)

      const [statsRes, invoicesRes, clientsRes, reportRes, paymentsRes, projectsRes] =
        await Promise.all([
          window.api.getDashboardStats(),
          window.api.getAllInvoices(),
          window.api.getClientsWithBalances(),
          window.api.getTimeReport(monthStart.toISOString(), now.toISOString()),
          window.api.getAllPayments(),
          window.api.getProjects()
        ])

      if (statsRes.success && statsRes.data) setStats(statsRes.data)
      if (invoicesRes.success && invoicesRes.data) setInvoices(invoicesRes.data)
      if (clientsRes.success && clientsRes.data) setClients(clientsRes.data)
      if (paymentsRes.success && paymentsRes.data) setPaymentsList(paymentsRes.data)
      if (projectsRes.success && projectsRes.data) setProjects(projectsRes.data)
      if (reportRes.success && reportRes.data) {
        setReportRows(reportRes.data.rows)
        setTopProjects(
          [...reportRes.data.rows].sort((a, b) => b.billableCents - a.billableCents).slice(0, 5)
        )
      }
    } catch (err) {
      console.error('Failed to load finance data:', err)
      toast.error('Failed to load finance data')
    } finally {
      setIsLoading(false)
    }
  }

  const generatePaymentReminder = async (inv: InvoiceIPC) => {
    const project = projects.find((p) => p.id === inv.projectId)
    const clientName = project?.clientName || 'Valued Client'
    const projectName = project?.name || 'Project'
    const formattedAmount = formatCurrency(inv.total, inv.currency || currency)
    const dueDateStr = new Date(inv.dueDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const subject = `Payment Reminder: Invoice ${inv.invoiceNumber} for ${projectName}`
    const body = `Hi ${clientName},

I hope you're doing well.

This is a friendly reminder that invoice ${inv.invoiceNumber} for the "${projectName}" project is outstanding.

Invoice Details:
- Invoice Number: ${inv.invoiceNumber}
- Due Date: ${dueDateStr}
- Amount Due: ${formattedAmount}

If you have already processed this payment, please disregard this message. Otherwise, please let me know if you have any questions or need any details to complete the payment.

Thank you for your business!

Best regards,
[Your Name]`

    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
      toast.success('Payment reminder copied to clipboard!')
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    window.api.getRevenueChart(chartDays).then((res) => {
      if (res.success && res.data) setChartData(res.data)
    })
  }, [chartDays])

  const getClientName = (clientId: string): string => {
    const client = clients.find((c) => c.id === clientId)
    return client ? client.name : 'Unknown Client'
  }

  const handleEditPayment = (pmt: PaymentIPC) => {
    setSelectedPayment(pmt)
    setIsEditPaymentOpen(true)
  }

  const handleDeletePayment = async (paymentId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this payment?')
    if (confirmDelete) {
      const res = await window.api.deletePayment(paymentId)
      if (res.success) {
        toast.success('Payment deleted successfully')
        loadAll()
      } else {
        toast.error(res.error || 'Failed to delete payment')
      }
    }
  }

  const handleStatusChange = async (
    invoice: InvoiceIPC,
    status: 'sent' | 'paid'
  ): Promise<void> => {
    const res = await window.api.updateInvoiceStatus(invoice.id, status)
    if (res.success) {
      toast.success(`Invoice ${invoice.invoiceNumber} marked as ${status}`)
      loadAll()
    } else {
      toast.error(res.error || 'Failed to update invoice')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const revenueCents = stats?.currentMonthEarnings ?? 0
  const expensesCents = stats?.totalExpensesThisMonth ?? 0
  const netCents = revenueCents - expensesCents
  const unbilledCents = stats?.unbilledAmount ?? 0

  const openInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue')
  const draftInvoices = invoices.filter((i) => i.status === 'draft')
  const outstandingCents = openInvoices.reduce((s, i) => s + i.total, 0)
  const owingClients = clients.filter((c) => c.balance > 0)

  const kpi = (
    title: string,
    value: string,
    icon: React.ElementType,
    color: string,
    subtitle?: string
  ): React.ReactNode => {
    const Icon = icon
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent w-fit">
            Finance
          </h1>
          <p className="text-muted-foreground">Money in, money out, money owed</p>
        </div>
        <Button
          onClick={() => {
            setSettlementDefaultClientId(undefined)
            setIsSettlementOpen(true)
          }}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Record Settlement
        </Button>
      </div>
      <div className="space-y-6">
        {/* KPI row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpi(
            'Revenue (this month)',
            formatCurrency(revenueCents, currency),
            TrendingUp,
            'text-emerald-500'
          )}
          {kpi(
            'Expenses (this month)',
            formatCurrency(expensesCents, currency),
            TrendingDown,
            'text-red-500'
          )}
          {kpi(
            'Net Profit',
            formatCurrency(netCents, currency),
            DollarSign,
            netCents >= 0 ? 'text-emerald-500' : 'text-red-500',
            'Revenue - Expenses'
          )}
          {kpi(
            'Outstanding',
            formatCurrency(outstandingCents, currency),
            Receipt,
            'text-amber-500',
            `${openInvoices.length} open invoice${openInvoices.length === 1 ? '' : 's'} • unbilled ${formatCurrency(unbilledCents, currency)}`
          )}
        </div>

        {/* Revenue chart with range toggle */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Revenue Trend
              </CardTitle>
              <div className="flex gap-1">
                {[30, 90].map((d) => (
                  <Button
                    key={d}
                    variant={chartDays === d ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartDays(d)}
                  >
                    {d}d
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFinRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        stroke="#71717a"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(d) =>
                          new Date(d).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })
                        }
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke="#71717a"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${(v / 100).toFixed(0)}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#a1a1aa' }}
                        formatter={(value) => [
                          formatCurrency(value as number, currency),
                          'Revenue'
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#colorFinRev)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No revenue data yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settlements widget */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                <span className="text-xs font-normal text-muted-foreground">
                  ({paymentsList.length} total)
                </span>
              </CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setSettlementDefaultClientId(undefined)
                  setIsSettlementOpen(true)
                }}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Record
              </Button>
            </CardHeader>
            <CardContent>
              {paymentsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <DollarSign className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No settlements yet. Record a payment to start tracking money in.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 gap-1"
                    onClick={() => {
                      setSettlementDefaultClientId(undefined)
                      setIsSettlementOpen(true)
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Record your first settlement
                  </Button>
                </div>
              ) : (
                <div className="space-y-1 max-h-[280px] overflow-y-auto">
                  {[...paymentsList]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 6)
                    .map((pmt) => {
                      const client = clients.find((c) => c.id === pmt.clientId)
                      return (
                        <div
                          key={pmt.id}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors"
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                              <DollarSign className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {client ? client.name : 'Unknown client'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(pmt.date).toLocaleDateString()} •{' '}
                                {pmt.method.replace('_', ' ')}
                                {pmt.reference ? ` • ${pmt.reference}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold text-emerald-400">
                              +{formatCurrency(pmt.amount, currency)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-muted-foreground hover:text-primary"
                              title="Edit settlement"
                              onClick={() => handleEditPayment(pmt)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-muted-foreground hover:text-destructive"
                              title="Delete settlement"
                              onClick={() => handleDeletePayment(pmt.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  {paymentsList.length > 6 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{paymentsList.length - 6} more — see the Payments tab in Transactions
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Invoices and Payments Tabs */}
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-5 w-5 text-primary" />
                  Transactions
                </CardTitle>
                <div className="flex bg-muted rounded-md p-0.5">
                  <button
                    onClick={() => setFinanceTab('invoices')}
                    className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                      financeTab === 'invoices'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Invoices
                  </button>
                  <button
                    onClick={() => setFinanceTab('payments')}
                    className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                      financeTab === 'payments'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Payments
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 max-h-[400px] overflow-y-auto">
                {financeTab === 'invoices' ? (
                  <>
                    {invoices.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No invoices yet.{' '}
                        <button
                          className="text-primary hover:underline"
                          onClick={() => navigate('/reports')}
                        >
                          Create one from Reports
                        </button>
                      </div>
                    )}
                    {[
                      ...openInvoices,
                      ...draftInvoices,
                      ...invoices.filter((i) => i.status === 'paid')
                    ].map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{inv.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            Due {new Date(inv.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-semibold">
                            {formatCurrency(inv.total, inv.currency || currency)}
                          </span>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[inv.status]}`}
                          >
                            {inv.status}
                          </span>
                          {inv.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-blue-500"
                              title="Mark as sent"
                              onClick={() => handleStatusChange(inv, 'sent')}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {(inv.status === 'sent' || inv.status === 'overdue') && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-muted-foreground hover:text-primary"
                                title="Copy Payment Reminder"
                                onClick={() => generatePaymentReminder(inv)}
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-emerald-500"
                                title="Mark as paid"
                                onClick={() => handleStatusChange(inv, 'paid')}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {paymentsList.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No payments recorded yet.
                      </div>
                    ) : (
                      paymentsList.map((pmt) => (
                        <div
                          key={pmt.id}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {getClientName(pmt.clientId)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(pmt.date).toLocaleDateString()} •{' '}
                              {pmt.method.replace('_', ' ')}
                              {pmt.reference ? ` (${pmt.reference})` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold text-emerald-400">
                              +{formatCurrency(pmt.amount, currency)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-muted-foreground hover:text-primary"
                              title="Edit payment"
                              onClick={() => handleEditPayment(pmt)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-muted-foreground hover:text-destructive"
                              title="Delete payment"
                              onClick={() => handleDeletePayment(pmt.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Forecast & Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Forecast & Insights (30d)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">30-Day Forecast</div>
                  <div className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent w-fit mt-1">
                    {formatCurrency(revenueCents + unbilledCents, currency)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Current Monthly Earnings + Unbilled Time
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Effective Hourly Rates
                  </div>
                  {reportRows.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                      No hours logged in the last 30 days to calculate rates.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {reportRows.map((row) => {
                        const rate =
                          row.totalSeconds > 0 ? (row.billableCents * 3600) / row.totalSeconds : 0
                        return (
                          <div
                            key={row.projectId}
                            className="flex justify-between items-center py-1.5 text-sm border-b border-border/40 last:border-0"
                          >
                            <span
                              className="font-medium truncate max-w-[200px]"
                              title={row.projectName}
                            >
                              {row.projectName}
                            </span>
                            <span className="font-mono text-emerald-400">
                              {rate > 0
                                ? `${formatCurrency(rate, row.currency || currency)}/hr`
                                : '—'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client balances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Who Owes You
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {owingClients.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    All settled — nobody owes you money. 🎉
                  </p>
                ) : (
                  owingClients.map((c) => (
                    <div
                      key={c.id}
                      className="w-full flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/50 transition-colors"
                    >
                      <button
                        onClick={() => navigate(`/clients/${c.id}`)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left"
                      >
                        <span className="text-sm font-medium truncate">{c.name}</span>
                        <span className="text-sm font-semibold text-amber-500">
                          {formatCurrency(c.balance, currency)}
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-emerald-500 hover:text-emerald-400 gap-1"
                        title={`Settle ${c.name}'s balance`}
                        onClick={() => {
                          setSettlementDefaultClientId(c.id)
                          setIsSettlementOpen(true)
                        }}
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                        <span className="text-xs">Settle</span>
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Top earning projects (30d) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Top Earners (30 days)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {topProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Track time to see your best projects.
                  </p>
                ) : (
                  topProjects.map((p, i) => (
                    <button
                      key={p.projectId}
                      onClick={() => navigate(`/projects/${p.projectId}`)}
                      className="w-full flex items-center justify-between rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors text-left"
                    >
                      <span className="text-sm font-medium truncate">
                        <span className="text-muted-foreground mr-2">#{i + 1}</span>
                        {p.projectName}
                      </span>
                      <span className="text-right shrink-0">
                        <span className="text-sm font-semibold text-emerald-500 block">
                          {formatCurrency(p.billableCents, p.currency || currency)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatHours(p.totalSeconds)}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {selectedPayment && (
        <EditPaymentDialog
          open={isEditPaymentOpen}
          onOpenChange={setIsEditPaymentOpen}
          payment={selectedPayment as any}
          clientName={getClientName(selectedPayment.clientId)}
          onSuccess={loadAll}
        />
      )}
      <RecordSettlementDialog
        open={isSettlementOpen}
        onOpenChange={setIsSettlementOpen}
        preselectedClientId={settlementDefaultClientId}
        onSuccess={loadAll}
      />
    </div>
  )
}

export default FinancePage
