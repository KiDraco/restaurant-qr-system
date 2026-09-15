/* eslint-disable */
import React, { useMemo, useState } from 'react';
import { DEFAULT_ELEMENT_CONFIG, PAGE_DIMENSIONS } from '../../../hooks/useCanvas';

const FONT_FAMILIES = [
  'system-ui',
  'Georgia',
  'Roboto',
  'Montserrat',
  'Playfair Display',
  'Lora',
];

const FONT_WEIGHTS = ['normal', 'medium', 'semibold', 'bold'];
const TEXT_ALIGNMENTS = ['left', 'center', 'right', 'justify'];
const OBJECT_FITS = ['cover', 'contain', 'fill', 'none'];
const LINE_STYLES = ['solid', 'dashed', 'dotted', 'double'];
const DECORATIVE_KINDS = ['divider-icon', 'flourish', 'corner-accent', 'custom-svg'];
const BACKGROUND_TYPES = ['color', 'gradient', 'image'];
const PAGE_FORMATS = Object.keys(PAGE_DIMENSIONS);

const OBJECT_FIT_LABELS = {
  cover: 'Cubrir',
  contain: 'Contener',
  fill: 'Estirar',
  none: 'Original',
};

const LINE_STYLE_LABELS = {
  solid: 'Sólida',
  dashed: 'Discontinua',
  dotted: 'Punteada',
  double: 'Doble',
};

const DECORATIVE_KIND_LABELS = {
  'divider-icon': 'Icono divisor',
  flourish: 'Floritura',
  'corner-accent': 'Esquina decorativa',
  'custom-svg': 'SVG personalizado',
};

const BACKGROUND_TYPE_LABELS = {
  color: 'Color sólido',
  gradient: 'Degradado',
  image: 'Imagen',
};

function TextInput({ label, value, onChange, placeholder, error }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border rounded-lg ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'} focus:ring-2 focus:ring-opacity-20 outline-none transition-colors`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max, step, unit = 'px', error }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const val = e.target.value === '' ? '' : Number(e.target.value);
            if (val === '' || (val >= (min ?? -Infinity) && val <= (max ?? Infinity))) {
              onChange(val);
            }
          }}
          min={min}
          max={max}
          step={step}
          className="w-full px-3 py-2 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-200 rounded-lg pr-16 focus:ring-2 focus:ring-opacity-20 outline-none transition-colors"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">{unit}</span>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function ColorInput({ label, value, onChange, showOpacity = true }) {
  const [hex, setHex] = React.useState(value?.hex || '#000000');
  const [opacity, setOpacity] = React.useState(value?.opacity ?? 1);

  React.useEffect(() => {
    if (value && typeof value === 'object') {
      setHex(value.hex || '#000000');
      setOpacity(value.opacity ?? 1);
    } else if (typeof value === 'string') {
      setHex(value);
      setOpacity(1);
    }
  }, [value]);

  const handleHexChange = (e) => {
    const newHex = e.target.value;
    setHex(newHex);
    onChange({ hex: newHex, opacity });
  };

  const handleOpacityChange = (e) => {
    const newOpacity = parseFloat(e.target.value);
    if (!isNaN(newOpacity)) {
      setOpacity(newOpacity);
      onChange({ hex, opacity: newOpacity });
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => handleHexChange(e)}
          className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
        />
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={hex}
            onChange={(e) => handleHexChange({ target: { value: e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value } })}
            className="flex-1 px-3 py-2 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-200 rounded-lg focus:ring-2 focus:ring-opacity-20 outline-none transition-colors font-mono text-sm"
            placeholder="#RRGGBB"
          />
          {showOpacity && (
            <React.Fragment>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) => handleOpacityChange(e)}
                className="w-24 h-2 accent-blue-600"
              />
              <span className="text-xs text-gray-500 w-8 text-right">{Math.round(opacity * 100)}%</span>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}

function SelectInput({ label, value, onChange, options, optionLabel, error }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-200 rounded-lg focus:ring-2 focus:ring-opacity-20 outline-none transition-colors"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{optionLabel(opt)}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function ToggleInput({ label, value, onChange, description }) {
  return (
    <div className="mb-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        />
        <div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </label>
    </div>
  );
}

function FileInput({ label, value, onChange, accept, preview }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => onChange(e.target.result);
            reader.readAsDataURL(file);
          }
        }}
        className="mb-2 w-full px-3 py-2 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-200 rounded-lg focus:ring-2 focus:ring-opacity-20 outline-none transition-colors"
      />
      {value && preview && (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <h4 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
      <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
      {title}
    </h4>
  );
}

