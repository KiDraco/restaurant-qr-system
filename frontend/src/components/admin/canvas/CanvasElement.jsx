import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ImageElement } from './elements/ImageElement';
import { TextElement } from './elements/TextElement';
import { CategoryElement } from './elements/CategoryElement';
import { ProductElement } from './elements/ProductElement';
import { SeparatorElement } from './elements/SeparatorElement';
import { DecorativeElement } from './elements/DecorativeElement';
import { LogoElement } from './elements/LogoElement';

// Dynamic element preview components (for editor)
function MenuListPreview({ element, isSelected, isDragging, isResizing }) {
  const { width, height } = element;
  const cfg = element.config || {};
  const itemCount = 4;
  const itemHeight = Math.min(height / itemCount, 80);
  return (
    <g>
      <rect x={0} y={0} width={width} height={height} fill="#F9FAFB" stroke="#E5E7EB" strokeWidth={1} rx={8} />
      {Array.from({ length: itemCount }, (_, i) => (
        <g key={i} transform={`translate(12, ${12 + i * (itemHeight + 8)})`}>
          {cfg.showProductImage !== false && (
            <rect x={0} y={0} width={60} height={60} fill="#E5E7EB" rx={cfg.productImageRadius || 8} />
          )}
          <rect x={cfg.showProductImage !== false ? 72 : 0} y={8} width={width - (cfg.showProductImage !== false ? 84 : 12)} height={16} fill="#D1D5DB" rx={4} />
          {cfg.showProductDescription !== false && (
            <rect x={cfg.showProductImage !== false ? 72 : 0} y={28} width={width - (cfg.showProductImage !== false ? 84 : 12)} height={10} fill="#E5E7EB" rx={4} />
          )}
          {cfg.showPrice !== false && (
            <rect x={cfg.showProductImage !== false ? 72 : 0} y={42} width={50} height={14} fill="#FEF3C7" rx={4} />
          )}
        </g>
      ))}
      <text x={width/2} y={height - 8} textAnchor="middle" fontSize="10" fill="#9CA3AF" fontFamily="system-ui">
        [Lista de Menú - {cfg.layout || 'list'}]
      </text>
    </g>
  );
}

function CategoryTabsPreview({ element, isSelected, isDragging, isResizing }) {
  const { width, height } = element;
  const cfg = element.config || {};
  const tabCount = 3;
  const tabWidth = width / tabCount;
  return (
    <g>
      <rect x={0} y={0} width={width} height={height} fill={cfg.backgroundColor || '#FFFFFF'} stroke="#E5E7EB" strokeWidth={1} rx={cfg.borderRadius || 8} />
      {['Entrantes', 'Principales', 'Postres'].map((label, i) => (
        <g key={i} transform={`translate(${i * tabWidth}, 0)`}>
          <rect x={4} y={4} width={tabWidth - 8} height={height - 8} fill={i === 0 ? cfg.activeBackgroundColor || '#FF6B6B' : 'transparent'} rx={cfg.borderRadius || 8} />
          <text x={tabWidth/2} y={height/2 + 4} textAnchor="middle" fontSize={cfg.fontSize || 14} fontFamily={cfg.fontFamily || 'system-ui'} fontWeight={cfg.fontWeight || 'medium'} fill={i === 0 ? cfg.activeColor || '#FFFFFF' : cfg.inactiveColor || '#666666'}>
            {label}
          </text>
        </g>
      ))}
      <text x={width/2} y={height + 14} textAnchor="middle" fontSize="10" fill="#9CA3AF" fontFamily="system-ui">[Tabs Categoría]</text>
    </g>
  );
}

