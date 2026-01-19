// src/renderer/src/components/Sidebar.tsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, Package, ReceiptText, Settings } from 'lucide-react'; // Assuming Lucide React for icons

const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: CalendarDays },
    { path: '/projects', label: 'Projects', icon: Package },
    { path: '/reports', label: 'Reports', icon: ReceiptText },
    // Add more navigation items as needed, e.g., Settings
    // { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen flex flex-col">
      <div className="p-4 text-xl font-bold border-b border-gray-700">
        Vault
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        {/* Footer or additional info like settings link */}
        <NavLink
          to="/settings"
          className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors"
        >
          <Settings className="h-5 w-5 mr-3" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
