import React, { useState } from 'react';
import { LayoutDashboard, Bell, Users, UtensilsCrossed, BarChart3 } from 'lucide-react';
import Dashboard from './components/admin/Dashboard';
import PendingRequests from './components/admin/PendingRequests';
import TableStatus from './components/admin/TableStatus';
import MenuManager from './components/admin/MenuManager';
import Statistics from './components/admin/Statistics';
import AuthGuard from './components/admin/AuthGuard';

function AdminApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
    { id: 'requests', label: 'Solicitudes', icon: Bell, component: PendingRequests },
    { id: 'tables', label: 'Mesas', icon: Users, component: TableStatus },
    { id: 'menu', label: 'Menú', icon: UtensilsCrossed, component: MenuManager },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3, component: Statistics }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Dashboard;

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Restaurant QR</h1>
          <p className="text-sm text-gray-600 mt-1">Panel Admin</p>
        </div>
        
        <nav className="p-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <ActiveComponent />
      </div>
    </div>
    </AuthGuard>
  );
}

export default AdminApp;