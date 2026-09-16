import React from 'react';

const ELEMENT_CATEGORIES = [
  {
    label: 'Estáticos',
    types: [
      { type: 'image', label: 'Imagen', icon: '🖼️', description: 'Agregar imagen o foto' },
      { type: 'text', label: 'Texto', icon: '📝', description: 'Agregar texto libre' },
      { type: 'category', label: 'Categoría', icon: '📋', description: 'Título de sección con separador' },
      { type: 'product', label: 'Producto', icon: '🍽️', description: 'Plato con nombre, descripción y precio' },
      { type: 'separator', label: 'Separador', icon: '➖', description: 'Línea divisoria entre secciones' },
      { type: 'decorative', label: 'Decorativo', icon: '✨', description: 'Elemento decorativo o divisor' },
      { type: 'logo', label: 'Logo', icon: '🏷️', description: 'Logo o marca del restaurante' },
    ],
  },
  {
    label: 'Dinámicos (conectados a datos)',
    types: [
      { type: 'menu-list', label: 'Lista de Menú', icon: '📖', description: 'Lista de categorías y productos (desde API)' },
      { type: 'category-tabs', label: 'Tabs de Categoría', icon: '🔖', description: 'Pestañas horizontales para filtrar menú' },
      { type: 'bill-items', label: 'Items de Cuenta', icon: '🧾', description: 'Detalle de órdenes y consumo (desde API)' },
      { type: 'table-number', label: 'Número de Mesa', icon: '🔢', description: 'Muestra el número de mesa actual dinámicamente' },
      { type: 'total-amount', label: 'Total a Pagar', icon: '💰', description: 'Muestra el total de la cuenta dinámicamente' },
      { type: 'action-button', label: 'Botón de Acción', icon: '🔘', description: 'Botón: Ver Menú, Llamar Mesero, Pedir Cuenta, etc.' },
      { type: 'search-bar', label: 'Barra de Búsqueda', icon: '🔍', description: 'Búsqueda en tiempo real del menú' },
      { type: 'cart-summary', label: 'Resumen de Carrito', icon: '🛒', description: 'Muestra items y total del pedido actual' },
      { type: 'promo-banner', label: 'Banner Promociones', icon: '🏷️', description: 'Muestra promociones activas' },
      { type: 'table-input', label: 'Ingreso de Mesa', icon: '⌨️', description: 'Campo manual de número de mesa con botón Entrar' },
    ],
  },
];

export function ElementPalette({ onAddElement }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {ELEMENT_CATEGORIES.map(({ label, types }) => (
        <div key={label}>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">{label}</h4>
          {types.map(({ type, label, icon, description }) => (
            <button
              key={type}
              onClick={() => onAddElement(type)}
              className="w-full p-3 text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition-all duration-200 flex items-start gap-3 group"
              title={description}
            >
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{label}</p>
                <p className="text-xs text-gray-500 truncate">{description}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          ))}
        </div>
      ))}
      
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center mb-3">Arrastra elementos al canvas</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <p className="font-medium mb-1">Atajos de teclado:</p>
          <ul className="space-y-1 text-left pl-4">
            <li>⌫ Eliminar seleccionado</li>
            <li>Ctrl+D Duplicar</li>
            <li>⌨️ Mover con flechas</li>
            <li>Shift+⌨️ Mover rápido (10px)</li>
            <li>Click derecho → Menú contextual</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ElementPalette;