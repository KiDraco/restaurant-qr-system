import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DynamicPageRenderer } from './components/client/DynamicPageRenderer';
import Notification from './components/client/Notification';
// Generate UUID for browser
  const genId = () => crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

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

  // Default fallback theme pages (used when no active theme or migration pending)
  const getDefaultThemePages = useCallback(() => [
    {
      id: 'scan',
      name: 'Login / QR',
      type: 'scan',
      icon: '📱',
      elements: [
        { id: genId(), type: 'text', x: 50, y: 80, width: 275, height: 60, zIndex: 0, locked: false, visible: true, config: { content: 'Bienvenido', fontSize: 28, fontFamily: 'system-ui', color: '#2A2A2A', textAlign: 'center', fontWeight: 'bold' } },
        { id: genId(), type: 'text', x: 50, y: 150, width: 275, height: 40, zIndex: 1, locked: false, visible: true, config: { content: 'Escanea el QR de tu mesa', fontSize: 16, fontFamily: 'system-ui', color: '#666666', textAlign: 'center' } },
        { id: genId(), type: 'image', x: 100, y: 220, width: 175, height: 175, zIndex: 2, locked: false, visible: true, config: { src: '', alt: 'Código QR', borderRadius: 12 } },
        { id: genId(), type: 'text', x: 50, y: 420, width: 275, height: 40, zIndex: 3, locked: false, visible: true, config: { content: 'O ingresa tu número de mesa:', fontSize: 14, fontFamily: 'system-ui', color: '#666666', textAlign: 'center' } },
        { id: genId(), type: 'action-button', x: 50, y: 480, width: 275, height: 56, zIndex: 4, locked: false, visible: true, config: { action: 'scanAnother', label: 'Escanear mesa', icon: 'qrcode', variant: 'primary', size: 'lg', fullWidth: true } },
        { id: genId(), type: 'table-input', x: 50, y: 550, width: 275, height: 56, zIndex: 5, locked: false, visible: true, config: { placeholder: 'N° de mesa', buttonLabel: 'Entrar', fontSize: 16, backgroundColor: '#FFFFFF', borderColor: '#E5E5E5', borderRadius: 12, buttonVariant: 'primary' } },
      ],
      config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFF8F0' }, grid: { enabled: true, size: 8 } },
    },
    {
      id: 'table',
      name: 'Mesa Principal',
      type: 'table',
      icon: '🍽️',
      elements: [
        { id: genId(), type: 'table-number', x: 20, y: 30, width: 335, height: 60, zIndex: 0, locked: false, visible: true, config: { prefix: 'Mesa ', fontSize: 36, fontWeight: 'bold', color: '#2A2A2A', textAlign: 'center' } },
        { id: genId(), type: 'total-amount', x: 20, y: 100, width: 335, height: 50, zIndex: 1, locked: false, visible: true, config: { prefix: 'Total: ', fontSize: 24, fontWeight: 'bold', color: '#FF6B6B', textAlign: 'center' } },
        { id: genId(), type: 'action-button', x: 20, y: 170, width: 335, height: 56, zIndex: 2, locked: false, visible: true, config: { action: 'viewMenu', label: 'Ver Menú', icon: 'utensils', variant: 'primary', size: 'lg', fullWidth: true } },
        { id: genId(), type: 'action-button', x: 20, y: 240, width: 335, height: 56, zIndex: 3, locked: false, visible: true, config: { action: 'callWaiter', label: 'Llamar Mesero', icon: 'bell', variant: 'secondary', size: 'lg', fullWidth: true } },
        { id: genId(), type: 'action-button', x: 20, y: 310, width: 335, height: 56, zIndex: 4, locked: false, visible: true, config: { action: 'viewBill', label: 'Ver Cuenta', icon: 'receipt', variant: 'outline', size: 'lg', fullWidth: true } },
        { id: genId(), type: 'action-button', x: 20, y: 380, width: 335, height: 56, zIndex: 5, locked: false, visible: true, config: { action: 'requestBill', label: 'Pedir Cuenta', icon: 'dollar-sign', variant: 'primary', size: 'lg', fullWidth: true } },
        { id: genId(), type: 'action-button', x: 20, y: 450, width: 335, height: 56, zIndex: 6, locked: false, visible: true, config: { action: 'scanAnother', label: 'Escanear otra mesa', icon: 'chevron-left', variant: 'ghost', size: 'md', fullWidth: true } },
      ],
      config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 } },
    },
    {
      id: 'menu',
      name: 'Menú',
      type: 'menu',
      icon: '📖',
      elements: [
        { id: genId(), type: 'category-tabs', x: 10, y: 10, width: 355, height: 50, zIndex: 0, locked: false, visible: true, config: {} },
        { id: genId(), type: 'search-bar', x: 10, y: 70, width: 355, height: 48, zIndex: 1, locked: false, visible: true, config: { placeholder: 'Buscar platos...' } },
        { id: genId(), type: 'menu-list', x: 10, y: 130, width: 355, height: 450, zIndex: 2, locked: false, visible: true, config: { layout: 'list', showCategoryTitle: true, showProductImage: true, showProductDescription: true, showPrice: true } },
        { id: genId(), type: 'cart-summary', x: 10, y: 590, width: 355, height: 60, zIndex: 3, locked: false, visible: true, config: { showItemCount: true, showTotal: true } },
      ],
      config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 } },
    },
    {
      id: 'bill',
      name: 'Cuenta',
      type: 'bill',
      icon: '🧾',
      elements: [
        { id: genId(), type: 'text', x: 20, y: 30, width: 335, height: 40, zIndex: 0, locked: false, visible: true, config: { content: 'Cuenta Detallada', fontSize: 24, fontWeight: 'bold', color: '#2A2A2A', textAlign: 'center' } },
        { id: genId(), type: 'table-number', x: 20, y: 80, width: 335, height: 40, zIndex: 1, locked: false, visible: true, config: { prefix: 'Mesa ', fontSize: 20, textAlign: 'center' } },
        { id: genId(), type: 'bill-items', x: 10, y: 130, width: 355, height: 350, zIndex: 2, locked: false, visible: true, config: { showQuantity: true, showUnitPrice: true, showSubtotal: true } },
        { id: genId(), type: 'total-amount', x: 20, y: 500, width: 335, height: 60, zIndex: 3, locked: false, visible: true, config: { prefix: 'Total a pagar: ', fontSize: 28, fontWeight: 'bold', color: '#FF6B6B', textAlign: 'center' } },
        { id: genId(), type: 'action-button', x: 20, y: 580, width: 335, height: 56, zIndex: 4, locked: false, visible: true, config: { action: 'requestBill', label: 'Solicitar Cuenta para Pagar', icon: 'dollar-sign', variant: 'primary', size: 'lg', fullWidth: true } },
        { id: genId(), type: 'action-button', x: 20, y: 650, width: 335, height: 56, zIndex: 5, locked: false, visible: true, config: { action: 'viewMenu', label: 'Volver al Menú', icon: 'utensils', variant: 'secondary', size: 'lg', fullWidth: true } },
      ],
      config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FAFAFA' }, grid: { enabled: true, size: 8 } },
    },
  ], []);

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
            
            if (canvas.pages && Array.isArray(canvas.pages) && canvas.pages.length > 0) {
              setThemePages(canvas.pages);
              setGlobalConfig(canvas.globalConfig || data.theme.config || {});
              setThemeLoading(false);
              return;
            }
          }
        }
        // No active theme or legacy format - use defaults
        console.log('No active theme with multi-page format, using defaults');
        setThemePages(getDefaultThemePages());
        setGlobalConfig({ colors: { primary: '#FF6B6B', secondary: '#4ECDC4', background: '#FFFFFF', text: '#2A2A2A' }, font_family: 'system-ui', background_config: { type: 'color', value: '#FFFFFF' } });
      } catch (error) {
        console.error('Error cargando theme:', error);
        setThemePages(getDefaultThemePages());
        setGlobalConfig({ colors: { primary: '#FF6B6B', secondary: '#4ECDC4', background: '#FFFFFF', text: '#2A2A2A' }, font_family: 'system-ui', background_config: { type: 'color', value: '#FFFFFF' } });
      } finally {
        setThemeLoading(false);
      }
    };
    fetchTheme();
  }, [getDefaultThemePages]);

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

  const handleDynamicAction = useCallback(async (type, payload) => {
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
      case 'submitTable': {
        const n = parseInt(payload, 10);
        if (!Number.isFinite(n) || n <= 0) {
          showNotificationMsg('error', 'Ingresa un número de mesa válido');
          setTimeout(() => setNotification(null), 3000);
          break;
        }
        await startSession(n);
        setTableNumber(n);
        setScanned(true);
        break;
      }
    }
  }, [handleCallWaiter, handleRequestBill, handleCreateOrder, showNotificationMsg, startSession]);

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
      <div>
        {notification && <Notification type={notification.type} message={notification.message} />}
        <DynamicPageRenderer
          page={themePages.find(p => p.type === 'scan') || { type: 'scan', elements: [], config: { background_config: { type: 'color', value: '#FFF8F0' } } }}
          tableNumber={null}
          onAction={handleDynamicAction}
          globalConfig={globalConfig}
          menuItems={menuItems}
          categories={categories}
          promotions={promotions}
        />
      </div>
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