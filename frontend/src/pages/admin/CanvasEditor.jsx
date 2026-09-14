import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Canvas } from '../../components/admin/canvas/Canvas';
import { ElementPalette } from '../../components/admin/canvas/ElementPalette';
import { ElementPropertiesPanel } from '../../components/admin/canvas/ElementPropertiesPanel';
import { useCanvas } from '../../hooks/useCanvas';
import api from '../../services/api';
import { isFeatureEnabled } from '../../utils/featureFlags';
import { Loader2, AlertTriangle, X, Save, Download, Upload, Copy, Trash2, RotateCw } from 'lucide-react';

export function CanvasEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);

  // Hooks must be called at the top level - before any early returns
  const sensors = useSensors(
    useSensor(KeyboardSensor, { coordinateGetter: closestCenter }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const {
    elements,
    selectedId,
    canvasConfig,
    selectElement,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    reorderElements,
    setCanvasConfig,
    resetCanvas,
  } = useCanvas();

  // Ref para evitar re-carga infinita del mismo theme
  const loadedIdRef = useRef(null);

  // Resetear ref si el id cambia (navegación entre themes)
  useEffect(() => {
    loadedIdRef.current = null;
  }, [id]);

  // Load theme on mount — deps estables, solo se re-ejecuta si cambia el id
  useEffect(() => {
    if (!id) return;
    if (loadedIdRef.current === id) return;
    loadedIdRef.current = id;
    resetCanvas();
    const loadTheme = async () => {
      setLoading(true);
      setError(null);
      try {
        const theme = await api.getTheme(id);
        if (theme.canvas_json) {
          const canvas = typeof theme.canvas_json === 'string' ? JSON.parse(theme.canvas_json) : theme.canvas_json;
          // Restore elements
          if (canvas.elements) {
            canvas.elements.forEach(el => {
              // Ensure each element has required fields
              if (!el.id) el.id = crypto.randomUUID();
              if (!el.zIndex) el.zIndex = 0;
            });
            // Sort by zIndex
            canvas.elements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
            // Add elements
            canvas.elements.forEach(el => {
              addElement(el.type, {
                ...el.config,
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height,
                zIndex: el.zIndex,
                locked: el.locked,
                visible: el.visible,
              }, el.id);
            });
          }
          // Set canvas config
          if (canvas.page_format) setCanvasConfig({ page_format: canvas.page_format });
          if (canvas.background_config) setCanvasConfig({ background_config: canvas.background_config });
          if (canvas.grid) setCanvasConfig({ grid: canvas.grid });
        } else if (theme.config) {
          // Legacy theme - apply colors/fonts as canvas defaults
          if (theme.config.colors) {
            setCanvasConfig({ 
              background_config: { 
                type: 'color', 
                value: theme.config.colors?.background || '#FFFFFF' 
              } 
            });
          }
        }
      } catch (err) {
        setError(err.message || 'Error cargando theme');
      } finally {
        setLoading(false);
      }
    };
    loadTheme();
  }, [id, setCanvasConfig, addElement, resetCanvas]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const canvasState = {
        page_format: canvasConfig.page_format || 'A4-portrait',
        background_config: canvasConfig.background_config || { type: 'color', value: '#FFFFFF' },
        grid: canvasConfig.grid || { enabled: true, size: 8 },
        version: 1,
        elements: elements.map(el => ({
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
      };
      await api.updateTheme(id, {
        canvas_json: JSON.stringify(canvasState),
        page_format: canvasState.page_format,
        background_config: canvasState.background_config,
      });
      alert('Theme guardado correctamente');
    } catch (err) {
      setError(err.message || 'Error guardando theme');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const canvasState = {
      page_format: canvasConfig.page_format || 'A4-portrait',
      background_config: canvasConfig.background_config || { type: 'color', value: '#FFFFFF' },
      grid: canvasConfig.grid || { enabled: true, size: 8 },
      version: 1,
      elements: elements.map(el => ({
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
    };
    const blob = new Blob([JSON.stringify(canvasState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const canvasState = JSON.parse(e.target.result);
        if (!canvasState.elements || !Array.isArray(canvasState.elements)) {
          throw new Error('Formato de archivo inválido');
        }
        // Reset current canvas
        resetCanvas();
        // Apply imported state
        if (canvasState.page_format) setCanvasConfig({ page_format: canvasState.page_format });
        if (canvasState.background_config) setCanvasConfig({ background_config: canvasState.background_config });
        if (canvasState.grid) setCanvasConfig({ grid: canvasState.grid });
        if (canvasState.elements) {
          canvasState.elements.forEach(el => {
            addElement(el.type, {
              ...el.config,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              zIndex: el.zIndex,
              locked: el.locked,
              visible: el.visible,
            }, el.id);
          });
        }
        setShowImportModal(false);
        alert('Theme importado correctamente');
      } catch (err) {
        setError('Error importando: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  if (!isFeatureEnabled('CANVAS_THEMES')) {
    return (
      <div className="p-8 text-center">
        <svg className="mx-auto text-4xl text-amber-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Canvas Editor no disponible</h2>
        <p className="text-gray-600 mb-4">La funcionalidad Canvas Themes está deshabilitada. Activa la feature flag REACT_APP_FEATURE_CANVAS_THEMES.</p>
        <button onClick={() => navigate('/admin/themes')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Volver a Themes
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex bg-gray-100">
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Elementos</h3>
          </div>
          <div className="p-4 text-sm text-gray-400">Cargando...</div>
        </aside>
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/admin/themes')} className="p-2 hover:bg-gray-100 rounded" title="Volver">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div>
                <h2 className="font-semibold text-gray-800">Canvas Editor</h2>
                <p className="text-xs text-gray-500">Cargando theme...</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Cargando</span>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Cargando theme...</p>
            </div>
          </div>
        </main>
        <aside className="w-80 bg-white border-l border-gray-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">No se pudo cargar el theme</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={() => navigate('/admin/themes')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Volver a Themes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Left Sidebar - Element Palette */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Elementos</h3>
        </div>
        <ElementPalette onAddElement={addElement} />
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/themes')} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Volver">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div>
              <h2 className="font-semibold text-gray-800">Canvas Editor</h2>
              <p className="text-xs text-gray-500">Theme ID: {id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Grid Toggle */}
            <button
              onClick={() => setCanvasConfig({ grid: { enabled: !canvasConfig.grid?.enabled, size: 8 } })}
              className={`p-2 rounded transition-colors ${canvasConfig.grid?.enabled ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Cuadrícula"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            {/* Undo/Redo stubs */}
            <button className="p-2 text-gray-400 hover:text-gray-600" disabled title="Deshacer (stub)">
              <RotateCw className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600" disabled title="Rehacer (stub)">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 16l4-4m0 0l4 4m-4-4v12" /></svg>
            </button>
            {/* Export/Import */}
            <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
              <button onClick={handleExport} className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors" title="Exportar theme">
                <Download className="w-5 h-5" />
              </button>
              <button onClick={() => setShowImportModal(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors" title="Importar theme">
                <Upload className="w-5 h-5" />
              </button>
            </div>
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </header>

        {/* Canvas Workspace */}
        <div className="flex-1 flex overflow-auto p-4 bg-gray-100" style={{ background: '#E5E5E5' }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter}>
            <Canvas
              elements={elements}
              selectedId={selectedId}
              canvasConfig={canvasConfig}
              onSelectElement={selectElement}
              onUpdateElement={updateElement}
              onDeleteElement={deleteElement}
              onDuplicateElement={duplicateElement}
              onReorderElements={reorderElements}
            />
          </DndContext>
        </div>
      </main>

      {/* Right Sidebar - Property Panel */}
      <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <ElementPropertiesPanel
          selectedId={selectedId}
          elements={elements}
          canvasConfig={canvasConfig}
          onUpdateElement={updateElement}
          onUpdateCanvasConfig={setCanvasConfig}
        />
      </aside>
    </div>
  );
}

export default CanvasEditor;