/* eslint-disable */
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { CURATED_PALETTES } from '../../../utils/palettes';
import { TextInput, ColorInput, FileInput, SectionTitle } from './ElementPropertiesPanel';

const AUTOMATIC_TYPES = [
  'menu-list', 'bill-items', 'table-number', 'total-amount',
  'category-tabs', 'search-bar', 'cart-summary', 'cart-panel', 'promo-banner',
];

const TYPE_LABELS = {
  text: 'Texto', image: 'Imagen', logo: 'Logo', category: 'Categoría',
  product: 'Producto', separator: 'Separador', decorative: 'Decoración',
  'action-button': 'Botón', 'table-input': 'Campo de mesa',
  'menu-list': 'Lista del menú', 'bill-items': 'Detalle de cuenta',
  'table-number': 'Número de mesa', 'total-amount': 'Total',
  'category-tabs': 'Pestañas de categoría', 'search-bar': 'Buscador',
  'cart-summary': 'Resumen del pedido', 'cart-panel': 'Panel del pedido',
  'promo-banner': 'Promociones',
};

function typeLabel(type) { return TYPE_LABELS[type] || type; }

function SimpleElementBody({ element, onUpdateElement }) {
  const config = element.config || {};
  const set = (patch) => onUpdateElement(element.id, { config: { ...config, ...patch } });

  switch (element.type) {
    case 'text':
      return <TextInput label="Texto" value={config.content || ''} onChange={(v) => set({ content: v })} placeholder="Escribe tu texto..." />;
    case 'image':
      return <FileInput label="Imagen" value={config.src} onChange={(v) => set({ src: v })} accept="image/*" preview />;
    case 'logo':
      return <FileInput label="Logo" value={config.src} onChange={(v) => set({ src: v })} accept="image/*" preview />;
    case 'category':
      return <TextInput label="Título" value={config.title || ''} onChange={(v) => set({ title: v })} />;
    case 'action-button':
      return <TextInput label="Texto del botón" value={config.label || ''} onChange={(v) => set({ label: v })} placeholder="Ver Menú" />;
    case 'table-input':
      return (
        <React.Fragment>
          <TextInput label="Texto de ayuda" value={config.placeholder || ''} onChange={(v) => set({ placeholder: v })} placeholder="N° de mesa" />
          <TextInput label="Texto del botón" value={config.buttonLabel || ''} onChange={(v) => set({ buttonLabel: v })} placeholder="Entrar" />
        </React.Fragment>
      );
    default:
      return null;
  }
}

