import { useMemo } from 'react';
import { Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown, Layers } from 'lucide-react';

const TYPE_LABELS = {
  text: 'Texto',
  image: 'Imagen',
  logo: 'Logo',
  category: 'Categoría',
  product: 'Producto',
  separator: 'Separador',
  decorative: 'Decorativo',
  'menu-list': 'Lista de Menú',
  'category-tabs': 'Tabs de Categoría',
  'bill-items': 'Items de Cuenta',
  'table-number': 'Número de Mesa',
  'total-amount': 'Total a Pagar',
  'action-button': 'Botón de Acción',
  'search-bar': 'Búsqueda',
  'cart-summary': 'Resumen Carrito',
  'cart-panel': 'Carrito',
  'promo-banner': 'Banner Promociones',
  'table-input': 'Ingreso de Mesa',
};

export function LayersPanel({ elements, selectedId, onSelectElement, onUpdateElement, onMoveElementLayer }) {
  const sorted = useMemo(
    () => [...elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)),
    [elements]
  );
  const maxZIndex = elements.reduce((max, el) => Math.max(max, el.zIndex || 0), Number.MIN_SAFE_INTEGER);
  const minZIndex = elements.reduce((min, el) => Math.min(min, el.zIndex || 0), Number.MAX_SAFE_INTEGER);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-gray-500" />
          Elementos de la página
        </h4>
        <span className="text-xs text-gray-500">({elements.length})</span>
      </div>

      {elements.length === 0 ? (
        <p className="px-3 py-3 text-xs text-gray-400">
          Sin elementos todavía. Agregá uno desde el panel de elementos.
        </p>
      ) : (
        <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100">
          {sorted.map((element) => {
            const isSelected = element.id === selectedId;
            const isHidden = element.visible === false;
            const isFront = element.zIndex >= maxZIndex;
            const isBack = element.zIndex <= minZIndex;
            const label = TYPE_LABELS[element.type] || element.type;

            return (
              <li key={element.id}>
                <div
                  className={`flex items-center gap-2 px-2.5 py-1.5 border-l-2 transition-colors ${
                    isSelected ? 'bg-blue-50 border-blue-600' : 'border-transparent hover:bg-gray-50'
                  } ${isHidden || element.locked ? 'opacity-50' : ''}`}
                >
                  <button
                    onClick={() => onSelectElement(element.id)}
                    className="flex-1 min-w-0 text-left py-0.5"
                    title={isHidden ? `${label} (oculto)` : label}
                  >
                    <span className="block text-xs font-medium text-gray-800 truncate">{label}</span>
                    <span className="block text-[11px] text-gray-400 truncate">
                      x:{element.x}, y:{element.y} · <span className="font-mono">z:{element.zIndex}</span>
                    </span>
                  </button>

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onMoveElementLayer(element.id, 'forward'); }}
                      disabled={isFront}
                      className="p-1 rounded hover:bg-blue-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Subir capa"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onMoveElementLayer(element.id, 'backward'); }}
                      disabled={isBack}
                      className="p-1 rounded hover:bg-blue-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Bajar capa"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onUpdateElement(element.id, { visible: !element.visible }); }}
                      className={`p-1 rounded hover:bg-blue-100 ${isHidden ? 'text-gray-400' : 'text-gray-600'}`}
                      title="Mostrar/Ocultar"
                    >
                      {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {element.locked ? (
                      <span className="p-1 text-gray-400" title="Bloqueado">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdateElement(element.id, { locked: true }); }}
                        className="p-1 rounded hover:bg-blue-100 text-gray-500"
                        title="Bloquear"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default LayersPanel;