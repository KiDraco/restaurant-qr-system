import React from 'react';
import { Bell, Receipt, ShoppingCart, DollarSign } from 'lucide-react';

export default function TableView({ 
  tableNumber, 
  bill, 
  onCallWaiter, 
  onRequestBill, 
  onViewBill,
  onReset,
  formatPrice 
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-3">
              <span className="text-3xl">🍽️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              Mesa {tableNumber}
            </h2>
            <p className="text-gray-600 mb-4">
              ¿En qué podemos ayudarte?
            </p>
            
            {/* Total gastado */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
              <div className="flex items-center justify-center gap-2 text-green-700 mb-1">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Total consumido</span>
              </div>
              <div className="text-3xl font-bold text-green-700">
                {formatPrice(bill?.totalAmount)}
              </div>
              <button
                onClick={onViewBill}
                className="text-sm text-green-600 hover:text-green-700 font-medium mt-2 underline"
              >
                Ver detalle
              </button>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="space-y-4">
          {/* Llamar al mesero */}
          <button
            onClick={onCallWaiter}
            className="w-full bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="w-7 h-7 text-blue-600" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  Llamar al Mesero
                </h3>
                <p className="text-sm text-gray-600">
                  Solicita atención en tu mesa
                </p>
              </div>
            </div>
          </button>

          {/* Ver cuenta detallada */}
          <button
            onClick={onViewBill}
            className="w-full bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-7 h-7 text-purple-600" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  Ver Cuenta Detallada
                </h3>
                <p className="text-sm text-gray-600">
                  Revisa tu consumo completo
                </p>
              </div>
            </div>
          </button>

          {/* Pedir la cuenta */}
          <button
            onClick={onRequestBill}
            className="w-full bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <Receipt className="w-7 h-7 text-green-600" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  Solicitar Cuenta
                </h3>
                <p className="text-sm text-gray-600">
                  Pide tu cuenta para pagar
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Botón para escanear otra mesa */}
        <button
          onClick={onReset}
          className="w-full mt-6 text-gray-600 hover:text-gray-800 font-medium py-3 transition-colors"
        >
          Escanear otra mesa
        </button>
      </div>
    </div>
  );
}