// src/renderer/src/components/Sidebar.tsx

import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Package,
  ReceiptText,
  Settings,
  Users,
  Lightbulb,
  CheckSquare,
  GraduationCap,
  HeartPulse,
  FileText,
  Palette
} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import icon from '../assets/icon.png'

const Sidebar: React.FC = () => {
  const navSections: {
    title: string
    items: { path: string; label: string; icon: typeof CalendarDays; end?: boolean }[]
  }[] = [
    {
      title: 'Life',
      items: [
        { path: '/', label: 'Life Dashboard', icon: LayoutDashboard, end: true },
        { path: '/planner', label: 'Planner', icon: CheckSquare },
        { path: '/university', label: 'University', icon: GraduationCap },
        { path: '/journal', label: 'Journal', icon: HeartPulse },
        { path: '/notes', label: 'Notes', icon: FileText },
        { path: '/hobbies', label: 'Hobbies', icon: Palette }
      ]
    },
    {
      title: 'Work',
      items: [
        { path: '/finance', label: 'Finance', icon: CalendarDays },
        { path: '/projects', label: 'Projects', icon: Package },
        { path: '/clients', label: 'Clients', icon: Users },
        { path: '/reports', label: 'Reports', icon: ReceiptText },
        { path: '/ideas', label: 'Ideas', icon: Lightbulb }
      ]
    }
  ]

  return (
    <aside className="w-64 bg-card/95 backdrop-blur-sm border-r border-border min-h-screen flex flex-col">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <img src={icon} alt="Valute Icon" className="w-8 h-8 rounded-lg" />
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Valute
          </h1>
          <p className="text-[10px] text-muted-foreground leading-tight">Your life, organized</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
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
            </div>
          </div>
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
