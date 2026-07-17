import React from 'react';
import { Clock, DollarSign } from 'lucide-react';

export default function BillDetail({ 
  tableNumber, 
  bill, 
  loading, 
  onClose, 
  onRequestBill, 
  onRefresh,
  formatPrice 
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Cuenta - Mesa {tableNumber}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-6 text-white mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-orange-100">Total a pagar</span>
                  <Clock className="w-5 h-5 text-orange-100" />
                </div>
                <div className="text-4xl font-bold">
                  {formatPrice(bill?.totalAmount)}
                </div>
                <div className="text-sm text-orange-100 mt-2">
                  {bill?.orders?.length || 0} producto(s)
                </div>
              </div>

              {/* Detalle de órdenes */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 mb-3">Detalle de consumo:</h3>
                {bill?.orders?.length > 0 ? (
                  bill.orders.map((order, index) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {order.item_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.quantity} x {formatPrice(order.unit_price)}
                        </div>
                      </div>
                      <div className="font-semibold text-gray-800">
                        {formatPrice(order.subtotal)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay órdenes registradas aún
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={onRequestBill}
                  className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
                >
                  Solicitar Cuenta para Pagar
                </button>
                <button
                  onClick={onRefresh}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Actualizar
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors"
                >
                  Volver
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}