function BillItemsPreview({ element, isSelected, isDragging, isResizing }) {
  const { width, height } = element;
  const cfg = element.config || {};
  const items = ['2× Pizza Margherita', '1× Coca Cola', '1× Flan Casero'];
  return (
    <g>
      <rect x={0} y={0} width={width} height={height} fill="#FAFAFA" stroke="#E5E7EB" strokeWidth={1} rx={8} />
      {items.map((item, i) => (
        <g key={i} transform={`translate(12, ${16 + i * 32})`}>
          <text x={0} y={0} fontSize={cfg.itemNameSize || 14} fontFamily="system-ui" fontWeight={cfg.itemNameWeight || 'semibold'} fill={cfg.itemNameColor || '#2A2A2A'}>{item}</text>
          {cfg.showUnitPrice !== false && <text x={width - 60} y={0} fontSize={cfg.priceSize || 14} fontFamily="system-ui" fontWeight={cfg.priceWeight || 'bold'} fill={cfg.priceColor || '#FF6B6B'} textAnchor="end">$8.500</text>}
          {cfg.showQuantity !== false && <text x={width - 100} y={0} fontSize={12} fontFamily="system-ui" fill={cfg.detailColor || '#666666'} textAnchor="end">x2</text>}
          {cfg.showSubtotal !== false && <text x={width - 12} y={0} fontSize={cfg.priceSize || 14} fontFamily="system-ui" fontWeight={cfg.priceWeight || 'bold'} fill={cfg.priceColor || '#FF6B6B'} textAnchor="end">$17.000</text>}
        </g>
      ))}
      {items.length > 0 && (
        <line x1={12} y1={16 + items.length * 32} x2={width - 12} y2={16 + items.length * 32} stroke={cfg.separatorColor || '#E5E5E5'} strokeWidth={1} />
      )}
      <text x={width/2} y={height - 4} textAnchor="middle" fontSize="10" fill="#9CA3AF" fontFamily="system-ui">[Items de Cuenta]</text>
    </g>
  );
}

function TableNumberPreview({ element, isSelected, isDragging, isResizing }) {
  const { width, height } = element;
  const cfg = element.config || {};
  return (
    <g>
      <rect x={0} y={0} width={width} height={height} fill="transparent" />
      <text 
        x={cfg.textAlign === 'center' ? width/2 : cfg.textAlign === 'right' ? width : 0}
        y={height/2 + 6}
        textAnchor={cfg.textAlign === 'center' ? 'middle' : cfg.textAlign === 'right' ? 'end' : 'start'}
        fontSize={cfg.fontSize || 32}
        fontFamily={cfg.fontFamily || 'system-ui'}
        fontWeight={cfg.fontWeight || 'bold'}
        fill={cfg.color || '#2A2A2A'}
      >
        {cfg.prefix || 'Mesa '}5
      </text>
      <text x={width/2} y={height + 14} textAnchor="middle" fontSize="10" fill="#9CA3AF" fontFamily="system-ui">[Número de Mesa]</text>
    </g>
  );
}

function TotalAmountPreview({ element, isSelected, isDragging, isResizing }) {
  const { width, height } = element;
  const cfg = element.config || {};
  return (
    <g>
      <rect x={0} y={0} width={width} height={height} fill="transparent" />
      <text 
        x={cfg.textAlign === 'center' ? width/2 : cfg.textAlign === 'right' ? width : 0}
        y={height/2 + 6}
        textAnchor={cfg.textAlign === 'center' ? 'middle' : cfg.textAlign === 'right' ? 'end' : 'start'}
        fontSize={cfg.fontSize || 28}
        fontFamily={cfg.fontFamily || 'system-ui'}
        fontWeight={cfg.fontWeight || 'bold'}
        fill={cfg.color || '#FF6B6B'}
      >
        {cfg.prefix || 'Total: '}$42.500
      </text>
      <text x={width/2} y={height + 14} textAnchor="middle" fontSize="10" fill="#9CA3AF" fontFamily="system-ui">[Total a Pagar]</text>
    </g>
  );
}

function ActionButtonPreview({ element, isSelected, isDragging, isResizing }) {
  const { width, height } = element;
  const cfg = element.config || {};
  const variants = {
    primary: { bg: '#FF6B6B', color: '#FFFFFF', border: '#FF6B6B' },
    secondary: { bg: '#4ECDC4', color: '#FFFFFF', border: '#4ECDC4' },
    outline: { bg: 'transparent', color: '#FF6B6B', border: '#FF6B6B' },
    ghost: { bg: 'transparent', color: '#6B7280', border: 'transparent' },
  };
  const v = variants[cfg.variant || 'primary'] || variants.primary;
  const icons = { utensils: '🍽️', bell: '🔔', receipt: '🧾', 'dollar-sign': '💰', qrcode: '📱', 'chevron-left': '←' };
  return (
    <g>
      <rect x={0} y={0} width={width} height={height} rx={cfg.borderRadius || 12} fill={v.bg} stroke={v.border} strokeWidth={cfg.variant === 'outline' ? 2 : 0} />
      <text x={width/2} y={height/2 + 5} textAnchor="middle" fontSize={cfg.fontSize || 16} fontFamily={cfg.fontFamily || 'system-ui'} fontWeight={cfg.fontWeight || 'semibold'} fill={v.color}>
        {icons[cfg.icon || 'utensils'] || cfg.icon} {cfg.label || 'Ver Menú'}
      </text>
      <text x={width/2} y={height + 14} textAnchor="middle" fontSize="10" fill="#9CA3AF" fontFamily="system-ui">[Botón: {cfg.action || 'viewMenu'}]</text>
    </g>
  );
}

