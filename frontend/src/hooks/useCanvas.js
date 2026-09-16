/* eslint-disable */
import { useState, useCallback, useMemo, useRef } from 'react';

// Page types that map to client app screens
export const PAGE_TYPES = [
  { id: 'scan', name: 'Login / QR', icon: '📱', description: 'Pantalla de escaneo de QR / ingreso de mesa' },
  { id: 'table', name: 'Mesa Principal', icon: '🍽️', description: 'Vista principal con botones de acción' },
  { id: 'menu', name: 'Menú', icon: '📖', description: 'Lista de categorías y productos' },
  { id: 'bill', name: 'Cuenta', icon: '🧾', description: 'Detalle de consumo y total' },
];

export const PAGE_DIMENSIONS = {
  'A4-portrait': { width: 794, height: 1123 },
  'A4-landscape': { width: 1123, height: 794 },
  Letter: { width: 816, height: 1056 },
  'mobile-portrait': { width: 375, height: 667 },
  'mobile-landscape': { width: 667, height: 375 },
};

export const DEFAULT_ELEMENT_CONFIG = {
  // Static elements
  image: {
    src: '',
    alt: '',
    width: 300,
    height: 200,
    borderRadius: 0,
    opacity: 1,
    objectFit: 'cover',
    scale: 1,
    crop: { x: 0, y: 0, width: 1, height: 1 },
  },
  text: {
    content: 'Nuevo texto',
    fontFamily: 'system-ui',
    fontSize: 16,
    fontWeight: 'normal',
    color: '#2A2A2A',
    textAlign: 'left',
    lineHeight: 1.5,
    letterSpacing: 'normal',
    width: 200,
  },
  category: {
    title: 'Categoría',
    fontFamily: 'system-ui',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    textAlign: 'left',
    separator: true,
    separatorColor: '#FF6B6B',
    separatorWidth: 2,
    separatorStyle: 'solid',
    paddingTop: 16,
    paddingBottom: 8,
  },
  product: {
    name: 'Producto',
    description: '',
    price: '$0.00',
    nameFont: 'system-ui',
    nameSize: 16,
    nameWeight: 'semibold',
    nameColor: '#2A2A2A',
    descFont: 'system-ui',
    descSize: 13,
    descColor: '#666666',
    priceFont: 'system-ui',
    priceSize: 16,
    priceWeight: 'bold',
    priceColor: '#FF6B6B',
    layout: 'horizontal',
    spacing: 16,
    showPrice: true,
  },
  separator: {
    color: '#FF6B6B',
    width: 2,
    style: 'solid',
    length: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  decorative: {
    kind: 'divider-icon',
    src: '',
    color: '#FF6B6B',
    width: 48,
    height: 48,
    opacity: 1,
    rotation: 0,
  },
  logo: {
    src: '',
    alt: 'Logo',
    width: 120,
    height: 120,
    borderRadius: 0,
    opacity: 1,
    linkUrl: '',
  },
  // Dynamic elements (connected to API data)
  'menu-list': {
    // Shows categories + products from /api/menu
    layout: 'list', // 'list' | 'grid' | 'carousel'
    showCategoryTitle: true,
    showProductImage: true,
    showProductDescription: true,
    showPrice: true,
    productImageHeight: 120,
    productImageRadius: 8,
    itemSpacing: 16,
    categoryTitleSize: 20,
    categoryTitleWeight: 'bold',
    categoryTitleColor: '#2A2A2A',
    productNameSize: 16,
    productNameWeight: 'semibold',
    productNameColor: '#2A2A2A',
    productDescSize: 13,
    productDescColor: '#666666',
    productPriceSize: 16,
    productPriceWeight: 'bold',
    productPriceColor: '#FF6B6B',
  },
  'bill-items': {
    // Shows orders from /api/orders/table/X/bill
    showQuantity: true,
    showUnitPrice: true,
    showSubtotal: true,
    itemNameSize: 16,
    itemNameWeight: 'semibold',
    itemNameColor: '#2A2A2A',
    detailSize: 13,
    detailColor: '#666666',
    priceSize: 16,
    priceWeight: 'bold',
    priceColor: '#FF6B6B',
    separatorColor: '#E5E5E5',
  },
  'table-number': {
    // Dynamic: shows current table number
    prefix: 'Mesa ',
    fontFamily: 'system-ui',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2A2A2A',
    textAlign: 'center',
  },
  'total-amount': {
    // Dynamic: shows bill total
    prefix: 'Total: ',
    fontFamily: 'system-ui',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
    showCurrency: true,
  },
  'action-button': {
    // Dynamic action: viewMenu, callWaiter, requestBill, viewBill, scanAnother
    action: 'viewMenu',
    label: 'Ver Menú',
    icon: 'utensils',
    variant: 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost'
    size: 'lg', // 'sm' | 'md' | 'lg' | 'xl'
    fullWidth: true,
    fontFamily: 'system-ui',
    fontSize: 16,
    fontWeight: 'semibold',
    borderRadius: 12,
  },
  'search-bar': {
    // Search input for menu
    placeholder: 'Buscar platos...',
    fontFamily: 'system-ui',
    fontSize: 16,
    fontWeight: 'normal',
    color: '#2A2A2A',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5E5',
    borderRadius: 12,
    showIcon: true,
  },
  'cart-summary': {
    // Shows current order summary
    showItemCount: true,
    showTotal: true,
    fontFamily: 'system-ui',
    fontSize: 14,
    fontWeight: 'medium',
    color: '#2A2A2A',
    backgroundColor: '#FEF9E7',
    borderColor: '#F5E6A0',
    borderRadius: 8,
  },
  'cart-panel': {
    // Full-page overlay with order lines, steppers and confirm button
    title: 'Tu pedido',
    confirmLabel: 'Confirmar pedido',
    emptyText: 'Tu pedido está vacío',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    confirmBackgroundColor: '#FF6B6B',
    confirmTextColor: '#FFFFFF',
    textColor: '#2A2A2A',
    mutedColor: '#666666',
  },
  'promo-banner': {
    // Shows active promotions
    showTitle: true,
    title: 'Promociones',
    fontFamily: 'system-ui',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
  },
  'category-tabs': {
    // Horizontal category tabs for menu
    fontFamily: 'system-ui',
    fontSize: 14,
    fontWeight: 'medium',
    activeColor: '#FFFFFF',
    inactiveColor: '#666666',
    backgroundColor: '#FFFFFF',
    activeBackgroundColor: '#FF6B6B',
    borderRadius: 8,
    spacing: 8,
  },
  'table-input': {
    // Dev-only manual table number entry on scan page
    placeholder: 'N° de mesa',
    buttonLabel: 'Entrar',
    fontFamily: 'system-ui',
    fontSize: 16,
    fontWeight: 'normal',
    color: '#2A2A2A',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5E5',
    borderRadius: 12,
    buttonVariant: 'primary',
  },
};

function getDefaultPosition(existingElements, canvasWidth, canvasHeight) {
  // Place new elements at top-left with slight stagger based on count
  const stagger = existingElements.length * 20;
  return {
    x: 40 + stagger,
    y: 40 + stagger,
  };
}

export function useCanvas() {
  // Multi-page state
  const [pages, setPages] = useState([
    {
      id: 'scan',
      name: 'Login / QR',
      type: 'scan',
      icon: '📱',
      elements: [],
      config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 } },
    },
    {
      id: 'table',
      name: 'Mesa Principal',
      type: 'table',
      icon: '🍽️',
      elements: [],
      config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 } },
    },
    {
      id: 'menu',
      name: 'Menú',
      type: 'menu',
      icon: '📖',
      elements: [],
      config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 } },
    },
    {
      id: 'bill',
      name: 'Cuenta',
      type: 'bill',
      icon: '🧾',
      elements: [],
      config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 } },
    },
  ]);
  const [activePageId, setActivePageId] = useState('scan');
  const [selectedId, setSelectedId] = useState(null);

  // Global canvas config (theme-wide)
  const [globalConfig, setGlobalConfigState] = useState({
    colors: { primary: '#FF6B6B', secondary: '#4ECDC4', background: '#FFFFFF', text: '#2A2A2A' },
    font_family: 'system-ui',
    background_config: { type: 'color', value: '#FFFFFF' },
  });

  // Ref mirrors for stable callbacks
  const elementsRef = useRef({});
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  elementsRef.current = elementsRef.current; // Will be set per page

  // Get current page elements
  const activePage = useMemo(() => pages.find(p => p.id === activePageId) || pages[0], [pages, activePageId]);
  const elements = activePage?.elements || [];
  const pageConfig = activePage?.config || { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 } };

  // Update elementsRef for current page
  elementsRef.current = elements;

  const canvasSize = useMemo(() => {
    const format = pageConfig.page_format || 'mobile-portrait';
    return PAGE_DIMENSIONS[format] || PAGE_DIMENSIONS['mobile-portrait'];
  }, [pageConfig.page_format]);

  const setGlobalConfig = useCallback((updates) => {
    setGlobalConfigState(prev => ({ ...prev, ...updates }));
  }, []);

  const setPageConfig = useCallback((pageId, updates) => {
    setPages(prev => prev.map(p => {
      if (p.id !== pageId) return p;
      return { ...p, config: { ...p.config, ...updates } };
    }));
  }, []);

  const selectElement = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const addElement = useCallback((type, configOverrides = {}, customId = null) => {
    const defaults = DEFAULT_ELEMENT_CONFIG[type] || {};
    const current = elementsRef.current;
    const position = getDefaultPosition(current, canvasSize.width, canvasSize.height);
    
    const newElement = {
      id: customId || crypto.randomUUID(),
      type,
      x: configOverrides.x ?? position.x,
      y: configOverrides.y ?? position.y,
      width: configOverrides.width ?? (defaults.width || 200),
      height: configOverrides.height ?? (defaults.height || 100),
      zIndex: current.length,
      locked: configOverrides.locked || false,
      visible: configOverrides.visible !== false,
      config: { ...defaults, ...configOverrides },
    };

    setPages(prev => prev.map(p => {
      if (p.id !== activePageId) return p;
      return { ...p, elements: [...p.elements, newElement] };
    }));
    return newElement.id;
  }, [activePageId, canvasSize.width, canvasSize.height]);

  const updateElement = useCallback((id, updates) => {
    setPages(prev => prev.map(p => {
      if (p.id !== activePageId) return p;
      return {
        ...p,
        elements: p.elements.map(el => {
          if (el.id !== id) return el;
          
          const updated = { ...el };
          
          if ('x' in updates) updated.x = Math.max(0, Math.min(updates.x, canvasSize.width - (el.width || 0)));
          if ('y' in updates) updated.y = Math.max(0, Math.min(updates.y, canvasSize.height - (el.height || 0)));
          if ('width' in updates) updated.width = Math.max(10, Math.min(updates.width, canvasSize.width - (el.x || 0)));
          if ('height' in updates) updated.height = Math.max(10, Math.min(updates.height, canvasSize.height - (el.y || 0)));
          if ('zIndex' in updates) updated.zIndex = updates.zIndex;
          if ('locked' in updates) updated.locked = updates.locked;
          if ('visible' in updates) updated.visible = updates.visible;
          if (updates.config) updated.config = { ...updated.config, ...updates.config };
          
          ['x', 'y', 'width', 'height', 'zIndex', 'locked', 'visible'].forEach(key => {
            if (key in updates) updated[key] = updates[key];
          });
          
          return updated;
        })
      };
    }));
  }, [activePageId, canvasSize.width, canvasSize.height]);

  const deleteElement = useCallback((id) => {
    setPages(prev => prev.map(p => {
      if (p.id !== activePageId) return p;
      return { ...p, elements: p.elements.filter(el => el.id !== id) };
    }));
    if (selectedId === id) setSelectedId(null);
  }, [activePageId, selectedId]);

  const duplicateElement = useCallback((id) => {
    const page = pagesRef.current.find(p => p.id === activePageId);
    if (!page) return;
    
    const element = page.elements.find(el => el.id === id);
    if (!element) return;
    
    const newId = crypto.randomUUID();
    const duplicated = {
      ...element,
      id: newId,
      x: element.x + 20,
      y: element.y + 20,
      zIndex: page.elements.length,
    };
    
    setPages(prev => prev.map(p => {
      if (p.id !== activePageId) return p;
      return { ...p, elements: [...p.elements, duplicated] };
    }));
    return newId;
  }, [activePageId]);

  const reorderElements = useCallback((fromIndex, toIndex) => {
    setPages(prev => prev.map(p => {
      if (p.id !== activePageId) return p;
      const newElements = [...p.elements];
      const [removed] = newElements.splice(fromIndex, 1);
      newElements.splice(toIndex, 0, removed);
      return { ...p, elements: newElements.map((el, idx) => ({ ...el, zIndex: idx })) };
    }));
  }, [activePageId]);

  const moveElementInLayer = useCallback((id, direction) => {
    setPages(prev => prev.map(p => {
      if (p.id !== activePageId) return p;
      const index = p.elements.findIndex(el => el.id === id);
      if (index === -1) return p;
      
      let newIndex = index;
      if (direction === 'front') newIndex = p.elements.length - 1;
      else if (direction === 'back') newIndex = 0;
      else if (direction === 'forward') newIndex = Math.min(index + 1, p.elements.length - 1);
      else if (direction === 'backward') newIndex = Math.max(index - 1, 0);
      
      if (newIndex === index) return p;
      
      const newElements = [...p.elements];
      const [removed] = newElements.splice(index, 1);
      newElements.splice(newIndex, 0, removed);
      return { ...p, elements: newElements.map((el, idx) => ({ ...el, zIndex: idx })) };
    }));
  }, [activePageId]);

  // Page management
  const addPage = useCallback((type, config = {}) => {
    const pageType = PAGE_TYPES.find(t => t.id === type) || PAGE_TYPES[0];
    const newPage = {
      id: type + '-' + Date.now(),
      name: pageType.name,
      type,
      icon: pageType.icon,
      elements: [],
      config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 }, ...config },
    };
    setPages(prev => [...prev, newPage]);
    setActivePageId(newPage.id);
    return newPage.id;
  }, []);

  const deletePage = useCallback((pageId) => {
    setPages(prev => {
      const filtered = prev.filter(p => p.id !== pageId);
      if (filtered.length === 0) return prev; // Don't allow deleting all pages
      return filtered;
    });
    setActivePageId(prev => {
      const page = pagesRef.current.find(p => p.id === prev);
      if (!page) return pagesRef.current[0]?.id || 'scan';
      return prev; // Keep current if not deleted
    });
  }, []);

  const duplicatePage = useCallback((pageId) => {
    const page = pagesRef.current.find(p => p.id === pageId);
    if (!page) return;
    
    const newPage = {
      ...page,
      id: page.id + '-copy-' + Date.now(),
      name: page.name + ' (copia)',
      elements: page.elements.map((el, idx) => ({ ...el, id: crypto.randomUUID(), zIndex: idx })),
    };
    setPages(prev => [...prev, newPage]);
    setActivePageId(newPage.id);
    return newPage.id;
  }, []);

  const reorderPages = useCallback((fromIndex, toIndex) => {
    setPages(prev => {
      const newPages = [...prev];
      const [removed] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, removed);
      return newPages;
    });
  }, []);

  const setActivePage = useCallback((pageId) => {
    setActivePageId(pageId);
    setSelectedId(null);
  }, []);

  const resetCanvas = useCallback(() => {
    setPages([
      { id: 'scan', name: 'Login / QR', type: 'scan', icon: '📱', elements: [], config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 } } },
      { id: 'table', name: 'Mesa Principal', type: 'table', icon: '🍽️', elements: [], config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 } } },
      { id: 'menu', name: 'Menú', type: 'menu', icon: '📖', elements: [], config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 } } },
      { id: 'bill', name: 'Cuenta', type: 'bill', icon: '🧾', elements: [], config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 } } },
    ]);
    setActivePageId('scan');
    setSelectedId(null);
    setGlobalConfigState({
      colors: { primary: '#FF6B6B', secondary: '#4ECDC4', background: '#FFFFFF', text: '#2A2A2A' },
      font_family: 'system-ui',
      background_config: { type: 'color', value: '#FFFFFF' },
    });
  }, []);

  // Migration: load from legacy single-page canvas_json
  const loadFromLegacyCanvas = useCallback((legacyCanvas) => {
    if (!legacyCanvas) return;
    
    // If already has pages, use as-is
    if (legacyCanvas.pages && Array.isArray(legacyCanvas.pages)) {
      setPages(legacyCanvas.pages);
      setActivePageId(legacyCanvas.pages[0]?.id || 'scan');
      if (legacyCanvas.globalConfig) setGlobalConfigState(legacyCanvas.globalConfig);
      return;
    }
    
    // Legacy: single canvas with elements
    // Distribute elements to pages by type hints or put all in 'menu' page
    const elements = legacyCanvas.elements || [];
    const newPages = PAGE_TYPES.map(pt => ({
      id: pt.id,
      name: pt.name,
      type: pt.id,
      icon: pt.icon,
      elements: pt.id === 'menu' ? elements : [], // Put legacy elements in menu page
      config: { 
        page_format: legacyCanvas.page_format || 'mobile-portrait', 
        background_config: legacyCanvas.background_config || { type: 'color', value: '#FFFFFF' },
        grid: legacyCanvas.grid || { enabled: true, size: 8 }
      },
    }));
    setPages(newPages);
    setActivePageId('scan');
    if (legacyCanvas.globalConfig || legacyCanvas.config) {
      setGlobalConfigState({ ...globalConfig, ...legacyCanvas.globalConfig, ...legacyCanvas.config });
    }
  }, []);

  const snapToGrid = useCallback((value, gridSize = 8) => {
    return Math.round(value / gridSize) * gridSize;
  }, []);

  // Export canvas state as JSON for saving
  const exportCanvas = useCallback(() => ({
    pages: pages.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      icon: p.icon,
      elements: p.elements.map(el => ({
        id: el.id,
        type: el.type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        zIndex: el.zIndex || 0,
        locked: el.locked || false,
        visible: el.visible !== false,
        config: el.config,
      })),
      config: p.config,
    })),
    globalConfig,
  }), [pages, globalConfig]);

  return {
    // Page state
    pages,
    activePageId,
    activePage,
    setActivePage,
    addPage,
    deletePage,
    duplicatePage,
    reorderPages,
    
    // Element state (for active page)
    elements,
    selectedId,
    canvasConfig: pageConfig,
    canvasSize,
    
    // Global config
    globalConfig,
    setGlobalConfig,
    setPageConfig,
    
    // Element actions
    selectElement,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    reorderElements,
    moveElementInLayer,
    
    // Canvas actions
    resetCanvas,
    loadFromLegacyCanvas,
    exportCanvas,
    snapToGrid,
    
    // Constants
    DEFAULT_ELEMENT_CONFIG,
    PAGE_DIMENSIONS,
    PAGE_TYPES,
  };
}

export default useCanvas;