export function ElementPropertiesPanel({ 
  selectedId, 
  elements, 
  canvasConfig, 
  canvasSize,
  globalConfig,
  onUpdateElement, 
  onUpdateCanvasConfig,
  onUpdateGlobalConfig,
  activePageType
}) {
  const selectedElement = useMemo(
    () => elements.find(el => el.id === selectedId),
    [selectedId, elements]
  );

  const handleConfigChange = (key, value) => {
    if (!selectedElement) return;
    onUpdateElement(selectedId, { config: { ...selectedElement.config, [key]: value } });
  };

  const validateNumber = (value, min, max) => {
    if (value === '' || value === null) return null;
    const num = Number(value);
    if (isNaN(num)) return 'Debe ser un número';
    if (min !== undefined && num < min) return 'Mínimo ' + min;
    if (max !== undefined && num > max) return 'Máximo ' + max;
    return null;
  };

  // Canvas-level settings helpers (avoid spread in arrow functions for parser compatibility)
  function makeBgConfig(base, updates) {
    return { ...base, ...updates };
  }
  const handlePageFormatChange = function(v) { onUpdateCanvasConfig({ page_format: v }); };
  const handleBgTypeChange = function(v) { onUpdateCanvasConfig({ background_config: makeBgConfig(canvasConfig.background_config, { type: v }) }); };
  const handleColorBgChange = function(v) { onUpdateCanvasConfig({ background_config: makeBgConfig(canvasConfig.background_config, { type: 'color', value: v.hex }) }); };
  const handleGradientFromChange = function(v) { 
    var base = canvasConfig.background_config.value || {};
    onUpdateCanvasConfig({ background_config: makeBgConfig(canvasConfig.background_config, { type: 'gradient', value: makeBgConfig(base, { from: v.hex }) }) }); 
  };
  const handleGradientToChange = function(v) { 
    var base = canvasConfig.background_config.value || {};
    onUpdateCanvasConfig({ background_config: makeBgConfig(canvasConfig.background_config, { type: 'gradient', value: makeBgConfig(base, { to: v.hex }) }) }); 
  };
  const handleGridToggle = function(v) { onUpdateCanvasConfig({ grid: makeBgConfig(canvasConfig.grid, { enabled: v }) }); };
  const handleGridSizeChange = function(v) { onUpdateCanvasConfig({ grid: makeBgConfig(canvasConfig.grid, { size: v }) }); };
  const formatOptionLabel = function(f) { return f.replace('-', ' '); };

  if (!selectedId) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Global Theme Config */}
        <h3 className="font-semibold text-gray-800">Configuración Global del Theme</h3>
        
        <SectionTitle title="Colores del Theme" />
        <div className="grid grid-cols-2 gap-3 mb-4">
          <ColorInput
            label="Primario"
            value={{ hex: globalConfig.colors?.primary || '#FF6B6B', opacity: 1 }}
            onChange={(v) => onUpdateGlobalConfig({ colors: { ...globalConfig.colors, primary: v.hex } })}
          />
          <ColorInput
            label="Secundario"
            value={{ hex: globalConfig.colors?.secondary || '#4ECDC4', opacity: 1 }}
            onChange={(v) => onUpdateGlobalConfig({ colors: { ...globalConfig.colors, secondary: v.hex } })}
          />
          <ColorInput
            label="Fondo"
            value={{ hex: globalConfig.colors?.background || '#FFFFFF', opacity: 1 }}
            onChange={(v) => onUpdateGlobalConfig({ colors: { ...globalConfig.colors, background: v.hex } })}
          />
          <ColorInput
            label="Texto"
            value={{ hex: globalConfig.colors?.text || '#2A2A2A', opacity: 1 }}
            onChange={(v) => onUpdateGlobalConfig({ colors: { ...globalConfig.colors, text: v.hex } })}
          />
        </div>
        
        <SectionTitle title="Tipografía Global" />
        <div className="grid grid-cols-2 gap-3 mb-4">
          <SelectInput
            label="Fuente principal"
            value={globalConfig.font_family || 'system-ui'}
            options={FONT_FAMILIES}
            optionLabel={opt => opt}
            onChange={(v) => onUpdateGlobalConfig({ font_family: v })}
          />
        </div>
        
        <SectionTitle title="Fondo Global" />
        <SelectInput
          label="Tipo de fondo"
          value={globalConfig.background_config?.type || 'color'}
          options={BACKGROUND_TYPES}
          optionLabel={opt => BACKGROUND_TYPE_LABELS[opt]}
          onChange={(v) => onUpdateGlobalConfig({ background_config: { ...globalConfig.background_config, type: v } })}
        />
        
        {globalConfig.background_config?.type === 'color' && (
          <ColorInput
            label="Color de fondo"
            value={globalConfig.background_config?.value || '#FFFFFF'}
            onChange={(v) => onUpdateGlobalConfig({ background_config: { ...globalConfig.background_config, type: 'color', value: v.hex } })}
          />
        )}
        
        {globalConfig.background_config?.type === 'gradient' && (
          <React.Fragment>
            <ColorInput
              label="Color inicial"
              value={globalConfig.background_config?.value?.from || '#FF6B6B'}
              onChange={(v) => onUpdateGlobalConfig({ background_config: { ...globalConfig.background_config, type: 'gradient', value: { ...globalConfig.background_config.value, from: v.hex } } })}
            />
            <ColorInput
              label="Color final"
              value={globalConfig.background_config?.value?.to || '#4ECDC4'}
              onChange={(v) => onUpdateGlobalConfig({ background_config: { ...globalConfig.background_config, type: 'gradient', value: { ...globalConfig.background_config.value, to: v.hex } } })}
            />
          </React.Fragment>
        )}
        
        {/* Page-specific Config */}
        <SectionTitle title={`Página: ${activePageType || 'General'} (${canvasConfig.page_format || 'mobile-portrait'})`} />
        <SelectInput
          label="Formato de página"
          value={canvasConfig.page_format || 'mobile-portrait'}
          options={Object.keys(PAGE_DIMENSIONS)}
          optionLabel={formatOptionLabel}
          onChange={(v) => onUpdateCanvasConfig({ page_format: v })}
        />
        
        <SelectInput
          label="Tipo de fondo"
          value={canvasConfig.background_config?.type || 'color'}
          options={BACKGROUND_TYPES}
          optionLabel={opt => BACKGROUND_TYPE_LABELS[opt]}
          onChange={(v) => onUpdateCanvasConfig({ background_config: { ...canvasConfig.background_config, type: v } })}
        />
        
        {canvasConfig.background_config?.type === 'color' && (
          <ColorInput
            label="Color de fondo"
            value={canvasConfig.background_config?.value || '#FFFFFF'}
            onChange={(v) => onUpdateCanvasConfig({ background_config: { ...canvasConfig.background_config, type: 'color', value: v.hex } })}
          />
        )}
        
        {canvasConfig.background_config?.type === 'gradient' && (
          <React.Fragment>
            <ColorInput
              label="Color inicial"
              value={canvasConfig.background_config?.value?.from || '#FF6B6B'}
              onChange={(v) => onUpdateCanvasConfig({ background_config: { ...canvasConfig.background_config, type: 'gradient', value: { ...canvasConfig.background_config.value, from: v.hex } } })}
            />
            <ColorInput
              label="Color final"
              value={canvasConfig.background_config?.value?.to || '#4ECDC4'}
              onChange={(v) => onUpdateCanvasConfig({ background_config: { ...canvasConfig.background_config, type: 'gradient', value: { ...canvasConfig.background_config.value, to: v.hex } } })}
            />
          </React.Fragment>
        )}
        
        <SectionTitle title="Cuadrícula" />
        <ToggleInput
          label="Mostrar cuadrícula"
          value={canvasConfig.grid?.enabled ?? true}
          onChange={handleGridToggle}
          description="Muestra una cuadrícula de 8px para alinear elementos"
        />
        <NumberInput
          label="Tamaño de cuadrícula"
          value={canvasConfig.grid?.size || 8}
          onChange={handleGridSizeChange}
          min={4}
          max={64}
          step={4}
          unit="px"
        />
      </div>
    );
  }

  const config = selectedElement.config || {};
  const type = selectedElement.type;

  const errors = {};
  if (type === 'image' && config.src && !config.src.startsWith('data:') && !config.src.startsWith('http')) {
    errors.src = 'La imagen debe ser una URL o base64';
  }
  if (['width', 'height', 'x', 'y', 'fontSize', 'borderRadius', 'opacity'].some(k => k in config)) {
    Object.entries(config).forEach(([k, v]) => {
      if (typeof v === 'number') {
        if (k === 'opacity' && (v < 0 || v > 1)) errors[k] = 'La opacidad debe estar entre 0 y 1';
        if (['width', 'height'].includes(k) && v < 10) errors[k] = 'Mínimo 10px';
        if (['x', 'y'].includes(k) && v < 0) errors[k] = 'No puede ser negativo';
      }
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Propiedades</h3>
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">{selectedElement.type}</span>
      </div>

      <SectionTitle title="Posición y tamaño" />
      <div className="grid grid-cols-2 gap-3 mb-4">
        <NumberInput
          label="X"
          value={selectedElement.x}
          onChange={(v) => onUpdateElement(selectedId, { x: v })}
          min={0}
          max={794 - selectedElement.width}
          error={errors.x}
        />
        <NumberInput
          label="Y"
          value={selectedElement.y}
          onChange={(v) => onUpdateElement(selectedId, { y: v })}
          min={0}
          max={1123 - selectedElement.height}
          error={errors.y}
        />
        <NumberInput
          label="Ancho"
          value={selectedElement.width}
          onChange={(v) => onUpdateElement(selectedId, { width: v })}
          min={20}
          max={794 - selectedElement.x}
          error={errors.width}
        />
        <NumberInput
          label="Alto"
          value={selectedElement.height}
          onChange={(v) => onUpdateElement(selectedId, { height: v })}
          min={20}
          max={1123 - selectedElement.y}
          error={errors.height}
        />
      </div>

      <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
        <span className="text-xs text-gray-500">Capa:</span>
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{selectedElement.zIndex}</span>
        <button onClick={() => onUpdateElement(selectedId, { zIndex: 0 })} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900" title="Al fondo">⬇</button>
        <button onClick={() => onUpdateElement(selectedId, { zIndex: -1 })} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900" title="Atrás">⬅</button>
        <button onClick={() => onUpdateElement(selectedId, { zIndex: 999 })} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900" title="Adelante">➡</button>
        <button onClick={() => onUpdateElement(selectedId, { zIndex: 9999 })} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900" title="Al frente">⬆</button>
      </div>

      <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedElement.locked}
            onChange={(e) => onUpdateElement(selectedId, { locked: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Bloqueado</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedElement.visible !== false}
            onChange={(e) => onUpdateElement(selectedId, { visible: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Visible</span>
        </label>
      </div>

      <SectionTitle title="Configuración del elemento" />
      
      {type === 'image' && (
        <>
          <FileInput
            label="Imagen"
            value={config.src}
            onChange={(v) => handleConfigChange('src', v)}
            accept="image/*"
            preview={true}
            error={errors.src}
          />
          <TextInput
            label="Texto alternativo"
            value={config.alt || ''}
            onChange={(v) => handleConfigChange('alt', v)}
            placeholder="Descripción para accesibilidad"
          />
          <NumberInput
            label="Radio de borde"
            value={config.borderRadius || 0}
            onChange={(v) => handleConfigChange('borderRadius', v)}
            min={0}
            max={100}
            error={errors.borderRadius}
          />
          <NumberInput
            label="Opacidad"
            value={config.opacity ?? 1}
            onChange={(v) => handleConfigChange('opacity', v)}
            min={0}
            max={1}
            step={0.01}
            unit=""
            error={errors.opacity}
          />
          <SelectInput
            label="Ajuste"
            value={config.objectFit || 'cover'}
            options={OBJECT_FITS}
            optionLabel={opt => OBJECT_FIT_LABELS[opt]}
            onChange={(v) => handleConfigChange('objectFit', v)}
          />
        </>
      )}

      {type === 'text' && (
        <>
          <TextInput
            label="Contenido"
            value={config.content || ''}
            onChange={(v) => handleConfigChange('content', v)}
            placeholder="Escribe tu texto..."
          />
          <SelectInput
            label="Fuente"
            value={config.fontFamily || 'system-ui'}
            options={FONT_FAMILIES}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontFamily', v)}
          />
          <NumberInput
            label="Tamaño"
            value={config.fontSize || 16}
            onChange={(v) => handleConfigChange('fontSize', v)}
            min={8}
            max={200}
            error={errors.fontSize}
          />
          <SelectInput
            label="Peso"
            value={config.fontWeight || 'normal'}
            options={FONT_WEIGHTS}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontWeight', v)}
          />
          <ColorInput
            label="Color"
            value={{ hex: config.color || '#2A2A2A', opacity: 1 }}
            onChange={(v) => handleConfigChange('color', v.hex)}
          />
          <SelectInput
            label="Alineación"
            value={config.textAlign || 'left'}
            options={TEXT_ALIGNMENTS}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('textAlign', v)}
          />
          <NumberInput
            label="Interlineado"
            value={config.lineHeight || 1.5}
            onChange={(v) => handleConfigChange('lineHeight', v)}
            min={0.5}
            max={3}
            step={0.1}
            unit=""
          />
        </>
      )}

      {type === 'category' && (
        <>
          <TextInput
            label="Título"
            value={config.title || ''}
            onChange={(v) => handleConfigChange('title', v)}
          />
          <SelectInput
            label="Fuente"
            value={config.fontFamily || 'system-ui'}
            options={FONT_FAMILIES}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontFamily', v)}
          />
          <NumberInput
            label="Tamaño"
            value={config.fontSize || 20}
            onChange={(v) => handleConfigChange('fontSize', v)}
            min={10}
            max={100}
          />
          <SelectInput
            label="Peso"
            value={config.fontWeight || 'bold'}
            options={FONT_WEIGHTS}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontWeight', v)}
          />
          <ColorInput
            label="Color"
            value={{ hex: config.color || '#2A2A2A', opacity: 1 }}
            onChange={(v) => handleConfigChange('color', v.hex)}
          />
          <ToggleInput
            label="Mostrar separador"
            value={config.separator !== false}
            onChange={(v) => handleConfigChange('separator', v)}
          />
          {config.separator !== false && (
            <>
              <ColorInput
                label="Color separador"
                value={{ hex: config.separatorColor || '#FF6B6B', opacity: 1 }}
                onChange={(v) => handleConfigChange('separatorColor', v.hex)}
              />
              <NumberInput
                label="Grosor"
                value={config.separatorWidth || 2}
                onChange={(v) => handleConfigChange('separatorWidth', v)}
                min={1}
                max={10}
              />
              <SelectInput
                label="Estilo"
                value={config.separatorStyle || 'solid'}
                options={LINE_STYLES}
                optionLabel={opt => LINE_STYLE_LABELS[opt]}
                onChange={(v) => handleConfigChange('separatorStyle', v)}
              />
            </>
          )}
        </>
      )}

      {type === 'product' && (
        <>
          <TextInput
            label="Nombre"
            value={config.name || ''}
            onChange={(v) => handleConfigChange('name', v)}
          />
          <TextInput
            label="Descripción"
            value={config.description || ''}
            onChange={(v) => handleConfigChange('description', v)}
            placeholder="Opcional"
          />
          <TextInput
            label="Precio"
            value={config.price || '$0.00'}
            onChange={(v) => handleConfigChange('price', v)}
            placeholder="$0.00"
          />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <SelectInput
              label="Layout"
              value={config.layout || 'horizontal'}
              options={['horizontal', 'vertical']}
              optionLabel={(l) => l === 'horizontal' ? 'Horizontal' : 'Vertical'}
              onChange={(v) => handleConfigChange('layout', v)}
            />
            <NumberInput
              label="Espaciado"
              value={config.spacing || 16}
              onChange={(v) => handleConfigChange('spacing', v)}
              min={0}
              max={50}
            />
          </div>
          <ToggleInput
            label="Mostrar precio"
            value={config.showPrice !== false}
            onChange={(v) => handleConfigChange('showPrice', v)}
          />
        </>
      )}

      {type === 'separator' && (
        <>
          <ColorInput
            label="Color"
            value={{ hex: config.color || '#FF6B6B', opacity: 1 }}
            onChange={(v) => handleConfigChange('color', v.hex)}
          />
          <NumberInput
            label="Grosor"
            value={config.width || 2}
            onChange={(v) => handleConfigChange('width', v)}
            min={1}
            max={10}
          />
          <SelectInput
            label="Estilo"
            value={config.style || 'solid'}
            options={LINE_STYLES}
            optionLabel={opt => LINE_STYLE_LABELS[opt]}
            onChange={(v) => handleConfigChange('style', v)}
          />
          <NumberInput
            label="Longitud (%)"
            value={parseFloat(config.length) || 100}
            onChange={(v) => handleConfigChange('length', v + '%')}
            min={10}
            max={100}
            unit="%"
          />
        </>
      )}

      {type === 'decorative' && (
        <>
          <SelectInput
            label="Tipo"
            value={config.kind || 'divider-icon'}
            options={DECORATIVE_KINDS}
            optionLabel={opt => DECORATIVE_KIND_LABELS[opt]}
            onChange={(v) => handleConfigChange('kind', v)}
          />
          {(config.kind === 'custom-svg') && (
            <FileInput
              label="SVG personalizado"
              value={config.src}
              onChange={(v) => handleConfigChange('src', v)}
              accept="image/svg+xml"
              preview={true}
            />
          )}
          <ColorInput
            label="Color"
            value={{ hex: config.color || '#FF6B6B', opacity: 1 }}
            onChange={(v) => handleConfigChange('color', v.hex)}
          />
          <NumberInput
            label="Ancho"
            value={config.width || 48}
            onChange={(v) => handleConfigChange('width', v)}
            min={16}
            max={200}
          />
          <NumberInput
            label="Alto"
            value={config.height || 48}
            onChange={(v) => handleConfigChange('height', v)}
            min={16}
            max={200}
          />
          <NumberInput
            label="Rotación"
            value={config.rotation || 0}
            onChange={(v) => handleConfigChange('rotation', v)}
            min={0}
            max={360}
            step={1}
            unit="°"
          />
        </>
      )}

      {type === 'logo' && (
        <>
          <FileInput
            label="Logo"
            value={config.src}
            onChange={(v) => handleConfigChange('src', v)}
            accept="image/*"
            preview={true}
          />
          <TextInput
            label="Texto alternativo"
            value={config.alt || ''}
            onChange={(v) => handleConfigChange('alt', v)}
            placeholder="Nombre del restaurante"
          />
          <NumberInput
            label="Radio de borde"
            value={config.borderRadius || 0}
            onChange={(v) => handleConfigChange('borderRadius', v)}
            min={0}
            max={100}
          />
          <NumberInput
            label="Opacidad"
            value={config.opacity ?? 1}
            onChange={(v) => handleConfigChange('opacity', v)}
            min={0}
            max={1}
            step={0.01}
            unit=""
          />
          <TextInput
            label="URL de enlace (opcional)"
            value={config.linkUrl || ''}
            onChange={(v) => handleConfigChange('linkUrl', v)}
            placeholder="https://..."
          />
        </>
      )}

      {/* Dynamic Elements */}
      {type === 'menu-list' && (
        <>
          <SelectInput
            label="Layout"
            value={config.layout || 'list'}
            options={['list', 'grid', 'carousel']}
            optionLabel={(l) => l === 'list' ? 'Lista' : l === 'grid' ? 'Cuadrícula' : 'Carrusel'}
            onChange={(v) => handleConfigChange('layout', v)}
          />
          <ToggleInput
            label="Mostrar título de categoría"
            value={config.showCategoryTitle !== false}
            onChange={(v) => handleConfigChange('showCategoryTitle', v)}
          />
          <ToggleInput
            label="Mostrar imagen del producto"
            value={config.showProductImage !== false}
            onChange={(v) => handleConfigChange('showProductImage', v)}
          />
          <ToggleInput
            label="Mostrar descripción"
            value={config.showProductDescription !== false}
            onChange={(v) => handleConfigChange('showProductDescription', v)}
          />
          <ToggleInput
            label="Mostrar precio"
            value={config.showPrice !== false}
            onChange={(v) => handleConfigChange('showPrice', v)}
          />
          <NumberInput
            label="Alto de imagen"
            value={config.productImageHeight || 120}
            onChange={(v) => handleConfigChange('productImageHeight', v)}
            min={60}
            max={300}
          />
          <NumberInput
            label="Radio de imagen"
            value={config.productImageRadius || 8}
            onChange={(v) => handleConfigChange('productImageRadius', v)}
            min={0}
            max={50}
          />
          <NumberInput
            label="Espaciado entre items"
            value={config.itemSpacing || 16}
            onChange={(v) => handleConfigChange('itemSpacing', v)}
            min={0}
            max={50}
          />
        </>
      )}

      {type === 'category-tabs' && (
        <>
          <SelectInput
            label="Fuente"
            value={config.fontFamily || 'system-ui'}
            options={FONT_FAMILIES}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontFamily', v)}
          />
          <NumberInput
            label="Tamaño"
            value={config.fontSize || 14}
            onChange={(v) => handleConfigChange('fontSize', v)}
            min={10}
            max={24}
          />
          <SelectInput
            label="Peso"
            value={config.fontWeight || 'medium'}
            options={FONT_WEIGHTS}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontWeight', v)}
          />
          <ColorInput
            label="Color activo"
            value={{ hex: config.activeColor || '#FFFFFF', opacity: 1 }}
            onChange={(v) => handleConfigChange('activeColor', v.hex)}
          />
          <ColorInput
            label="Color inactivo"
            value={{ hex: config.inactiveColor || '#666666', opacity: 1 }}
            onChange={(v) => handleConfigChange('inactiveColor', v.hex)}
          />
          <ColorInput
            label="Fondo"
            value={{ hex: config.backgroundColor || '#FFFFFF', opacity: 1 }}
            onChange={(v) => handleConfigChange('backgroundColor', v.hex)}
          />
          <ColorInput
            label="Fondo activo"
            value={{ hex: config.activeBackgroundColor || '#FF6B6B', opacity: 1 }}
            onChange={(v) => handleConfigChange('activeBackgroundColor', v.hex)}
          />
          <NumberInput
            label="Radio de borde"
            value={config.borderRadius || 8}
            onChange={(v) => handleConfigChange('borderRadius', v)}
            min={0}
            max={50}
          />
          <NumberInput
            label="Espaciado"
            value={config.spacing || 8}
            onChange={(v) => handleConfigChange('spacing', v)}
            min={0}
            max={30}
          />
        </>
      )}

      {type === 'bill-items' && (
        <>
          <ToggleInput
            label="Mostrar cantidad"
            value={config.showQuantity !== false}
            onChange={(v) => handleConfigChange('showQuantity', v)}
          />
          <ToggleInput
            label="Mostrar precio unitario"
            value={config.showUnitPrice !== false}
            onChange={(v) => handleConfigChange('showUnitPrice', v)}
          />
          <ToggleInput
            label="Mostrar subtotal"
            value={config.showSubtotal !== false}
            onChange={(v) => handleConfigChange('showSubtotal', v)}
          />
          <ColorInput
            label="Color nombre"
            value={{ hex: config.itemNameColor || '#2A2A2A', opacity: 1 }}
            onChange={(v) => handleConfigChange('itemNameColor', v.hex)}
          />
          <ColorInput
            label="Color detalle"
            value={{ hex: config.detailColor || '#666666', opacity: 1 }}
            onChange={(v) => handleConfigChange('detailColor', v.hex)}
          />
          <ColorInput
            label="Color precio"
            value={{ hex: config.priceColor || '#FF6B6B', opacity: 1 }}
            onChange={(v) => handleConfigChange('priceColor', v.hex)}
          />
          <ColorInput
            label="Color separador"
            value={{ hex: config.separatorColor || '#E5E5E5', opacity: 1 }}
            onChange={(v) => handleConfigChange('separatorColor', v.hex)}
          />
        </>
      )}

      {type === 'table-number' && (
        <>
          <TextInput
            label="Prefijo"
            value={config.prefix || 'Mesa '}
            onChange={(v) => handleConfigChange('prefix', v)}
            placeholder="Mesa "
          />
          <SelectInput
            label="Fuente"
            value={config.fontFamily || 'system-ui'}
            options={FONT_FAMILIES}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontFamily', v)}
          />
          <NumberInput
            label="Tamaño"
            value={config.fontSize || 32}
            onChange={(v) => handleConfigChange('fontSize', v)}
            min={16}
            max={80}
          />
          <SelectInput
            label="Peso"
            value={config.fontWeight || 'bold'}
            options={FONT_WEIGHTS}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontWeight', v)}
          />
          <ColorInput
            label="Color"
            value={{ hex: config.color || '#2A2A2A', opacity: 1 }}
            onChange={(v) => handleConfigChange('color', v.hex)}
          />
          <SelectInput
            label="Alineación"
            value={config.textAlign || 'center'}
            options={TEXT_ALIGNMENTS}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('textAlign', v)}
          />
        </>
      )}

      {type === 'total-amount' && (
        <>
          <TextInput
            label="Prefijo"
            value={config.prefix || 'Total: '}
            onChange={(v) => handleConfigChange('prefix', v)}
            placeholder="Total: "
          />
          <SelectInput
            label="Fuente"
            value={config.fontFamily || 'system-ui'}
            options={FONT_FAMILIES}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontFamily', v)}
          />
          <NumberInput
            label="Tamaño"
            value={config.fontSize || 28}
            onChange={(v) => handleConfigChange('fontSize', v)}
            min={16}
            max={80}
          />
          <SelectInput
            label="Peso"
            value={config.fontWeight || 'bold'}
            options={FONT_WEIGHTS}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontWeight', v)}
          />
          <ColorInput
            label="Color"
            value={{ hex: config.color || '#FF6B6B', opacity: 1 }}
            onChange={(v) => handleConfigChange('color', v.hex)}
          />
          <SelectInput
            label="Alineación"
            value={config.textAlign || 'center'}
            options={TEXT_ALIGNMENTS}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('textAlign', v)}
          />
          <ToggleInput
            label="Mostrar símbolo moneda"
            value={config.showCurrency !== false}
            onChange={(v) => handleConfigChange('showCurrency', v)}
          />
        </>
      )}

      {type === 'action-button' && (
        <>
          <SelectInput
            label="Acción"
            value={config.action || 'viewMenu'}
            options={['viewMenu', 'callWaiter', 'requestBill', 'viewBill', 'scanAnother']}
            optionLabel={(a) => ({
              viewMenu: 'Ver Menú',
              callWaiter: 'Llamar Mesero',
              requestBill: 'Pedir Cuenta',
              viewBill: 'Ver Cuenta',
              scanAnother: 'Escanear otra mesa'
            })[a]}
            onChange={(v) => handleConfigChange('action', v)}
          />
          <TextInput
            label="Etiqueta"
            value={config.label || 'Ver Menú'}
            onChange={(v) => handleConfigChange('label', v)}
            placeholder="Ver Menú"
          />
          <SelectInput
            label="Icono"
            value={config.icon || 'utensils'}
            options={['utensils', 'bell', 'receipt', 'dollar-sign', 'qrcode', 'chevron-left']}
            optionLabel={(i) => i}
            onChange={(v) => handleConfigChange('icon', v)}
          />
          <SelectInput
            label="Variante"
            value={config.variant || 'primary'}
            options={['primary', 'secondary', 'outline', 'ghost']}
            optionLabel={(v) => v}
            onChange={(v) => handleConfigChange('variant', v)}
          />
          <SelectInput
            label="Tamaño"
            value={config.size || 'lg'}
            options={['sm', 'md', 'lg', 'xl']}
            optionLabel={(s) => s}
            onChange={(v) => handleConfigChange('size', v)}
          />
          <ToggleInput
            label="Ancho completo"
            value={config.fullWidth !== false}
            onChange={(v) => handleConfigChange('fullWidth', v)}
          />
          <SelectInput
            label="Fuente"
            value={config.fontFamily || 'system-ui'}
            options={FONT_FAMILIES}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontFamily', v)}
          />
          <NumberInput
            label="Tamaño fuente"
            value={config.fontSize || 16}
            onChange={(v) => handleConfigChange('fontSize', v)}
            min={12}
            max={24}
          />
          <SelectInput
            label="Peso"
            value={config.fontWeight || 'semibold'}
            options={FONT_WEIGHTS}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontWeight', v)}
          />
          <NumberInput
            label="Radio de borde"
            value={config.borderRadius || 12}
            onChange={(v) => handleConfigChange('borderRadius', v)}
            min={0}
            max={50}
          />
        </>
      )}

      {type === 'search-bar' && (
        <>
          <TextInput
            label="Placeholder"
            value={config.placeholder || 'Buscar platos...'}
            onChange={(v) => handleConfigChange('placeholder', v)}
            placeholder="Buscar platos..."
          />
          <SelectInput
            label="Fuente"
            value={config.fontFamily || 'system-ui'}
            options={FONT_FAMILIES}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontFamily', v)}
          />
          <NumberInput
            label="Tamaño"
            value={config.fontSize || 16}
            onChange={(v) => handleConfigChange('fontSize', v)}
            min={12}
            max={24}
          />
          <SelectInput
            label="Peso"
            value={config.fontWeight || 'normal'}
            options={FONT_WEIGHTS}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontWeight', v)}
          />
          <ColorInput
            label="Color texto"
            value={{ hex: config.color || '#2A2A2A', opacity: 1 }}
            onChange={(v) => handleConfigChange('color', v.hex)}
          />
          <ColorInput
            label="Color fondo"
            value={{ hex: config.backgroundColor || '#FFFFFF', opacity: 1 }}
            onChange={(v) => handleConfigChange('backgroundColor', v.hex)}
          />
          <ColorInput
            label="Color borde"
            value={{ hex: config.borderColor || '#E5E5E5', opacity: 1 }}
            onChange={(v) => handleConfigChange('borderColor', v.hex)}
          />
          <NumberInput
            label="Radio de borde"
            value={config.borderRadius || 12}
            onChange={(v) => handleConfigChange('borderRadius', v)}
            min={0}
            max={50}
          />
          <ToggleInput
            label="Mostrar icono"
            value={config.showIcon !== false}
            onChange={(v) => handleConfigChange('showIcon', v)}
          />
        </>
      )}

      {type === 'cart-summary' && (
        <>
          <ToggleInput
            label="Mostrar contador"
            value={config.showItemCount !== false}
            onChange={(v) => handleConfigChange('showItemCount', v)}
          />
          <ToggleInput
            label="Mostrar total"
            value={config.showTotal !== false}
            onChange={(v) => handleConfigChange('showTotal', v)}
          />
          <SelectInput
            label="Fuente"
            value={config.fontFamily || 'system-ui'}
            options={FONT_FAMILIES}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontFamily', v)}
          />
          <NumberInput
            label="Tamaño"
            value={config.fontSize || 14}
            onChange={(v) => handleConfigChange('fontSize', v)}
            min={10}
            max={20}
          />
          <SelectInput
            label="Peso"
            value={config.fontWeight || 'medium'}
            options={FONT_WEIGHTS}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontWeight', v)}
          />
          <ColorInput
            label="Color texto"
            value={{ hex: config.color || '#2A2A2A', opacity: 1 }}
            onChange={(v) => handleConfigChange('color', v.hex)}
          />
          <ColorInput
            label="Color fondo"
            value={{ hex: config.backgroundColor || '#FEF9E7', opacity: 1 }}
            onChange={(v) => handleConfigChange('backgroundColor', v.hex)}
          />
          <ColorInput
            label="Color borde"
            value={{ hex: config.borderColor || '#F5E6A0', opacity: 1 }}
            onChange={(v) => handleConfigChange('borderColor', v.hex)}
          />
          <NumberInput
            label="Radio de borde"
            value={config.borderRadius || 8}
            onChange={(v) => handleConfigChange('borderRadius', v)}
            min={0}
            max={30}
          />
        </>
      )}

      {type === 'promo-banner' && (
        <>
          <ToggleInput
            label="Mostrar título"
            value={config.showTitle !== false}
            onChange={(v) => handleConfigChange('showTitle', v)}
          />
          <TextInput
            label="Título"
            value={config.title || 'Promociones'}
            onChange={(v) => handleConfigChange('title', v)}
            placeholder="Promociones"
          />
          <SelectInput
            label="Fuente"
            value={config.fontFamily || 'system-ui'}
            options={FONT_FAMILIES}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontFamily', v)}
          />
          <NumberInput
            label="Tamaño"
            value={config.fontSize || 18}
            onChange={(v) => handleConfigChange('fontSize', v)}
            min={12}
            max={30}
          />
          <SelectInput
            label="Peso"
            value={config.fontWeight || 'bold'}
            options={FONT_WEIGHTS}
            optionLabel={opt => opt}
            onChange={(v) => handleConfigChange('fontWeight', v)}
          />
          <ColorInput
            label="Color texto"
            value={{ hex: config.color || '#FFFFFF', opacity: 1 }}
            onChange={(v) => handleConfigChange('color', v.hex)}
          />
          <ColorInput
            label="Color fondo"
            value={{ hex: config.backgroundColor || '#FF6B6B', opacity: 1 }}
            onChange={(v) => handleConfigChange('backgroundColor', v.hex)}
          />
          <NumberInput
            label="Radio de borde"
            value={config.borderRadius || 12}
            onChange={(v) => handleConfigChange('borderRadius', v)}
            min={0}
            max={50}
          />
        </>
      )}
    </div>
  );
}

export default ElementPropertiesPanel;