export function SimpleEditor({
  activePage, elements, globalConfig,
  onUpdateElement, onUpdateGlobalConfig, onUpdatePageConfig,
}) {
  const colors = globalConfig?.colors || {};
  const pageBg = activePage?.config?.background_config || { type: 'color', value: '#FFFFFF' };
  const safeElements = Array.isArray(elements) ? elements : [];

  const applyPalette = (palette) => {
    onUpdateGlobalConfig({ colors: { ...palette.colors } });
    onUpdatePageConfig({ background_config: { ...palette.pageBg } });
  };

  const activePalette = CURATED_PALETTES.find(
    (p) => (colors.primary || '').toLowerCase() === p.colors.primary.toLowerCase()
  );

  const updateColorPart = (key) => (v) => {
    onUpdateGlobalConfig({ colors: { ...colors, [key]: v.hex } });
  };

  const toggleVisible = (el) => {
    onUpdateElement(el.id, { visible: el.visible === false });
  };

  const bgValue = pageBg.value;
  const bgObject = bgValue && typeof bgValue === 'object' ? bgValue : {};
  const bgColorString = typeof bgValue === 'string' ? bgValue : '#FFFFFF';

  const setPageBgType = (type) => {
    if (type === 'gradient') {
      onUpdatePageConfig({ background_config: { type: 'gradient', value: { from: bgObject.from || '#FF6B6B', to: bgObject.to || '#4ECDC4' } } });
    } else {
      onUpdatePageConfig({ background_config: { type: 'color', value: bgColorString } });
    }
  };

  const setPageBgColor = (v) => {
    onUpdatePageConfig({ background_config: { type: 'color', value: v.hex } });
  };

  const setPageBgFrom = (v) => {
    onUpdatePageConfig({ background_config: { type: 'gradient', value: { ...bgObject, from: v.hex } } });
  };

  const setPageBgTo = (v) => {
    onUpdatePageConfig({ background_config: { type: 'gradient', value: { ...bgObject, to: v.hex } } });
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <SectionTitle title="Paleta de colores" />
        <div className="grid grid-cols-2 gap-2">
          {CURATED_PALETTES.map((palette) => {
            const isActive = activePalette && activePalette.id === palette.id;
            return (
              <button
                key={palette.id} type="button" onClick={() => applyPalette(palette)}
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
        <ColorInput label="Botones" value={{ hex: colors.primary || '#FF6B6B', opacity: 1 }} onChange={updateColorPart('primary')} />
        <ColorInput label="Secundario" value={{ hex: colors.secondary || '#4ECDC4', opacity: 1 }} onChange={updateColorPart('secondary')} />
        <ColorInput label="Fondo" value={{ hex: colors.background || '#FFFFFF', opacity: 1 }} onChange={updateColorPart('background')} />
        <ColorInput label="Texto" value={{ hex: colors.text || '#2A2A2A', opacity: 1 }} onChange={updateColorPart('text')} />
      </div>

      <div>
        <SectionTitle title="Fondo de página" />
        <div className="mb-3 flex gap-2">
          <button type="button" onClick={() => setPageBgType('color')} className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${pageBg.type !== 'gradient' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            Color sólido
          </button>
          <button type="button" onClick={() => setPageBgType('gradient')} className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${pageBg.type === 'gradient' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            Degradado
          </button>
        </div>
        {pageBg.type === 'gradient' ? (
          <React.Fragment>
            <ColorInput label="Color inicial" value={{ hex: bgObject.from || '#FF6B6B', opacity: 1 }} onChange={setPageBgFrom} />
            <ColorInput label="Color final" value={{ hex: bgObject.to || '#4ECDC4', opacity: 1 }} onChange={setPageBgTo} />
          </React.Fragment>
        ) : (
          <ColorInput label="Color de fondo" value={{ hex: bgColorString, opacity: 1 }} onChange={setPageBgColor} />
        )}
      </div>

      <div>
        <SectionTitle title="Contenido de la página" />
        {safeElements.length === 0 && <p className="text-sm text-gray-500">Esta página aún no tiene contenido para editar.</p>}
        <div className="space-y-3">
          {safeElements.map((el) => {
            const isAutomatic = AUTOMATIC_TYPES.includes(el.type);
            const hidden = el.visible === false;
            return (
              <div key={el.id} className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{typeLabel(el.type)}</span>
                  <button type="button" onClick={() => toggleVisible(el)} title={hidden ? 'Mostrar sección' : 'Ocultar sección'} className={`rounded-md p-1.5 transition ${hidden ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                    {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {isAutomatic ? (
                  <p className="text-xs text-gray-400">Contenido automático</p>
                ) : (
                  <div className={hidden ? 'pointer-events-none opacity-50' : ''}>
                    <SimpleElementBody element={el} onUpdateElement={onUpdateElement} />
                    {el.type === 'action-button' && (
                      <ColorInput
                        label="Color de este botón"
                        value={{ hex: el.config?.buttonColor || '#FFFFFF', opacity: 1 }}
                        onChange={(v) => onUpdateElement(el.id, { config: { ...el.config, buttonColor: v.hex } })}
                      />
                    )}
                    {el.type === 'table-input' && (
                      <ColorInput
                        label="Color del botón Entrar"
                        value={{ hex: el.config?.buttonColor || '#FFFFFF', opacity: 1 }}
                        onChange={(v) => onUpdateElement(el.id, { config: { ...el.config, buttonColor: v.hex } })}
                      />
                    )}
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
    </div>
  );
}

export default SimpleEditor;