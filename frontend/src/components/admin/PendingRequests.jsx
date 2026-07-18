import React, { useState, useEffect } from 'react';
import { Bell, Receipt, Clock, CheckCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 3000); // Actualizar cada 3 segundos
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/requests/pending`);
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttend = async (id) => {
    try {
      await fetch(`${API_URL}/requests/${id}/attend`, { method: 'PATCH' });
      loadRequests();
    } catch (error) {
      console.error('Error atendiendo solicitud:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `Hace ${diff} min`;
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const getRequestIcon = (type) => {
    return type === 'call_waiter' ? Bell : Receipt;
  };

  const getRequestColor = (type) => {
    return type === 'call_waiter' ? 'blue' : 'green';
  };

  const getRequestLabel = (type) => {
    return type === 'call_waiter' ? 'Llamar mesero' : 'Solicitar cuenta';
  };

  const getUrgencyColor = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const minutes = Math.floor((now - date) / 1000 / 60);
    
    if (minutes < 3) return 'border-green-500';
    if (minutes < 5) return 'border-yellow-500';
    return 'border-red-500';
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
        <h2 className="text-2xl font-bold text-gray-900">Solicitudes Pendientes</h2>
        <p className="text-gray-600 mt-1">
          {requests.length} solicitud{requests.length !== 1 ? 'es' : ''} esperando atención
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            ¡Todo atendido!
          </h3>
          <p className="text-gray-600">
            No hay solicitudes pendientes en este momento
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map(request => {
            const Icon = getRequestIcon(request.request_type);
            const color = getRequestColor(request.request_type);
            
            return (
              <div
                key={request.id}
                className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${getUrgencyColor(request.created_at)} hover:shadow-xl transition-shadow`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-${color}-100 rounded-full flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${color}-600`} />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      {request.table_number}
                    </div>
                    <div className="text-xs text-gray-500">Mesa</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className={`inline-block px-3 py-1 bg-${color}-100 text-${color}-800 rounded-full text-sm font-medium mb-2`}>
                    {getRequestLabel(request.request_type)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatTime(request.created_at)}
                  </div>
                </div>

                <button
                  onClick={() => handleAttend(request.id)}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Marcar como Atendida
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}