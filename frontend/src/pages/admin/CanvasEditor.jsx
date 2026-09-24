import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Canvas } from '../../components/admin/canvas/Canvas';
import { ElementPalette } from '../../components/admin/canvas/ElementPalette';
import { ElementPropertiesPanel } from '../../components/admin/canvas/ElementPropertiesPanel';
import { SimpleEditor } from '../../components/admin/canvas/SimpleEditor';
import { DynamicPageRenderer } from '../../components/client/DynamicPageRenderer';
import { useCanvas } from '../../hooks/useCanvas';
import api from '../../services/api';
import { isFeatureEnabled } from '../../utils/featureFlags';
import { Loader2, AlertTriangle, X, Save, Download, Upload, Copy, Trash2, RotateCw, Plus, Layout, Menu, ChevronRight, ChevronLeft, Settings, Trash, Copy as CopyIcon, Eye, Edit2 } from 'lucide-react';

export function CanvasEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [showPageSettings, setShowPageSettings] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  // Editing mode: both tabs share the same theme state, so switching never loses data.
  const [editorMode, setEditorMode] = useState('pro');

  // Hooks must be called at the top level - before any early returns
  const sensors = useSensors(
    useSensor(KeyboardSensor, { coordinateGetter: closestCenter }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const {
    pages,
    activePageId,
    activePage,
    setActivePage,
    addPage,
    deletePage,
    duplicatePage,
    reorderPages,
    elements,
    selectedId,
    canvasConfig,
    canvasSize,
    globalConfig,
    setGlobalConfig,
    setPageConfig,
    selectElement,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    reorderElements,
    moveElementInLayer,
    resetCanvas,
    loadFromLegacyCanvas,
    exportCanvas,
    PAGE_TYPES,
  } = useCanvas();

  // Persist the exact drop position when a free drag ends.
  const handleDragEnd = (event) => {
    const { active, delta } = event;
    if (!active || !delta || (delta.x === 0 && delta.y === 0)) return;
    const el = elements.find(e => e.id === active.id);
    if (!el || el.locked) return;
    updateElement(el.id, { x: el.x + delta.x, y: el.y + delta.y });
  };

  // Ref para evitar re-carga infinita del mismo theme
  const loadedIdRef = useRef(null);

  // Resetear ref si el id cambia (navegación entre themes)
  useEffect(() => {
    loadedIdRef.current = null;
  }, [id]);

  // Load theme on mount
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
          // Migrate legacy or load multi-page
          loadFromLegacyCanvas(canvas);
        } else if (theme.config) {
          // Legacy theme - apply colors/fonts as global config
          if (theme.config.colors) {
            setGlobalConfig({ colors: theme.config.colors });
          }
          if (theme.config.font_family) {
            setGlobalConfig({ font_family: theme.config.font_family });
          }
          if (theme.config.background_type || theme.config.background_value) {
            setGlobalConfig({ 
              background_config: { 
                type: theme.config.background_type || 'color', 
                value: theme.config.background_value || '#FFFFFF' 
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
  }, [id, resetCanvas, loadFromLegacyCanvas, setGlobalConfig]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const canvasState = exportCanvas();
      await api.updateTheme(id, {
        canvas_json: JSON.stringify(canvasState),
        page_format: activePage?.config?.page_format || 'mobile-portrait',
        background_config: globalConfig.background_config || { type: 'color', value: '#FFFFFF' },
        config: globalConfig,
      });
      alert('Theme guardado correctamente');
    } catch (err) {
      setError(err.message || 'Error guardando theme');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const canvasState = exportCanvas();
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
        if (!canvasState.pages || !Array.isArray(canvasState.pages)) {
          throw new Error('Formato de archivo inválido (se esperaba multi-page)');
        }
        // Load imported state
        resetCanvas();
        // We need to use the internal setPages - for now just alert
        // TODO: add setPages to useCanvas
        alert('Importación multi-page requiere recargar la página. Use el botón de recarga del navegador después de importar.');
        setShowImportModal(false);
      } catch (err) {
        setError('Error importando: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  if (!isFeatureEnabled('CANVAS_THEMES')) {
    return (
      <div className="p-8 text-center">
        <svg className="mx-auto text-4xl text-amber-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
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
        <aside className={`${leftSidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200`}>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Páginas</h3>
            <button onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)} className="p-1 hover:bg-gray-100 rounded" title={leftSidebarCollapsed ? 'Expandir' : 'Colapsar'}>
              {leftSidebarCollapsed ? <ChevronRight className="w-5 h-5 text-gray-500" /> : <ChevronLeft className="w-5 h-5 text-gray-500" />}
            </button>
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

  const handleAddPage = () => {
    // Show a simple prompt for page type
    const type = prompt('Tipo de página (scan, table, menu, bill):', 'menu');
    if (type && PAGE_TYPES.find(t => t.id === type)) {
      addPage(type);
    }
  };

  const handlePageAction = (pageId, action) => {
    if (action === 'delete') {
      if (pages.length <= 1) {
        alert('Debe haber al menos una página');
        return;
      }
      if (confirm(`¿Eliminar la página "${pages.find(p => p.id === pageId)?.name}"?`)) {
        deletePage(pageId);
      }
    } else if (action === 'duplicate') {
      duplicatePage(pageId);
    } else if (action === 'settings') {
      setShowPageSettings(true);
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Left Sidebar - Pages + Element Palette */}
      <aside className={`${leftSidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 overflow-hidden`}>
        {/* Pages Header */}
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          {!leftSidebarCollapsed && <h3 className="font-semibold text-gray-800">Páginas del Theme</h3>}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)} 
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title={leftSidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {leftSidebarCollapsed ? <ChevronRight className="w-5 h-5 text-gray-500" /> : <ChevronLeft className="w-5 h-5 text-gray-500" />}
            </button>
            <button onClick={handleAddPage} className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Agregar página">
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Page Tabs List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {pages.map((page, index) => (
            <div key={page.id} className="relative">
              <button
                onClick={() => setActivePage(page.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activePageId === page.id
                    ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                } ${leftSidebarCollapsed ? 'justify-center' : ''}`}
                title={leftSidebarCollapsed ? page.name : ''}
              >
                <span className="text-lg flex-shrink-0">{page.icon}</span>
                {!leftSidebarCollapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-sm truncate">{page.name}</p>
                    <p className="text-xs text-gray-400 truncate">{page.type}</p>
                  </div>
                )}
                {!leftSidebarCollapsed && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handlePageAction(page.id, 'settings'); }} className="p-1 hover:bg-blue-100 rounded text-blue-600 text-gray-400" title="Configurar página">
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handlePageAction(page.id, 'duplicate'); }} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Duplicar">
                      <CopyIcon className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handlePageAction(page.id, 'delete'); }} className="p-1 hover:bg-red-50 rounded text-red-500" title="Eliminar">
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Element Palette (professional mode only) */}
        {!leftSidebarCollapsed && editorMode === 'pro' && (
          <div className="border-t border-gray-200 flex-1 overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-800">Elementos</h3>
            </div>
            <ElementPalette onAddElement={addElement} />
          </div>
        )}
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
              <p className="text-xs text-gray-500">Theme: {id} · Página: {activePage?.name} ({activePage?.type})</p>
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setEditorMode('simple')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${editorMode === 'simple' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Simple
              </button>
              <button
                onClick={() => setEditorMode('pro')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${editorMode === 'pro' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Profesional
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Page Settings */}
            <button
              onClick={() => setShowPageSettings(true)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors"
              title="Configuración de página"
            >
              <Settings className="w-5 h-5" />
            </button>
            {/* Grid Toggle */}
            <button
              onClick={() => setPageConfig(activePageId, { grid: { enabled: !canvasConfig.grid?.enabled, size: 8 } })}
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

        {/* Page Settings Modal */}
        {showPageSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4">Configuración de página: {activePage?.name}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la página</label>
                  <input
                    type="text"
                    value={activePage?.name}
                    onChange={(e) => setPageConfig(activePageId, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
                  <select
                    value={canvasConfig.page_format || 'mobile-portrait'}
                    onChange={(e) => setPageConfig(activePageId, { page_format: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="mobile-portrait">Móvil Vertical (375×667)</option>
                    <option value="mobile-landscape">Móvil Horizontal (667×375)</option>
                    <option value="A4-portrait">A4 Vertical (794×1123)</option>
                    <option value="A4-landscape">A4 Horizontal (1123×794)</option>
                    <option value="Letter">Letter (816×1056)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fondo</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="bg-type" value="color" checked={canvasConfig.background_config?.type === 'color'} onChange={() => setPageConfig(activePageId, { background_config: { type: 'color', value: canvasConfig.background_config?.value || '#FFFFFF' } })} className="text-blue-600" />
                      <span className="text-sm">Color sólido</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="bg-type" value="gradient" checked={canvasConfig.background_config?.type === 'gradient'} onChange={() => setPageConfig(activePageId, { background_config: { type: 'gradient', value: { from: '#FF6B6B', to: '#4ECDC4' } } })} className="text-blue-600" />
                      <span className="text-sm">Gradiente</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="bg-type" value="image" checked={canvasConfig.background_config?.type === 'image'} onChange={() => setPageConfig(activePageId, { background_config: { type: 'image', value: canvasConfig.background_config?.value || '' } })} className="text-blue-600" />
                      <span className="text-sm">Imagen</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button onClick={() => setShowPageSettings(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancelar</button>
                  <button onClick={() => setShowPageSettings(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canvas Workspace */}
        {editorMode === 'simple' ? (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-[380px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
             <SimpleEditor
               activePage={activePage}
               elements={elements}
               globalConfig={globalConfig}
               onUpdateElement={updateElement}
               onUpdateGlobalConfig={setGlobalConfig}
               onUpdatePageConfig={(patch) => setPageConfig(activePageId, patch)}
               activePageId={activePageId}
               menuItems={[]}
               categories={[]}
             />
             {/* Panel de elementos para modo Simple - Instagram style */}
             <ElementPalette
               onAddElement={addElement}
               mode="simple"
             />
          </div>
          <div className="flex-1 overflow-y-auto p-6" style={{ background: '#E5E5E5' }}>
            <p className="mb-3 text-center text-xs text-gray-500">Vista previa en vivo</p>
            <div className="mx-auto w-[430px] max-w-full rounded-[2rem] bg-gray-800 p-2 shadow-xl">
              <div className="overflow-y-auto rounded-[1.5rem] bg-gray-100" style={{ height: 720 }}>
                <DynamicPageRenderer
                  key={activePageId}
                  page={activePage}
                  globalConfig={globalConfig}
                  menuItems={[]}
                  categories={[]}
                  billData={null}
                  onAction={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
        ) : (
        <div className="flex-1 flex overflow-auto p-4 bg-gray-100" style={{ background: '#E5E5E5' }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Canvas
              elements={elements}
              selectedId={selectedId}
              canvasConfig={canvasConfig}
              canvasSize={canvasSize}
              onSelectElement={selectElement}
              onUpdateElement={updateElement}
              onDeleteElement={deleteElement}
              onDuplicateElement={duplicateElement}
              onReorderElements={reorderElements}
            />
          </DndContext>
        </div>
        )}
      </main>

      {/* Right Sidebar - Property Panel (professional mode only) */}
      {editorMode === 'pro' && (
      <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <ElementPropertiesPanel
          selectedId={selectedId}
          elements={elements}
          canvasConfig={canvasConfig}
          canvasSize={canvasSize}
          globalConfig={globalConfig}
          onUpdateElement={updateElement}
          onUpdateCanvasConfig={(patch) => setPageConfig(activePageId, patch)}
          onUpdateGlobalConfig={setGlobalConfig}
          activePageType={activePage?.type}
        />
      </aside>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Importar Theme</h3>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowImportModal(false); setImportFile(null); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Cancelar</button>
              <button 
                onClick={() => { if (importFile) handleImport(importFile); }} 
                disabled={!importFile}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CanvasEditor;