// src/renderer/src/components/ui/Dialog.tsx

import React, { createContext, useContext, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { twMerge } from 'tailwind-merge'

// Define context types
interface DialogContextType {
  isOpen: boolean
  setOpen: (isOpen: boolean) => void
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

// Self-contained Dialog component that provides its own context
export const Dialog: React.FC<{
  trigger: React.ReactNode
  title: string
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'wide'
  className?: string
}> = ({ trigger, title, children, open: controlledOpen, onOpenChange, size = 'md', className }) => {
  const [internalOpen, setInternalOpen] = useState(false)

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(true)
  }

  return (
    <>
      <span onClick={handleTriggerClick} style={{ display: 'inline-block' }}>
        {trigger}
      </span>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className={twMerge(
              'bg-card border border-border rounded-xl shadow-2xl p-6 relative flex flex-col max-h-[90vh] w-full',
              size === 'wide' ? 'max-w-5xl' : 'max-w-md',
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="p-1">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <DialogContext.Provider value={{ isOpen, setOpen }}>
              <div className="overflow-y-auto flex-1 pr-1">{children}</div>
            </DialogContext.Provider>
          </div>
        </div>
      )}
    </>
  )
}

// Hook to close dialog from within children
export const useDialog = () => {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used within a Dialog')
  }
  return context
}

// Legacy exports for backwards compatibility - now deprecated
export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setOpen] = useState(false)
  return <DialogContext.Provider value={{ isOpen, setOpen }}>{children}</DialogContext.Provider>
}

export const DialogTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const context = useContext(DialogContext)
  if (!context) {
    console.error('DialogTrigger must be used within a DialogProvider')
    return <>{children}</>
  }
  const { setOpen } = context
  return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
    onClick: () => setOpen(true)
  })
}

export const DialogContent: React.FC<{ children: React.ReactNode; title: string }> = ({
  children,
  title
}) => {
  const context = useContext(DialogContext)
  if (!context) {
    console.error('DialogContent must be used within a DialogProvider')
    return null
  }
  const { isOpen, setOpen } = context

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="p-1">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}
