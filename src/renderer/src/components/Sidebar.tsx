// src/renderer/src/components/Sidebar.tsx

import React from 'react'
import { NavLink } from 'react-router-dom'
import { CalendarDays, Package, ReceiptText, Settings } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: CalendarDays },
    { path: '/projects', label: 'Projects', icon: Package },
    { path: '/reports', label: 'Reports', icon: ReceiptText }
  ]

  return (
    <aside className="w-64 bg-card/95 backdrop-blur-sm border-r border-border min-h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Valute
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Time Tracking & Invoicing</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary pl-[10px]'
                  : 'text-foreground hover:bg-accent/50 hover:text-accent-foreground'
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border space-y-1">
        <ThemeToggle />
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-primary/10 text-primary border-l-2 border-primary pl-[10px]'
                : 'text-foreground hover:bg-accent/50 hover:text-accent-foreground'
            }`
          }
        >
          <Settings className="h-5 w-5 mr-3" />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar
