import React, { useState, useEffect, useCallback } from 'react';
import { DynamicPageRenderer } from './components/client/DynamicPageRenderer';
import Notification from './components/client/Notification';

const API_URL = '/api';

function App() {
  const [scanned, setScanned] = useState(false);
  const [tableNumber, setTableNumber] = useState(null);
  const [notification, setNotification] = useState(null);
  const [bill, setBill] = useState(null);
  const [showBill, setShowBill] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Theme data
  const [themePages, setThemePages] = useState([]);
  const [globalConfig, setGlobalConfig] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [themeLoading, setThemeLoading] = useState(true);

  // Determine current page based on app state
  const currentPageType = useMemo(() => {
    if (!scanned) return 'scan';
    if (showBill) return 'bill';
    if (showMenu) return 'menu';
    return 'table';
  }, [scanned, showBill, showMenu]);

  const currentPage = useMemo(() => {
    return themePages.find(p => p.type === currentPageType) || themePages[0];
  }, [themePages, currentPageType]);

  // Fetch active theme on mount
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await fetch(`${API_URL}/theme/active`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data?.theme?.canvas_json) {
            const canvas = typeof data.theme.canvas_json === 'string' 
              ? JSON.parse(data.theme.canvas_json) 
              : data.theme.canvas_json;
            
            if (canvas.pages && Array.isArray(canvas.pages)) {
              setThemePages(canvas.pages);
              setGlobalConfig(canvas.globalConfig || data.theme.config || {});
            }
          }
        }
      } catch (error) {
        console.error('Error cargando theme:', error);
      } finally {
        setThemeLoading(false);
      }
    };
    fetchTheme();
  }, []);

  // Fetch menu data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, promosRes] = await Promise.all([
          fetch(`${API_URL}/menu`),
          fetch(`${API_URL}/promotions/active`)
        ]);
        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setMenuItems(menuData);
          const uniqueCategories = [...new Set(menuData.map(item => item.category))].sort();
          setCategories(uniqueCategories);
        }
        if (promosRes.ok) {
          const promosData = await promosRes.json();
          setPromotions(promosData);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };
    fetchData();
  }, []);

  // Fetch bill when table changes or showBill
  useEffect(() => {
    if (tableNumber && (scanned || showBill)) {
      fetchBill(tableNumber);
    }
  }, [tableNumber, scanned, showBill]);

  const fetchBill = useCallback(async (tableNum) => {
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
  }, []);

  const startSession = useCallback(async (tableNum) => {
    try {
      await fetch(`${API_URL}/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: parseInt(tableNum) })
      });
    } catch (error) {
      console.error('Error iniciando sesión:', error);
    }
  }, []);

  const handleScan = useCallback((tableNum) => {
    setTableNumber(tableNum);
    setScanned(true);
  }, []);

  const showNotificationMsg = useCallback((type, message) => {
    setNotification({ type, message });
  }, []);

  const handleCallWaiter = useCallback(async () => {
    showNotificationMsg('call', `Llamando al mesero para la Mesa ${tableNumber}...`);
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
        showNotificationMsg('success', '¡Mesero notificado! Llegará en breve.');
        setTimeout(() => setNotification(null), 3000);
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      showNotificationMsg('error', 'Error al llamar al mesero');
    }
  }, [tableNumber, showNotificationMsg]);

  const handleRequestBill = useCallback(async () => {
    showNotificationMsg('bill', `Solicitando cuenta para la Mesa ${tableNumber}...`);
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
        showNotificationMsg('success', '¡Cuenta solicitada! El mesero la traerá pronto.');
        setTimeout(() => setNotification(null), 3000);
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      showNotificationMsg('error', 'Error al solicitar cuenta');
    }
  }, [tableNumber, showNotificationMsg]);

  const handleCreateOrder = useCallback(async (menuItemId) => {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableNumber: parseInt(tableNumber), 
          menuItemId, 
          quantity: 1 
        })
      });
      if (response.ok) {
        const data = await response.json();
        await fetchBill(tableNumber);
        // Update cart locally for immediate feedback
        const item = menuItems.find(i => i.id === menuItemId);
        if (item) {
          setCart(prev => {
            const existing = prev.items.find(i => i.id === menuItemId);
            if (existing) {
              return {
                items: prev.items.map(i => i.id === menuItemId ? { ...i, quantity: i.quantity + 1 } : i),
                total: prev.total + item.price
              };
            }
            return {
              items: [...prev.items, { ...item, quantity: 1 }],
              total: prev.total + item.price
            };
          });
        }
        showNotificationMsg('success', `${item?.name || 'Producto'} agregado al pedido`);
        return { success: true, ...data };
      } else {
        const err = await response.json();
        showNotificationMsg('error', err.error || 'Error al agregar');
        return { success: false, error: err.error };
      }
    } catch (error) {
      console.error('Error creando orden:', error);
      showNotificationMsg('error', 'Error de conexión');
      return { success: false, error: 'Error de conexión' };
    }
  }, [tableNumber, menuItems, fetchBill, showNotificationMsg]);

  const handleDynamicAction = useCallback((type, payload) => {
    switch (type) {
      case 'button':
        switch (payload) {
          case 'viewMenu':
            setShowMenu(true);
            break;
          case 'callWaiter':
            handleCallWaiter();
            break;
          case 'requestBill':
            handleRequestBill();
            break;
          case 'viewBill':
            setShowBill(true);
            break;
          case 'scanAnother':
            handleReset();
            break;
        }
        break;
      case 'order':
        handleCreateOrder(payload.id);
        break;
      case 'search':
        // Search is handled locally in the search-bar component
        break;
    }
  }, [handleCallWaiter, handleRequestBill, handleCreateOrder]);

  const handleViewBill = useCallback(async () => {
    await fetchBill(tableNumber);
    setShowBill(true);
  }, [tableNumber, fetchBill]);

  const handleReset = useCallback(() => {
    setScanned(false);
    setTableNumber(null);
    setNotification(null);
    setBill(null);
    setShowBill(false);
    setShowMenu(false);
    setCart({ items: [], total: 0 });
  }, []);

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price || 0);
  }, []);

  // Show loading while theme loads
  if (themeLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Scan screen (before QR scan)
  if (!scanned) {
    return (
      <DynamicPageRenderer
        page={themePages.find(p => p.type === 'scan') || { type: 'scan', elements: [], config: { background_config: { type: 'color', value: '#FFF8F0' } } }}
        tableNumber={null}
        onAction={handleDynamicAction}
        globalConfig={globalConfig}
        menuItems={menuItems}
        categories={categories}
        promotions={promotions}
      />
    );
  }

  // Bill detail screen
  if (showBill) {
    return (
      <DynamicPageRenderer
        page={themePages.find(p => p.type === 'bill') || { type: 'bill', elements: [], config: {} }}
        tableNumber={tableNumber}
        billData={bill}
        onAction={handleDynamicAction}
        globalConfig={globalConfig}
        menuItems={menuItems}
        categories={categories}
        promotions={promotions}
        cart={cart}
      />
    );
  }

  // Menu screen
  if (showMenu) {
    return (
      <div>
        {notification && <Notification type={notification.type} message={notification.message} />}
        <DynamicPageRenderer
          page={themePages.find(p => p.type === 'menu') || { type: 'menu', elements: [], config: {} }}
          tableNumber={tableNumber}
          billData={bill}
          menuItems={menuItems}
          categories={categories}
          promotions={promotions}
          cart={cart}
          onAction={handleDynamicAction}
          globalConfig={globalConfig}
        />
      </div>
    );
  }

  // Table view (main screen)
  return (
    <div>
      {notification && <Notification type={notification.type} message={notification.message} />}
      <DynamicPageRenderer
        page={themePages.find(p => p.type === 'table') || { type: 'table', elements: [], config: {} }}
        tableNumber={tableNumber}
        billData={bill}
        onAction={handleDynamicAction}
        globalConfig={globalConfig}
        menuItems={menuItems}
        categories={categories}
        promotions={promotions}
        cart={cart}
      />
    </div>
  );
}

export default App;