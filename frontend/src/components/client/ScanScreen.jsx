import React, { useState } from 'react';
import { QrCode, Camera } from 'lucide-react';

export default function ScanScreen({ onScan }) {
  const [simulatedQR, setSimulatedQR] = useState('');

  const handleSimulatedScan = () => {
    if (simulatedQR) {
      const tableNum = simulatedQR.replace(/\D/g, '');
      if (tableNum) {
        onScan(tableNum);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSimulatedScan();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
            <QrCode className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bienvenido
          </h1>
          <p className="text-gray-600">
            Escanea el código QR de tu mesa para comenzar
          </p>
        </div>

        {/* Simulador de QR para demo */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <Camera className="w-16 h-16 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 text-center mb-4">
            Demo: Ingresa un código de mesa (ej: MESA-5)
          </p>
          <input
            type="text"
            placeholder="MESA-X"
            value={simulatedQR}
            onChange={(e) => setSimulatedQR(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 text-center text-lg font-semibold"
          />
        </div>

        <button
          onClick={handleSimulatedScan}
          disabled={!simulatedQR}
          className="w-full bg-orange-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Escanear Mesa
        </button>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>¿Necesitas ayuda?</p>
          <p className="mt-1">Escanea el código QR ubicado en tu mesa</p>
        </div>
      </div>
    </div>
  );
}