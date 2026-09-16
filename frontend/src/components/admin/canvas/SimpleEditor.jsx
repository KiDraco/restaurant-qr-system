/* eslint-disable */
import React, { useState, useMemo, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { DynamicPageRenderer } from '../../client/DynamicPageRenderer';
import { CURATED_PALETTES } from '../../../utils/palettes';
import { TextInput, ColorInput, FileInput, SectionTitle } from './ElementPropertiesPanel';

// Element types fed by live data: shown as read-only rows, never edited here.
const AUTOMATIC_TYPES = [
  'menu-list',
  'bill-items',
  'table-number',
  'total-amount',
  'category-tabs',
  'search-bar',
  'cart-summary',
  'cart-panel',
  'promo-banner',
];

const TYPE_LABELS = {
  text: 'Texto',
  image: 'Imagen',
  logo: 'Logo',
  category: 'Categoría',
  product: 'Producto',
  separator: 'Separador',
  decorative: 'Decoración',
  'action-button': 'Botón',
  'table-input': 'Campo de mesa',
  'menu-list': 'Lista del menú',
  'bill-items': 'Detalle de cuenta',
  'table-number': 'Número de mesa',
  'total-amount': 'Total',
  'category-tabs': 'Pestañas de categoría',
  'search-bar': 'Buscador',
  'cart-summary': 'Resumen del pedido',
  'cart-panel': 'Panel del pedido',
  'promo-banner': 'Promociones',
};

function typeLabel(type) {
  return TYPE_LABELS[type] || type;
}

// Minimal per-type editors. Only content fields are touched, so switching
// between Simple and Professional modes never loses geometry or styling.
function SimpleElementBody({ element, onUpdateElement }) {
  const config = element.config || {};
  const set = (patch) => onUpdateElement(element.id, { config: { ...config, ...patch } });

  switch (element.type) {
    case 'text':
      return (
        <TextInput
          label="Texto"
          value={config.content || ''}
          onChange={(v) => set({ content: v })}
          placeholder="Escribe tu texto..."
        />
      );
    case 'image':
      return (
        <FileInput
          label="Imagen"
          value={config.src}
          onChange={(v) => set({ src: v })}
          accept="image/*"
          preview={true}
        />
      );
    case 'logo':
      return (
        <FileInput
          label="Logo"
          value={config.src}
          onChange={(v) => set({ src: v })}
          accept="image/*"
          preview={true}
        />
      );
    case 'category':
      return (
        <TextInput
          label="Título"
          value={config.title || ''}
          onChange={(v) => set({ title: v })}
        />
      );
    case 'action-button':
      return (
        <TextInput
          label="Texto del botón"
          value={config.label || ''}
          onChange={(v) => set({ label: v })}
          placeholder="Ver Menú"
        />
      );
    case 'table-input':
      return (
        <React.Fragment>
          <TextInput
            label="Texto de ayuda"
            value={config.placeholder || ''}
            onChange={(v) => set({ placeholder: v })}
            placeholder="N° de mesa"
          />
          <TextInput
            label="Texto del botón"
            value={config.buttonLabel || ''}
            onChange={(v) => set({ buttonLabel: v })}
            placeholder="Entrar"
          />
        </React.Fragment>
      );
    default:
      return null;
  }
}

export function SimpleEditor({
  activePage,
  elements,
  globalConfig,
  onUpdateElement,
  onUpdateGlobalConfig,
  onUpdatePageConfig,
   activePageId,
   ...rest
}) {
   const colors = globalConfig?.colors || {};
  const pageBg = activePage?.config?.background_config || { type: 'color', value: '#FFFFFF' };
  const safeElements = Array.isArray(elements) ? elements : [];

  // Track which action-button is tapped in the preview so the "Botones"
  // color control applies buttonColor to that specific element, not the global color.
  const [selectedActionId, setSelectedActionId] = useState(null);

  // Palette apply: theme colors plus active-page background, nothing else changes.
  // Button instance colors stay per-element so each action can differ.
  const applyPalette = (palette) => {
    onUpdateGlobalConfig({ colors: { ...palette.colors } });
    onUpdatePageConfig({ background_config: { ...palette.pageBg } });
  };

  const activePalette = CURATED_PALETTES.find(
    (palette) => (colors.primary || '').toLowerCase() === palette.colors.primary.toLowerCase()
  );

  const updateColorPart = (key) => (v) => {
    onUpdateGlobalConfig({ colors: { ...colors, [key]: v.hex } });
  };

  // When the user picks a color in the "Botones" row, apply it as buttonColor
  // to the selected action-button instance (so each button can differ).
  const applyButtonColor = (v) => {
    if (selectedActionId) {
      onUpdateElement(selectedActionId, { config: { ...(safeElements.find((el) => el.id === selectedActionId)?.config || {}), buttonColor: v.hex } });
    } else {
      updateColorPart('primary')(v);
    }
  };

  const toggleVisible = (el) => {
    onUpdateElement(el.id, { visible: el.visible === false });
  };

  // Page background helpers (color + gradient only in Simple mode).
  const bgValue = pageBg.value;
  const bgObject = bgValue && typeof bgValue === 'object' ? bgValue : {};
  const bgColorString = typeof bgValue === 'string' ? bgValue : '#FFFFFF';

  const setPageBgType = (type) => {
    if (type === 'gradient') {
      onUpdatePageConfig({
        background_config: {
          type: 'gradient',
          value: { from: bgObject.from || '#FF6B6B', to: bgObject.to || '#4ECDC4' },
        },
      });
    } else {
      onUpdatePageConfig({ background_config: { type: 'color', value: bgColorString } });
    }
  };

  const setPageBgColor = (v) => {
    onUpdatePageConfig({ background_config: { type: 'color', value: v.hex } });
  };

  const setPageBgFrom = (v) => {
    onUpdatePageConfig({
      background_config: { type: 'gradient', value: { ...bgObject, from: v.hex } },
    });
  };

  const setPageBgTo = (v) => {
    onUpdatePageConfig({
      background_config: { type: 'gradient', value: { ...bgObject, to: v.hex } },
    });
  };

  // When the user taps an action-button in the preview, select that instance
  // so the "Botones" color control applies buttonColor to it (not global color).
  const handlePreviewAction = useCallback((type, payload) => {
    if (type === 'button') {
      const el = safeElements.find((e) => e.type === 'action-button' && e.config?.action === payload);
      if (el) setSelectedActionId((cur) => (cur === el.id ? null : el.id));
    }
  }, [safeElements]);

  // Phone-frame preview of the active page so action-buttons can be tapped
  // to select them for per-button color (instead of changing global color).
  const previewPage = useMemo(() => ({
    type: activePage?.type,
    elements: safeElements.filter((el) => el.visible !== false),
    config: activePage?.config || {},
  }), [activePage, safeElements]);

  return (
    <div className="space-y-6 p-4">
      <div>
        <SectionTitle title="Paleta de colores" />
        <div className="grid grid-cols-2 gap-2">
          {CURATED_PALETTES.map((palette) => {
            const isActive = activePalette && activePalette.id === palette.id;
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => applyPalette(palette)}
                title={'Aplicar paleta ' + palette.name}
                className={`rounded-xl border p-2 text-left transition ${isActive ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <span className="mb-1.5 flex overflow-hidden rounded-md">
                  {Object.values(palette.colors).map((swatch) => (
                    <span key={palette.id + swatch} className="h-8 flex-1" style={{ backgroundColor: swatch }} />
                  ))}
                </span>
                <span className="block text-xs font-medium text-gray-700">{palette.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <SectionTitle title="Retoque por parte" />
        <ColorInput
          label={selectedActionId ? 'Color del botón seleccionado' : 'Botones (global)'}
          value={{ hex: selectedActionId ? (safeElements.find((el) => el.id === selectedActionId)?.config?.buttonColor || colors.primary || '#FFFFFF') : (colors.primary || '#FF6B6B'), opacity: 1 }}
          onChange={applyButtonColor}
        />
        <ColorInput
          label="Secundario"
          value={{ hex: colors.secondary || '#4ECDC4', opacity: 1 }}
          onChange={updateColorPart('secondary')}
        />
        <ColorInput
          label="Fondo"
          value={{ hex: colors.background || '#FFFFFF', opacity: 1 }}
          onChange={updateColorPart('background')}
        />
        <ColorInput
          label="Texto"
          value={{ hex: colors.text || '#2A2A2A', opacity: 1 }}
          onChange={updateColorPart('text')}
        />
      </div>

      <div>
        <SectionTitle title="Fondo de página" />
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setPageBgType('color')}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${pageBg.type !== 'gradient' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            Color sólido
          </button>
          <button
            type="button"
            onClick={() => setPageBgType('gradient')}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${pageBg.type === 'gradient' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            Degradado
          </button>
        </div>
        {pageBg.type === 'gradient' ? (
          <React.Fragment>
            <ColorInput
              label="Color inicial"
              value={{ hex: bgObject.from || '#FF6B6B', opacity: 1 }}
              onChange={setPageBgFrom}
            />
            <ColorInput
              label="Color final"
              value={{ hex: bgObject.to || '#4ECDC4', opacity: 1 }}
              onChange={setPageBgTo}
            />
          </React.Fragment>
        ) : (
          <ColorInput
            label="Color de fondo"
            value={{ hex: bgColorString, opacity: 1 }}
            onChange={setPageBgColor}
          />
        )}
      </div>

      <div>
        <SectionTitle title="Contenido de la página" />
        {safeElements.length === 0 && (
          <p className="text-sm text-gray-500">Esta página aún no tiene contenido para editar.</p>
        )}
        <div className="space-y-3">
          {safeElements.map((el) => {
            const isAutomatic = AUTOMATIC_TYPES.includes(el.type);
            const hidden = el.visible === false;
            return (
              <div key={el.id} className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{typeLabel(el.type)}</span>
                  <button
                    type="button"
                    onClick={() => toggleVisible(el)}
                    title={hidden ? 'Mostrar sección' : 'Ocultar sección'}
                    className={`rounded-md p-1.5 transition ${hidden ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                  >
                    {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {isAutomatic ? (
                  <p className="text-xs text-gray-400">Contenido automático</p>
                ) : (
                  <div className={hidden ? 'pointer-events-none opacity-50' : ''}>
                    <div
                      onClick={() => {
                        if (el.type === 'action-button') setSelectedActionId((cur) => (cur === el.id ? null : el.id));
                      }}
                      className={el.type === 'action-button' ? 'cursor-pointer rounded border-2 p-2 transition' : ''}
                      style={el.type === 'action-button' ? { borderColor: selectedActionId === el.id ? '#3B82F6' : '#E5E7EB' } : {}}
                    >
                      <SimpleElementBody element={el} onUpdateElement={onUpdateElement} />
                      {el.type === 'action-button' && (
                        <p className="text-xs text-blue-600 mt-1">{selectedActionId === el.id ? 'Color aplicado a este botón' : 'Tocá para elegir color'}</p>
                      )}
                    </div>
                    {el.type !== 'text' && el.type !== 'image' && el.type !== 'logo' && el.type !== 'category' && el.type !== 'action-button' && el.type !== 'table-input' && (
                      <p className="text-xs text-gray-400">Se edita en modo Profesional</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Phone preview: action-buttons are tapable to select per-button color */}
      <div className="flex flex-col items-center">
        <SectionTitle title="Vista previa (tocá un botón para asignarle color)" />
        <div className="overflow-hidden rounded-2xl shadow-lg" style={{ width: 280, height: 500, background: '#f3f4f6' }}>
          <DynamicPageRenderer
            key={activePageId}
            page={previewPage}
            globalConfig={globalConfig}
            onAction={handlePreviewAction}
            cartOpen={false}
            onToggleCart={() => {}}
            activeCategory="all"
            searchQuery=""
            onCategoryChange={() => {}}
            onSearchChange={() => {}}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {selectedActionId
            ? 'Color aplicado al botón seleccionado'
            : 'Tocá un botón en la vista previa para asignarle color'}
        </p>
      </div>
    </div>
  );
}

export default SimpleEditor;