function SearchBarPreview({ element, isSelected, isDragging, isResizing }) {
  const { width, height } = element;
  const cfg = element.config || {};
  return (
    <g>
      <rect x={0} y={0} width={width} height={height} rx={cfg.borderRadius || 12} fill={cfg.backgroundColor || '#FFFFFF'} stroke={cfg.borderColor || '#E5E7EB'} strokeWidth={1} />
      {cfg.showIcon && <text x={16} y={height/2 + 5} fontSize={16} textAnchor="middle">🔍</text>}
      <text x={cfg.showIcon ? 40 : 16} y={height/2 + 5} fontSize={cfg.fontSize || 16} fontFamily={cfg.fontFamily || 'system-ui'} fontWeight={cfg.fontWeight || 'normal'} fill={cfg.color || '#9CA3AF'}>
        {cfg.placeholder || 'Buscar platos...'}
      </text>
      <text x={width/2} y={height + 14} textAnchor="middle" fontSize="10" fill="#9CA3AF" fontFamily="system-ui">[Barra de Búsqueda]</text>
    </g>
  );
}

function CartSummaryPreview({ element, isSelected, isDragging, isResizing }) {
  const { width, height } = element;
  const cfg = element.config || {};
  return (
    <g>
      <rect x={0} y={0} width={width} height={height} rx={cfg.borderRadius || 8} fill={cfg.backgroundColor || '#FEF9E7'} stroke={cfg.borderColor || '#F5E6A0'} strokeWidth={1} />
      <text x={width/2} y={height/2 + 5} textAnchor="middle" fontSize={cfg.fontSize || 14} fontFamily={cfg.fontFamily || 'system-ui'} fontWeight={cfg.fontWeight || 'medium'} fill={cfg.color || '#2A2A2A'}>
        {cfg.showItemCount !== false ? '3 items' : ''} {cfg.showItemCount !== false && cfg.showTotal !== false ? '·' : ''} {cfg.showTotal !== false ? '$42.500' : ''}
      </text>
      <text x={width/2} y={height + 14} textAnchor="middle" fontSize="10" fill="#9CA3AF" fontFamily="system-ui">[Resumen Carrito]</text>
    </g>
  );
}

function PromoBannerPreview({ element, isSelected, isDragging, isResizing }) {
  const { width, height } = element;
  const cfg = element.config || {};
  return (
    <g>
      <rect x={0} y={0} width={width} height={height} rx={cfg.borderRadius || 12} fill={cfg.backgroundColor || '#FF6B6B'} />
      {cfg.showTitle !== false && (
        <text x={width/2} y={height/2 + 6} textAnchor="middle" fontSize={cfg.fontSize || 18} fontFamily={cfg.fontFamily || 'system-ui'} fontWeight={cfg.fontWeight || 'bold'} fill={cfg.color || '#FFFFFF'}>
          {cfg.title || 'Promociones'}
        </text>
      )}
      <text x={width/2} y={height + 14} textAnchor="middle" fontSize="10" fill="#9CA3AF" fontFamily="system-ui">[Banner Promociones]</text>
    </g>
  );
}

const elementComponents = {
  image: ImageElement,
  text: TextElement,
  category: CategoryElement,
  product: ProductElement,
  separator: SeparatorElement,
  decorative: DecorativeElement,
  logo: LogoElement,
  // Dynamic elements (preview in editor)
  'menu-list': MenuListPreview,
  'category-tabs': CategoryTabsPreview,
  'bill-items': BillItemsPreview,
  'table-number': TableNumberPreview,
  'total-amount': TotalAmountPreview,
  'action-button': ActionButtonPreview,
  'search-bar': SearchBarPreview,
  'cart-summary': CartSummaryPreview,
  'promo-banner': PromoBannerPreview,
};

