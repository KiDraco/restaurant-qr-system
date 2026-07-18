import React, { useState, useEffect } from 'react';
import { Users, Clock, DollarSign, Eye, XCircle } from 'lucide-react';
import api from '../../services/api';

export default function TableStatus() {
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [billDetails, setBillDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveSessions();
    const interval = setInterval(loadActiveSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveSessions = async () => {
    try {
      const data = await api.getActiveSessions();
      setActiveSessions(data);
    } catch (error) {
      console.error('Error cargando sesiones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBillDetails = async (tableNumber) => {
    try {
      const data = await api.getBill(tableNumber);
      setBillDetails(data);
    } catch (error) {
      console.error('Error cargando detalles:', error);
    }
  };

  const handleViewDetails = (tableNumber) => {
    setSelectedTable(tableNumber);
    loadBillDetails(tableNumber);
  };

  const handleCloseSession = async (sessionId) => {
    if (!window.confirm('¿Cerrar esta sesión de mesa?')) return;
    
    try {
      await api.closeSession(sessionId);
      setSelectedTable(null);
      setBillDetails(null);
      loadActiveSessions();
    } catch (error) {
      console.error('Error cerrando sesión:', error);
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
    
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
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
        <h2 className="text-2xl font-bold text-gray-900">Estado de Mesas</h2>
        <p className="text-gray-600 mt-1">
          {activeSessions.length} mesa{activeSessions.length !== 1 ? 's' : ''} activa{activeSessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {activeSessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No hay mesas activas
          </h3>
          <p className="text-gray-600">
            Todas las mesas están disponibles
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeSessions.map(session => (
            <div
              key={session.id}
              className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {session.table_number}
                  </div>
                  <div className="text-xs text-gray-500">Mesa</div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Tiempo: {formatTime(session.session_start)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                  <span className="font-semibold text-green-600">
                    {formatPrice(session.total_amount)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(session.table_number)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver Detalle
                </button>
                <button
                  onClick={() => handleCloseSession(session.id)}
                  className="px-4 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalles */}
      {selectedTable && billDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Mesa {selectedTable}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sesión iniciada: {new Date(billDetails.sessionStart).toLocaleString('es-AR')}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedTable(null);
                  setBillDetails(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Total */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white mb-6">
                <div className="text-sm mb-1">Total Consumido</div>
                <div className="text-4xl font-bold">
                  {formatPrice(billDetails.totalAmount)}
                </div>
                <div className="text-sm mt-2 opacity-90">
                  {billDetails.orders.length} producto{billDetails.orders.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Detalle de órdenes */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Detalle de Órdenes</h4>
                <div className="space-y-3">
                  {billDetails.orders.map((order, index) => (
                    <div key={index} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {order.item_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {order.quantity} x {formatPrice(order.unit_price)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleTimeString('es-AR')}
                        </div>
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatPrice(order.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}