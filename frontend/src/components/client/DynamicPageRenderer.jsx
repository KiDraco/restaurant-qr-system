import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, UtensilsCrossed, Bell, Receipt, DollarSign, Search } from 'lucide-react';
import { PAGE_DIMENSIONS } from '../../hooks/useCanvas';

// Icon mapping for action buttons
const ACTION_ICONS = {
  utensils: <UtensilsCrossed className="w-5 h-5" />,
  bell: <Bell className="w-5 h-5" />,
  receipt: <Receipt className="w-5 h-5" />,
  'dollar-sign': <DollarSign className="w-5 h-5" />,
  qrcode: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  'chevron-left': <ChevronLeft className="w-5 h-5" />,
};

const ACTION_LABELS = {
  viewMenu: 'Ver Menú',
  callWaiter: 'Llamar Mesero',
  requestBill: 'Pedir Cuenta',
  viewBill: 'Ver Cuenta',
  scanAnother: 'Escanear otra mesa',
};

// Button variant styles
const BUTTON_VARIANTS = {
  primary: 'bg-[var(--theme-primary)] text-white hover:opacity-90',
  secondary: 'bg-[var(--theme-secondary)] text-white hover:opacity-90',
  outline: 'border-2 border-[var(--theme-primary)] text-[var(--theme-primary)] bg-transparent hover:bg-[var(--theme-primary)] hover:text-white',
  ghost: 'text-[var(--theme-text)] hover:bg-gray-100',
};

const BUTTON_SIZES = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-6 py-4 text-lg',
  xl: 'px-8 py-5 text-xl',
};

/**
 * Renders a single element from canvas_json with dynamic data
 */
