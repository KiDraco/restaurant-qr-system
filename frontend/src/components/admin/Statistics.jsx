import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Bell, Receipt } from 'lucide-react';

const API_URL = 'http://localhost:3000/api';

export default function Statistics() {
  const [stats, setStats] = useState({
    requests: {},
    sales: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000); // Actualizar cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const [requestStats, salesStats] = await Promise.all([
        fetch(`${API_URL}/requests/stats`).then(r => r.json()),
        fetch(`${API_URL}/orders/stats`).then(r => r.json())
      ]);

      setStats({
        requests: requestStats,
        sales: salesStats
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  const calculateAverage = () => {
    if (!stats.sales.total_sessions || stats.sales.total_sessions === 0) return 0;
    return stats.sales.total_sales / stats.sales.total_sessions;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Estadísticas del Día</h2>
        <p className="text-gray-600 mt-1">
          {new Date().toLocaleDateString('es-AR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Estadísticas de Ventas */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Ventas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatPrice(stats.sales.total_sales)}
            </div>
            <div className="text-sm text-gray-600">Total Vendido</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.sales.total_sessions || 0}
            </div>
            <div className="text-sm text-gray-600">Mesas Atendidas</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.sales.total_orders || 0}
            </div>
            <div className="text-sm text-gray-600">Órdenes Totales</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatPrice(calculateAverage())}
            </div>
            <div className="text-sm text-gray-600">Promedio por Mesa</div>
          </div>
        </div>
      </div>

      {/* Estadísticas de Solicitudes */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 Solicitudes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.requests.total_requests || 0}
            </div>
            <div className="text-sm text-gray-600">Total Solicitudes</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {stats.requests.pending || 0}
            </div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.requests.waiter_calls || 0}
            </div>
            <div className="text-sm text-gray-600">Llamadas a Mesero</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.requests.bill_requests || 0}
            </div>
            <div className="text-sm text-gray-600">Solicitudes de Cuenta</div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-8 text-white">
        <h3 className="text-2xl font-bold mb-4">📊 Resumen del Día</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-3xl font-bold mb-2">
              {formatPrice(stats.sales.total_sales)}
            </div>
            <div className="text-orange-100">en ventas totales</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">
              {stats.sales.total_sessions || 0}
            </div>
            <div className="text-orange-100">mesas atendidas</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">
              {stats.requests.attended || 0}
            </div>
            <div className="text-orange-100">solicitudes atendidas</div>
          </div>
        </div>
      </div>
    </div>
  );
}