// src/renderer/src/components/CreateProjectForm.tsx

import React, { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { ProjectSchema } from '../../../shared/schemas';
import { Input } from './ui/Input'; // Assuming custom UI components for Input
import { Button } from './ui/Button'; // Assuming custom UI components for Button
import { Select } from './ui/Select'; // Assuming custom UI components for Select
import { Dialog } from './ui/Dialog'; // Import new Dialog component
import { Project } from '../../../shared/types'; // Import Project type

interface CreateProjectFormProps {
  onSubmit: (projectData: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  initialData?: Project | null;
  onClose: () => void;
}

const CreateProjectForm: React.FC<CreateProjectFormProps> = ({
  initialData,
  onClose,
}) => {
  const addProject = useProjectStore((state) => state.addProject);
  const updateProject = useProjectStore((state) => state.updateProject);

  const [name, setName] = useState(initialData?.name || '');
  const [hourlyRate, setHourlyRate] = useState<number>(initialData?.hourlyRate || 0);
  const [currency, setCurrency] = useState<string>(initialData?.currency || 'USD');
  const [error, setError] = useState<string | null>(null);

  const currencies = ['USD', 'EUR', 'GBP']; // Example currencies

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation before Zod parsing
    if (!name || hourlyRate <= 0 || !currency) {
      setError('Please fill in all fields correctly.');
      return;
    }

    try {
      // Prepare data for Zod validation (excluding generated fields)
      const projectDataToValidate = {
        name,
        hourlyRate,
        currency,
        status: initialData?.status || 'active',
      };
      ProjectSchema.parse(projectDataToValidate); // Validate using Zod schema

      if (initialData) {
        await updateProject(initialData.id, projectDataToValidate);
      } else {
        await addProject(projectDataToValidate);
      }

      // Reset form after successful submission
      setName('');
      setHourlyRate(0);
      setCurrency('USD');
      onClose(); // Close the form/modal
    } catch (err: any) {
      if (err.errors) {
        setError(`Validation failed: ${err.errors.map((e: any) => e.message).join(', ')}`);
      } else {
        setError(err.message || 'Failed to create/update project. Please try again.');
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
      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <Button type="submit">{initialData ? 'Update Project' : 'Create Project'}</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
};

// Wrapper component to use with Dialog
export const CreateProjectModal: React.FC<Omit<CreateProjectFormProps, 'onClose'>> = (props) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog
      trigger={<Button>{props.initialData ? 'Edit Project' : 'Create New Project'}</Button>}
      title={props.initialData ? 'Edit Project' : 'Create New Project'}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <CreateProjectForm {...props} onClose={handleClose} />
    </Dialog>
  );
};

export default CreateProjectForm; // Exporting the form itself too
