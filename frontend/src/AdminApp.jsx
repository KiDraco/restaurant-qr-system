import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Bell, Users, UtensilsCrossed, BarChart3, Gift, Palette } from 'lucide-react';
import Dashboard from './components/admin/Dashboard';
import PendingRequests from './components/admin/PendingRequests';
import TableStatus from './components/admin/TableStatus';
import MenuManager from './components/admin/MenuManager';
import PromotionManager from './components/admin/PromotionManager';
import Statistics from './components/admin/Statistics';
import ThemesManager from './components/admin/ThemesManager';
import CanvasEditor from './pages/admin/CanvasEditor';
import AuthGuard from './components/admin/AuthGuard';

function AdminApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: React.createElement(LayoutDashboard, { className: 'w-5 h-5' }) },
    { id: 'requests', label: 'Solicitudes', icon: React.createElement(Bell, { className: 'w-5 h-5' }) },
    { id: 'tables', label: 'Mesas', icon: React.createElement(Users, { className: 'w-5 h-5' }) },
    { id: 'menu', label: 'Menú', icon: React.createElement(UtensilsCrossed, { className: 'w-5 h-5' }) },
    { id: 'promotions', label: 'Promociones', icon: React.createElement(Gift, { className: 'w-5 h-5' }) },
    { id: 'themes', label: 'Temas', icon: React.createElement(Palette, { className: 'w-5 h-5' }) },
    { id: 'stats', label: 'Estadísticas', icon: React.createElement(BarChart3, { className: 'w-5 h-5' }) },
  ];

  // Check if we're on a canvas editor route
  const isCanvasRoute = location.pathname.startsWith('/admin/themes/') && 
    (location.pathname.endsWith('/edit') || location.pathname.endsWith('/new'));

  // Keep activeTab in sync with the URL so direct loads and back/forward work
  useEffect(() => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/dashboard') {
      setActiveTab('dashboard');
    } else if (path.startsWith('/admin/themes')) {
      setActiveTab('themes');
    } else {
      const match = tabs.find(t => path === `/admin/${t.id}`);
      if (match) setActiveTab(match.id);
    }
  }, [location.pathname]);

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
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    navigate(tab.id === 'dashboard' ? '/admin' : `/admin/${tab.id}`);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                    activeTab === tab.id && !isCanvasRoute
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="ml-64">
          {isCanvasRoute ? (
            // Canvas Editor routes
            <Routes>
              <Route path="/admin/themes/new" element={<CanvasEditor />} />
              <Route path="/admin/themes/:id/edit" element={<CanvasEditor />} />
            </Routes>
          ) : (
            // Tab-based content
            <div className="p-6">
              <Routes>
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/requests" element={<PendingRequests />} />
                <Route path="/admin/tables" element={<TableStatus />} />
                <Route path="/admin/menu" element={<MenuManager />} />
                <Route path="/admin/promotions" element={<PromotionManager />} />
                <Route path="/admin/themes" element={<ThemesManager />} />
                <Route path="/admin/stats" element={<Statistics />} />
                <Route index element={<Dashboard />} />
              </Routes>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

export default AdminApp;