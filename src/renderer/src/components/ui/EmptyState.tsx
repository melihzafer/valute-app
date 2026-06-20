// src/renderer/src/components/ui/EmptyState.tsx
import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onActionClick?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onActionClick
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-border bg-card/30 backdrop-blur-md shadow-lg max-w-md mx-auto my-12 animate-in fade-in slide-in-from-bottom-4 duration-500 hover:border-primary/30 transition-all group">
      <div className="p-4 rounded-full bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300 relative overflow-hidden">
        <Icon className="h-8 w-8 relative z-10" />
        <div className="absolute inset-0 bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-[320px] mx-auto">
        {description}
      </p>
      {actionLabel && onActionClick && (
        <Button
          onClick={onActionClick}
          className="shadow-md hover:shadow-primary/20 transition-all gap-1.5"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
