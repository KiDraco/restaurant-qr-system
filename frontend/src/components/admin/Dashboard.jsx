import React, { useState, useEffect } from 'react';
import { Bell, Receipt, DollarSign, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export default function AdminDashboard() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [stats, setStats] = useState({
    requests: { total_requests: 0, pending: 0, attended: 0 },
    sales: { total_sessions: 0, total_orders: 0, total_sales: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [requests, sessions, requestStats, salesStats] = await Promise.all([
        fetch(`${API_URL}/requests/pending`).then(r => r.json()),
        fetch(`${API_URL}/sessions/active`).then(r => r.json()),
        fetch(`${API_URL}/requests/stats`).then(r => r.json()),
        fetch(`${API_URL}/orders/stats`).then(r => r.json())
      ]);

      setPendingRequests(requests);
      setActiveSessions(sessions);
      setStats({ requests: requestStats, sales: salesStats });
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendRequest = async (id) => {
    try {
      await fetch(`${API_URL}/requests/${id}/attend`, { method: 'PATCH' });
      loadData();
    } catch (error) {
      console.error('Error atendiendo solicitud:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price || 0);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `Hace ${diff} min`;
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600 mt-1">Gestión de mesas y solicitudes</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Solicitudes Pendientes</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats.requests.pending || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mesas Activas</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {activeSessions.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Órdenes Hoy</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.sales.total_orders || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas Hoy</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {formatPrice(stats.sales.total_sales)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Solicitudes Pendientes */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-600" />
                Solicitudes Pendientes
              </h2>
            </div>
            <div className="p-6">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No hay solicitudes pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-orange-500"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">Mesa {request.table_number}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(request.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {request.request_type === 'call_waiter' ? (
                            <Bell className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Receipt className="w-4 h-4 text-green-600" />
                          )}
                          <span className="text-sm text-gray-600">
                            {request.request_type === 'call_waiter' ? 'Llamar mesero' : 'Solicitar cuenta'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAttendRequest(request.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Atender
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mesas Activas */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Mesas Activas
              </h2>
            </div>
            <div className="p-6">
              {activeSessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <XCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No hay mesas activas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-900 mb-1">
                            Mesa {session.table_number}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Desde {formatTime(session.session_start)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatPrice(session.total_amount)}
                          </div>
                          <div className="text-xs text-gray-500">Total consumido</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}