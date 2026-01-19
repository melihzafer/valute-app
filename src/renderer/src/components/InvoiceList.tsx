// src/renderer/src/components/InvoiceList.tsx

import React from 'react';
import { Invoice, Project } from '../../../shared/types';
import { Button } from './ui/Button';
import { FileText, Trash, Edit, CheckCircle2, Clock } from 'lucide-react'; // Icons for actions and status
import { formatCurrency } from '../lib/utils';

interface InvoiceListProps {
  invoices: Invoice[];
  projects: Project[]; // To get project names
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onMarkAsPaid: (invoiceId: string) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  projects,
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onMarkAsPaid,
}) => {
  if (!invoices || invoices.length === 0) {
    return <p className="text-center text-gray-500">No invoices generated yet.</p>;
  }

  // Helper to get project name by ID
  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Sort invoices by issue date, most recent first
  const sortedInvoices = [...invoices].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg shadow-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Project</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Invoice #</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Issue Date</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Due Date</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Amount</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Status</th>
            <th className="py-3 px-4 text-right text-sm font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedInvoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="py-3 px-4 text-sm text-gray-800 truncate" title={getProjectName(invoice.projectId)}>{getProjectName(invoice.projectId)}</td>
              <td className="py-3 px-4 text-sm text-gray-800">{invoice.id.substring(0, 6)}...</td>
              <td className="py-3 px-4 text-sm text-gray-800">{new Date(invoice.issueDate).toLocaleDateString()}</td>
              <td className="py-3 px-4 text-sm text-gray-800">{new Date(invoice.dueDate).toLocaleDateString()}</td>
              <td className="py-3 px-4 text-sm font-medium text-gray-900">{formatCurrency(invoice.totalAmount, invoice.currency)}</td>
              <td className="py-3 px-4 text-sm ">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' : invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {invoice.status === 'paid' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {invoice.status === 'overdue' && <Clock className="h-3 w-3 mr-1" />}
                  {invoice.status}
                </span>
              </td>
              <td className="py-3 px-4 text-right space-x-2">
                <Button variant="ghost" size="sm" onClick={() => onViewInvoice(invoice)}>
                  <FileText className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEditInvoice(invoice)} disabled={invoice.status !== 'draft'}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDeleteInvoice(invoice.id)} className="text-red-500 hover:text-red-700" disabled={invoice.status === 'paid' || invoice.status === 'sent'}>
                  <Trash className="h-4 w-4" />
                </Button>
                {invoice.status === 'draft' || invoice.status === 'overdue' && (
                  <Button variant="outline" size="sm" onClick={() => onMarkAsPaid(invoice.id)}>
                    Mark as Paid
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceList;
