// src/renderer/src/pages/SettingsPage.tsx

import React from 'react'
import { Settings, Info, Shield } from 'lucide-react'

const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Settings</h1>

      {/* About Section */}
      <section className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <Info className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-700">About Vault</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Vault is an offline-first, privacy-centric time tracking and invoicing application. All
          your data stays local on your device - nothing is ever sent to the cloud.
        </p>
        <div className="text-sm text-gray-500">
          <p>Version: 1.0.0</p>
          <p>Built with Electron + React + TypeScript</p>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-700">Privacy & Security</h2>
        </div>
        <ul className="text-gray-600 space-y-2">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            All data stored locally on your device
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            No cloud sync or external data transmission
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            Context isolation enabled for security
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            No tracking or analytics
          </li>
        </ul>
      </section>

      {/* Preferences Section */}
      <section className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <Settings className="h-6 w-6 text-gray-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-700">Preferences</h2>
        </div>
        <p className="text-gray-500 text-sm">
          Additional preferences and customization options will be available in future updates.
        </p>
      </section>
    </div>
  )
}

export default SettingsPage