export function DynamicElement({ 
  element, 
  pageType, 
  menuItems = [], 
  categories = [], 
  billData = null, 
  tableNumber = null,
  promotions = [],
  cart = { items: [], total: 0 },
  onAction 
}) {
  const { type, x, y, width, height, config = {}, visible = true } = element;
  if (!visible) return null;

  const baseStyle = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    overflow: 'hidden',
    pointerEvents: 'auto',
  };

  // Static elements (render as-is)
  if (type === 'image') {
    const { src, alt = '', borderRadius = 0, opacity = 1, objectFit = 'cover' } = config;
    if (!src) return (
      <div style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', border: '2px dashed #d1d5db', borderRadius }}>
        <span className="text-gray-400">📷</span>
      </div>
    );
    return (
      <img 
        src={src} 
        alt={alt}
        style={{ ...baseStyle, objectFit, borderRadius, opacity, display: 'block' }}
      />
    );
  }

  if (type === 'text') {
    const { content = '', fontFamily = 'system-ui', fontSize = 16, fontWeight = 'normal', color = '#2A2A2A', textAlign = 'left', lineHeight = 1.5 } = config;
    return (
      <div style={{ ...baseStyle, fontFamily, fontSize, fontWeight, color, textAlign, lineHeight, display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%', whiteSpace: 'pre-wrap' }}>{content}</div>
      </div>
    );
  }

  if (type === 'category') {
    const { title = '', fontFamily = 'system-ui', fontSize = 20, fontWeight = 'bold', color = '#2A2A2A', textAlign = 'left', separator = true, separatorColor = '#FF6B6B', separatorWidth = 2 } = config;
    return (
      <div style={{ ...baseStyle, fontFamily, fontSize, fontWeight, color, textAlign, display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: '100%' }}>{title}</div>
        {separator && <div style={{ width: '100%', height: separatorWidth, backgroundColor: separatorColor, marginTop: 8 }} />}
      </div>
    );
  }

  if (type === 'product') {
    const { name = 'Producto', description = '', price = '$0.00', nameFont = 'system-ui', nameSize = 16, nameWeight = 'semibold', nameColor = '#2A2A2A', descFont = 'system-ui', descSize = 13, descColor = '#666666', priceFont = 'system-ui', priceSize = 16, priceWeight = 'bold', priceColor = '#FF6B6B', layout = 'horizontal', spacing = 16 } = config;
    return (
      <div style={{ ...baseStyle, fontFamily: nameFont, display: layout === 'horizontal' ? 'flex' : 'flex', flexDirection: layout === 'horizontal' ? 'row' : 'column', alignItems: layout === 'horizontal' ? 'center' : 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: nameSize, fontWeight: nameWeight, color: nameColor }}>{name}</div>
          {description && <div style={{ fontFamily: descFont, fontSize: descSize, color: descColor, marginTop: 4 }}>{description}</div>}
        </div>
        <div style={{ fontFamily: priceFont, fontSize: priceSize, fontWeight: priceWeight, color: priceColor, marginLeft: layout === 'horizontal' ? spacing : 0, marginTop: layout === 'vertical' ? spacing : 0 }}>{price}</div>
      </div>
    );
  }

  if (type === 'separator') {
    const { color = '#FF6B6B', width: w = 2, style: lineStyle = 'solid', length = '100%' } = config;
    return (
      <div style={{ ...baseStyle, display: 'flex', alignItems: 'center' }}>
        <div style={{ width: length, height: w, backgroundColor: color, borderStyle: lineStyle }} />
      </div>
    );
  }

  if (type === 'decorative') {
    const { color = '#FF6B6B', width: w = 48, height: h = 48 } = config;
    return (
      <div style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
    );
  }

  if (type === 'logo') {
    const { src, alt = 'Logo', width: w = 120, height: h = 120, borderRadius = 0, opacity = 1 } = config;
    if (!src) return (
      <div style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius }}>
        <span className="text-4xl">🏷️</span>
      </div>
    );
    return (
      <img src={src} alt={alt} style={{ ...baseStyle, width: w, height: h, borderRadius, opacity }} />
    );
  }

  // Dynamic elements (require API data)
  
  if (type === 'menu-list') {
    const { layout = 'list', showCategoryTitle = true, showProductImage = true, showProductDescription = true, showPrice = true, productImageHeight = 120, productImageRadius = 8, itemSpacing = 16, categoryTitleSize = 20, categoryTitleWeight = 'bold', categoryTitleColor = '#2A2A2A', productNameSize = 16, productNameWeight = 'semibold', productNameColor = '#2A2A2A', productDescSize = 13, productDescColor = '#666666', productPriceSize = 16, productPriceWeight = 'bold', productPriceColor = '#FF6B6B' } = config;

    const itemsByCategory = useMemo(() => {
      const grouped = {};
      menuItems.forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
      });
      return grouped;
    }, [menuItems]);

    if (layout === 'grid') {
      return (
        <div style={{ ...baseStyle, maxHeight: height, overflow: 'auto' }} className="grid grid-cols-2 gap-4 p-4">
          {menuItems.map(item => (
            <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
              {showProductImage && item.image_url && (
                <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover" style={{ borderRadius: productImageRadius }} />
              )}
              <div className="p-3">
                <div className="font-semibold text-gray-800" style={{ fontSize: productNameSize, fontWeight: productNameWeight, color: productNameColor }}>{item.name}</div>
                {showProductDescription && item.description && <div className="text-sm text-gray-500 mt-1" style={{ fontSize: productDescSize, color: productDescColor }}>{item.description}</div>}
                {showPrice && <div className="mt-2 font-bold" style={{ fontSize: productPriceSize, fontWeight: productPriceWeight, color: productPriceColor }}>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.price)}</div>}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // List layout (default)
    return (
      <div style={{ ...baseStyle, maxHeight: height, overflow: 'auto' }} className="space-y-4 p-4">
        {categories.map(cat => {
          const items = itemsByCategory[cat] || [];
          if (items.length === 0) return null;
          return (
            <div key={cat} className="space-y-2">
              {showCategoryTitle && (
                <div className="font-semibold text-gray-800 pb-2 border-b border-gray-200" style={{ fontSize: categoryTitleSize, fontWeight: categoryTitleWeight, color: categoryTitleColor }}>
                  {cat}
                </div>
              )}
              {items.map(item => (
                <div key={item.id} className="flex gap-3 p-2 bg-white rounded-lg shadow-sm" onClick={() => onAction?.('order', item)}>
                  {showProductImage && item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" style={{ borderRadius: productImageRadius }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 truncate" style={{ fontSize: productNameSize, fontWeight: productNameWeight, color: productNameColor }}>{item.name}</div>
                    {showProductDescription && item.description && <div className="text-sm text-gray-500 mt-1 truncate" style={{ fontSize: productDescSize, color: productDescColor }}>{item.description}</div>}
                    {showPrice && <div className="mt-1 font-bold" style={{ fontSize: productPriceSize, fontWeight: productPriceWeight, color: productPriceColor }}>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.price)}</div>}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'category-tabs') {
    const { fontFamily = 'system-ui', fontSize = 14, fontWeight = 'medium', activeColor = '#FFFFFF', inactiveColor = '#666666', backgroundColor = '#FFFFFF', activeBackgroundColor = '#FF6B6B', borderRadius = 8, spacing = 8 } = config;
    const [activeTab, setActiveTab] = useState(categories[0] || 'all');
    
    return (
      <div style={{ ...baseStyle, fontFamily }}>
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ paddingBottom: 8 }}>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activeTab === 'all' ? 'text-white' : 'text-gray-600'}`}
            style={{ fontSize, fontWeight, color: activeTab === 'all' ? activeColor : inactiveColor, borderRadius, backgroundColor: activeTab === 'all' ? activeBackgroundColor : backgroundColor }}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activeTab === cat ? 'text-white' : 'text-gray-600'}`}
              style={{ fontSize, fontWeight, color: activeTab === cat ? activeColor : inactiveColor, borderRadius, backgroundColor: activeTab === cat ? activeBackgroundColor : backgroundColor }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'bill-items') {
    const { showQuantity = true, showUnitPrice = true, showSubtotal = true, itemNameSize = 16, itemNameWeight = 'semibold', itemNameColor = '#2A2A2A', detailSize = 13, detailColor = '#666666', priceSize = 16, priceWeight = 'bold', priceColor = '#FF6B6B', separatorColor = '#E5E5E5' } = config;
    const orders = billData?.orders || [];
    const formatPrice = (price) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price || 0);

    return (
      <div style={{ ...baseStyle, maxHeight: height, overflow: 'auto' }} className="space-y-3 p-4">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay órdenes registradas</div>
        ) : (
          <>
            {orders.map((order, index) => (
              <div key={index} className="flex justify-between items-start p-3 bg-white rounded-lg border-b" style={{ borderBottomColor: separatorColor }}>
                <div className="flex-1">
                  <div className="font-medium text-gray-800" style={{ fontSize: itemNameSize, fontWeight: itemNameWeight, color: itemNameColor }}>{order.item_name}</div>
                  <div className="text-sm text-gray-500 flex gap-4" style={{ fontSize: detailSize, color: detailColor }}>
                    {showQuantity && <span>{order.quantity} x {formatPrice(order.unit_price)}</span>}
                    {showUnitPrice && !showQuantity && <span>{formatPrice(order.unit_price)}</span>}
                  </div>
                </div>
                {(showUnitPrice || showSubtotal) && (
                  <div className="font-semibold text-gray-800 text-right" style={{ fontSize: priceSize, fontWeight: priceWeight, color: priceColor }}>
                    {showSubtotal ? formatPrice(order.subtotal) : formatPrice(order.unit_price)}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 border-t" style={{ borderColor: separatorColor }}>
              <div className="flex justify-between font-bold text-lg" style={{ color: priceColor }}>
                <span>Total</span>
                <span>{formatPrice(billData?.totalAmount)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (type === 'table-number') {
    const { prefix = 'Mesa ', fontFamily = 'system-ui', fontSize = 32, fontWeight = 'bold', color = '#2A2A2A', textAlign = 'center' } = config;
    return (
      <div style={{ ...baseStyle, fontFamily, fontSize, fontWeight, color, textAlign, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>{prefix}{tableNumber || '—'}</span>
      </div>
    );
  }

  if (type === 'total-amount') {
    const { prefix = 'Total: ', fontFamily = 'system-ui', fontSize = 28, fontWeight = 'bold', color = '#FF6B6B', textAlign = 'center', showCurrency = true } = config;
    const total = billData?.totalAmount || 0;
    const formatted = showCurrency ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(total) : total.toString();
    return (
      <div style={{ ...baseStyle, fontFamily, fontSize, fontWeight, color, textAlign, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>{prefix}{formatted}</span>
      </div>
    );
  }

  if (type === 'action-button') {
    const { action = 'viewMenu', label, icon = 'utensils', variant = 'primary', size = 'lg', fontFamily = 'system-ui', fontSize = 16, fontWeight = 'semibold', borderRadius = 12 } = config;
    const btnLabel = label || ACTION_LABELS[action] || 'Acción';
    const btnIcon = ACTION_ICONS[icon] || ACTION_ICONS.utensils;
    const variantClass = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;
    const sizeClass = BUTTON_SIZES[size] || BUTTON_SIZES.lg;

    const handleClick = () => {
      onAction?.('button', action);
    };

    return (
      <div style={{ ...baseStyle, display: 'flex' }}>
        <button
          onClick={handleClick}
          className={`${variantClass} ${sizeClass} rounded-xl font-semibold flex items-center justify-center gap-2 w-full transition-all duration-200`}
          style={{ fontFamily, fontSize, fontWeight, borderRadius }}
          disabled={!onAction}
        >
          {btnIcon}
          <span>{btnLabel}</span>
        </button>
      </div>
    );
  }

  if (type === 'search-bar') {
    const { placeholder = 'Buscar platos...', fontFamily = 'system-ui', fontSize = 16, fontWeight = 'normal', color = '#2A2A2A', backgroundColor = '#FFFFFF', borderColor = '#E5E5E5', borderRadius = 12, showIcon = true } = config;
    const [query, setQuery] = useState('');

    return (
      <div style={{ ...baseStyle, fontFamily }}>
        <div className="relative">
          {showIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search className="w-5 h-5" /></div>}
          <input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onAction?.('search', e.target.value);
            }}
            className={`w-full pl-${showIcon ? '10' : '4'} pr-4 py-3 rounded-xl border transition-colors`}
            style={{ 
              fontFamily, 
              fontSize, 
              fontWeight, 
              color, 
              backgroundColor, 
              borderColor, 
              borderRadius,
              borderWidth: 1,
            }}
          />
        </div>
      </div>
    );
  }

  if (type === 'cart-summary') {
    const { showItemCount = true, showTotal = true, fontFamily = 'system-ui', fontSize = 14, fontWeight = 'medium', color = '#2A2A2A', backgroundColor = '#FEF9E7', borderColor = '#F5E6A0', borderRadius = 8 } = config;
    const itemCount = cart?.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0;
    const total = cart?.total || 0;
    const formatPrice = (price) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price || 0);

    return (
      <div style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px' }} className="flex items-center justify-between p-3" >
        <div className="flex items-center gap-2">
          {showItemCount && <span className="bg-amber-500 text-white rounded-full px-2 py-0.5 text-xs">{itemCount}</span>}
          {showTotal && <span className="font-bold" style={{ fontSize }}>{formatPrice(total)}</span>}
        </div>
      </div>
    );
  }

  if (type === 'promo-banner') {
    const { showTitle = true, title = 'Promociones', fontFamily = 'system-ui', fontSize = 18, fontWeight = 'bold', color = '#FFFFFF', backgroundColor = '#FF6B6B', borderRadius = 12 } = config;
    const activePromos = promotions?.filter(p => p.active) || [];
    
    if (activePromos.length === 0) return null;

    return (
      <div style={{ ...baseStyle, fontFamily, fontSize, fontWeight, color, backgroundColor, borderRadius, padding: '16px' }} className="p-4 rounded-xl">
        {showTitle && <div className="mb-2">{title}</div>}
        <div className="space-y-2">
          {activePromos.map(promo => (
            <div key={promo.id} className="bg-white/20 rounded-lg p-3">
              <div className="font-semibold">{promo.name}</div>
              {promo.description && <div className="text-sm opacity-90">{promo.description}</div>}
              <div className="text-sm mt-1">{promo.discount_percentage}% OFF</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Unknown type fallback
  return (
    <div style={baseStyle} className="flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 text-gray-500 text-xs">
      {type}
    </div>
  );
}

/**
 * Renders a full page from canvas_json
 */
export function DynamicPageRenderer({ 
  page, 
  menuItems = [], 
  categories = [], 
  billData = null, 
  tableNumber = null,
  promotions = [],
  cart = { items: [], total: 0 },
  onAction,
  globalConfig = {},
  pageConfig = {},
}) {
  if (!page) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Página no encontrada</div>;

  const { elements = [], config = {} } = page;
  const background = config.background_config || { type: 'color', value: '#FFFFFF' };
  const format = config.page_format || 'mobile-portrait';
  const pageDims = PAGE_DIMENSIONS[format] || PAGE_DIMENSIONS['mobile-portrait'];

  // Calculate scale to fit page in viewport
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const updateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const padW = 20; // padding from outer wrapper
      const padH = 20;
      const s1 = (vw - padW) / pageDims.width;
      const s2 = (vh - padH) / pageDims.height;
      setScale(Math.min(s1, s2, 1));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [pageDims.width, pageDims.height]);

  // Background style object
  const backgroundStyleObj = useMemo(() => {
    switch (background.type) {
      case 'gradient':
        return { background: `linear-gradient(135deg, ${background.value?.from || '#FF6B6B'}, ${background.value?.to || '#4ECDC4'})` };
      case 'image':
        return { backgroundImage: `url(${background.value})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' };
      case 'color':
      default:
        return { backgroundColor: background.value || '#FFFFFF' };
    }
  }, [background]);

  // Global CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (globalConfig.colors) {
      Object.entries(globalConfig.colors).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value);
      });
    }
    if (globalConfig.font_family && globalConfig.font_family !== 'system') {
      root.style.setProperty('--theme-font', globalConfig.font_family);
    }
  }, [globalConfig]);

  // Container style — single style object, no duplicates
  const containerStyle = useMemo(() => ({
    width: pageDims.width,
    height: pageDims.height,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    margin: '0 auto',
    position: 'relative',
    background: backgroundStyleObj.background || backgroundStyleObj.backgroundColor || backgroundStyleObj.backgroundImage || '#FFFFFF',
    overflow: 'hidden',
  }), [scale, pageDims, backgroundStyleObj]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f3f4f6', padding: '10px' }}>
      <div className="relative" style={containerStyle}>
        {elements.map((element, index) => (
          <DynamicElement
            key={`${element.id}-${index}`}
            element={element}
            pageType={page.type}
            menuItems={menuItems}
            categories={categories}
            billData={billData}
            tableNumber={tableNumber}
            promotions={promotions}
            cart={cart}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
}

export default DynamicPageRenderer;