const RESIZE_HANDLES = [
  { position: 'nw', cursor: 'nwse-resize', dx: -1, dy: -1 },
  { position: 'n', cursor: 'ns-resize', dx: 0, dy: -1 },
  { position: 'ne', cursor: 'nesw-resize', dx: 1, dy: -1 },
  { position: 'e', cursor: 'ew-resize', dx: 1, dy: 0 },
  { position: 'se', cursor: 'nwse-resize', dx: 1, dy: 1 },
  { position: 's', cursor: 'ns-resize', dx: 0, dy: 1 },
  { position: 'sw', cursor: 'nesw-resize', dx: -1, dy: 1 },
  { position: 'w', cursor: 'ew-resize', dx: -1, dy: 0 },
];

export function CanvasElement({ 
  element, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete, 
  onDuplicate,
  onReorderElements,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const elementRef = useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: dndIsDragging,
  } = useDraggable({
    id: element.id,
    disabled: element.locked,
  });

  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition: dndIsDragging ? 'none' : transition || 'transform 0.1s ease-out',
    pointerEvents: element.locked ? 'none' : 'auto',
  }), [transform, transition, dndIsDragging, element.locked]);

  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(element.id);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  useEffect(() => {
    const handleClick = () => setShowContextMenu(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleResizeStart = (handle, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (element.locked) return;
    setIsResizing(true);
    setResizeHandle(handle);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isSelected) return;
      
      const step = e.shiftKey ? 10 : 1;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          onUpdate(element.id, { y: Math.max(0, element.y - 10) });
          break;
        case 'ArrowDown':
          e.preventDefault();
          onUpdate(element.id, { y: Math.min(1123 - element.height, element.y + 10) });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onUpdate(element.id, { x: Math.max(0, element.x - 10) });
          break;
        case 'ArrowRight':
          e.preventDefault();
          onUpdate(element.id, { x: Math.min(794 - element.width, element.x + 10) });
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (!element.locked) onDelete(element.id);
          break;
        case 'd':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onDuplicate(element.id);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, element.id, element.locked, element.width, element.height, onDelete, onDuplicate]);

  const ElementComponent = elementComponents[element.type] || TextElement;
  const content = React.createElement(ElementComponent, { 
    element, 
    isSelected, 
    isDragging: isDragging || dndIsDragging,
    isResizing,
  });

  return (
    <g
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onContextMenu={handleContextMenu}
      style={style}
      transform={`translate(${element.x}, ${element.y})`}
    >
      <g ref={elementRef} onMouseDown={(e) => { e.stopPropagation(); onSelect(element.id); }}>
        {content}
      </g>
      
      {isSelected && !element.locked && (
        <g>
          <rect
            x={-2}
            y={-2}
            width={element.width + 4}
            height={element.height + 4}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeDasharray="4,4"
            pointerEvents="none"
          />
          
          {[
            { position: 'nw', cursor: 'nwse-resize', dx: -1, dy: -1 },
            { position: 'n', cursor: 'ns-resize', dx: 0, dy: -1 },
            { position: 'ne', cursor: 'nesw-resize', dx: 1, dy: -1 },
            { position: 'e', cursor: 'ew-resize', dx: 1, dy: 0 },
            { position: 'se', cursor: 'nwse-resize', dx: 1, dy: 1 },
            { position: 's', cursor: 'ns-resize', dx: 0, dy: 1 },
            { position: 'sw', cursor: 'nesw-resize', dx: -1, dy: 1 },
            { position: 'w', cursor: 'ew-resize', dx: -1, dy: 0 },
          ].map(handle => (
            <rect
              key={handle.position}
              x={handle.dx === -1 ? -6 : handle.dx === 1 ? element.width + 2 : element.width / 2 - 4}
              y={handle.dy === -1 ? -6 : handle.dy === 1 ? element.height + 2 : element.height / 2 - 4}
              width={8}
              height={8}
              fill="#3B82F6"
              stroke="white"
              strokeWidth={1}
              cursor={handle.cursor}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (element.locked) return;
                setIsResizing(true);
                setResizeHandle(handle);
                const startX = e.clientX;
                const startY = e.clientY;
                const startWidth = element.width;
                const startHeight = element.height;
                const startXPos = element.x;
                const startYPos = element.y;
                
                const handleMove = (moveEvent) => {
                  const dx = (moveEvent.clientX - startX) * (handle.dx !== 0 ? 1 : 0);
                  const dy = (moveEvent.clientY - startY) * (handle.dy !== 0 ? 1 : 0);
                  
                  let newX = element.x;
                  let newY = element.y;
                  let newWidth = element.width;
                  let newHeight = element.height;
                  
                  if (handle.dx === -1) { newX = element.x + dx; newWidth = element.width - dx; }
                  if (handle.dx === 1) { newWidth = element.width + dx; }
                  if (handle.dy === -1) { newY = element.y + dy; newHeight = element.height - dy; }
                  if (handle.dy === 1) { newHeight = element.height + dy; }
                  
                  newWidth = Math.max(20, Math.min(newWidth, 794 - newX));
                  newHeight = Math.max(20, Math.min(newHeight, 1123 - newY));
                  newX = Math.max(0, Math.min(newX, 794 - newWidth));
                  newY = Math.max(0, Math.min(newY, 1123 - newHeight));
                  
                  onUpdate(element.id, { x: newX, y: newY, width: newWidth, height: newHeight });
                };
                
                const handleUp = () => {
                  window.removeEventListener('mousemove', handleMove);
                  window.removeEventListener('mouseup', handleUp);
                  setIsResizing(false);
                };
                
                window.addEventListener('mousemove', handleMove);
                window.addEventListener('mouseup', handleUp);
              }}
            />
          ))}
          
          <circle
            cx={element.width / 2}
            cy={-20}
            r={6}
            fill="#3B82F6"
            stroke="white"
            strokeWidth={2}
            cursor="grab"
          />
        </g>
      )}
      
      {element.locked && (
        <g>
          <rect x={-12} y={-12} width={20} height={20} fill="#EF4444" rx={2} opacity="0.9" />
          <text x={-4} y={4} fontSize="12" fill="white" textAnchor="middle" fontWeight="bold">🔒</text>
        </g>
      )}
      
      {!element.visible && (
        <g>
          <rect x={-12} y={element.height + 2} width={20} height={20} fill="#9CA3AF" rx={2} opacity="0.9" />
          <text x={-2} y={element.height + 16} fontSize="12" fill="white" textAnchor="middle">👁️</text>
        </g>
      )}
      
      <text 
        x={-4} 
        y={-4} 
        fontSize="10" 
        fill="#6B7280" 
        fontFamily="monospace"
        pointerEvents="none"
      >
        {element.zIndex}
      </text>
      
      {showContextMenu && (
        <foreignObject x={0} y={0} width={160} height={220}>
          <div 
            style={{ 
              position: 'fixed', 
              left: contextMenuPos.x, 
              top: contextMenuPos.y,
              zIndex: 1000,
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              padding: '4px 0',
              minWidth: '160px',
            }}
          >
            <button 
              onClick={() => { onDuplicate(element.id); setShowContextMenu(false); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-4a2 2 0 00-2-2h-8a2 2 0 00-2 2v4a2 2 0 002 2z" /></svg>
              Duplicar
            </button>
            <button 
              onClick={() => { setShowContextMenu(false); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 8l5 5m0 0l3-3m-3 3h12M8 12v8m0 0l3 3m0 0l-3 3m-3-3h12" /></svg>
              Capas
            </button>
            {!element.locked ? (
              <button 
                onClick={() => { onUpdate(element.id, { locked: true }); setShowContextMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-4M12 15v2m0 0v2" /></svg>
                Bloquear
              </button>
            ) : (
              <button 
                onClick={() => { onUpdate(element.id, { locked: false }); setShowContextMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                Desbloquear
              </button>
            )}
            {element.visible ? (
              <button 
                onClick={() => { onUpdate(element.id, { visible: false }); setShowContextMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                Ocultar
              </button>
            ) : (
              <button 
                onClick={() => { onUpdate(element.id, { visible: true }); setShowContextMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Mostrar
              </button>
            )}
            <hr style={{ margin: '4px 0', borderColor: '#E5E7EB' }} />
            <button 
              onClick={() => onDelete(element.id)}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Eliminar
            </button>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export default CanvasElement;