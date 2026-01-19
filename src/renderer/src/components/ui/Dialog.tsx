// src/renderer/src/components/ui/Dialog.tsx

import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

// Define context types
interface DialogContextType {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

// Self-contained Dialog component that provides its own context
export const Dialog: React.FC<{ 
  trigger: React.ReactNode;
  title: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}> = ({ trigger, title, children, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <span onClick={handleTriggerClick} style={{ display: 'inline-block' }}>
        {trigger}
      </span>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{title}</h3>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="p-1">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <DialogContext.Provider value={{ isOpen, setOpen }}>
              <div>{children}</div>
            </DialogContext.Provider>
          </div>
        </div>
      )}
    </>
  );
};

// Hook to close dialog from within children
export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a Dialog');
  }
  return context;
};

// Legacy exports for backwards compatibility - now deprecated
export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setOpen] = useState(false);
  return (
    <DialogContext.Provider value={{ isOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

export const DialogTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const context = useContext(DialogContext);
  if (!context) {
    console.error('DialogTrigger must be used within a DialogProvider');
    return <>{children}</>;
  }
  const { setOpen } = context;
  return React.cloneElement(children as React.ReactElement, {
    onClick: () => setOpen(true),
  });
};

export const DialogContent: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  const context = useContext(DialogContext);
  if (!context) {
    console.error('DialogContent must be used within a DialogProvider');
    return null;
  }
  const { isOpen, setOpen } = context;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="p-1">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
