// src/renderer/src/components/EditProjectForm.tsx

import React, { useState } from 'react';
import { ProjectSchema } from '../../../shared/schemas';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Dialog } from './ui/Dialog';
import { Project } from '../../../shared/types';
import { Edit } from 'lucide-react';

interface EditProjectFormProps {
  projectToEdit: Project;
  onSubmit: (projectData: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
}

const EditProjectForm: React.FC<EditProjectFormProps> = ({
  projectToEdit,
  onSubmit,
  onClose,
}) => {
  const [name, setName] = useState(projectToEdit.name);
  const [hourlyRate, setHourlyRate] = useState<number>(projectToEdit.hourlyRate);
  const [currency, setCurrency] = useState<string>(projectToEdit.currency);
  const [status, setStatus] = useState<'active' | 'archived'>(projectToEdit.status);
  const [error, setError] = useState<string | null>(null);

  const currencies = ['USD', 'EUR', 'GBP']; // Example currencies

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || hourlyRate <= 0 || !currency) {
      setError('Please fill in all fields correctly.');
      return;
    }

    try {
      const updatedProjectData = {
        name,
        hourlyRate,
        currency,
        status,
      };
      ProjectSchema.parse(updatedProjectData); // Validate with Zod

      await onSubmit(updatedProjectData);
      onClose();
    } catch (err: any) {
      if (err.errors) {
        setError(`Validation failed: ${err.errors.map((e: any) => e.message).join(', ')}`);
      } else {
        setError(err.message || 'Failed to update project. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      <div>
        <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">Project Name</label>
        <Input
          id="projectName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Website Redesign"
          required
        />
      </div>
      <div>
        <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">Hourly Rate</label>
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
        <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Currency</label>
        <Select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {currencies.map(curr => (
            <option key={curr} value={curr}>{curr}</option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
        <Select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'active' | 'archived')}
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </Select>
      </div>
      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <Button type="submit">Update Project</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
};

// Wrapper component to use with Dialog
export const EditProjectModal: React.FC<{ project: Project } & Pick<EditProjectFormProps, 'onSubmit'>> = ({ project, onSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

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
      <EditProjectForm projectToEdit={project} onSubmit={onSubmit} onClose={handleClose} />
    </Dialog>
  );
};

export default EditProjectForm;
