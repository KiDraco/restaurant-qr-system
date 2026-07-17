import React, { useState, useEffect } from 'react';
import ScanScreen from './components/client/ScanScreen';
import TableView from './components/client/TableView';
import BillDetail from './components/client/BillDetail';
import Notification from './components/client/Notification';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function App() {
  const [scanned, setScanned] = useState(false);
  const [tableNumber, setTableNumber] = useState(null);
  const [notification, setNotification] = useState(null);
  const [bill, setBill] = useState(null);
  const [showBill, setShowBill] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tableNumber && scanned) {
      startSession(tableNumber);
      fetchBill(tableNumber);
    }
  }, [tableNumber, scanned]);

  const startSession = async (tableNum) => {
    try {
      await fetch(`${API_URL}/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: parseInt(tableNum) })
      });
    } catch (error) {
      console.error('Error iniciando sesión:', error);
    }
  };

  const fetchBill = async (tableNum) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/orders/table/${tableNum}/bill`);
      if (response.ok) {
        const data = await response.json();
        setBill(data);
      } else {
        setBill({ totalAmount: 0, orders: [] });
      }
    } catch (error) {
      console.error('Error obteniendo cuenta:', error);
      setBill({ totalAmount: 0, orders: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (tableNum) => {
    setTableNumber(tableNum);
    setScanned(true);
  };

  const handleCallWaiter = async () => {
    showNotification('call', `Llamando al mesero para la Mesa ${tableNumber}...`);
    
    try {
      await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableNumber: parseInt(tableNumber), 
          requestType: 'call_waiter' 
        })
      });
      
      setTimeout(() => {
        showNotification('success', '¡Mesero notificado! Llegará en breve.');
        setTimeout(() => setNotification(null), 3000);
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      showNotification('error', 'Error al llamar al mesero');
    }
  };

  const handleRequestBill = async () => {
    showNotification('bill', `Solicitando cuenta para la Mesa ${tableNumber}...`);
    
    try {
      await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableNumber: parseInt(tableNumber), 
          requestType: 'request_bill' 
        })
      });
      
      setTimeout(() => {
        showNotification('success', '¡Cuenta solicitada! El mesero la traerá pronto.');
        setTimeout(() => setNotification(null), 3000);
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      showNotification('error', 'Error al solicitar cuenta');
    }
  };

  const handleViewBill = async () => {
    await fetchBill(tableNumber);
    setShowBill(true);
  };

  const handleReset = () => {
    setScanned(false);
    setTableNumber(null);
    setNotification(null);
    setBill(null);
    setShowBill(false);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price || 0);
  };

  if (!scanned) {
    return <ScanScreen onScan={handleScan} />;
  }

  if (showBill) {
    return (
      <BillDetail
        tableNumber={tableNumber}
        bill={bill}
        loading={loading}
        onClose={() => setShowBill(false)}
        onRequestBill={handleRequestBill}
        onRefresh={() => fetchBill(tableNumber)}
        formatPrice={formatPrice}
      />
    );
  }

  return (
    <div>
      {notification && <Notification type={notification.type} message={notification.message} />}
      <TableView
        tableNumber={tableNumber}
        bill={bill}
        onCallWaiter={handleCallWaiter}
        onRequestBill={handleRequestBill}
        onViewBill={handleViewBill}
        onReset={handleReset}
        formatPrice={formatPrice}
      />
    </div>
  );
}

export default App;