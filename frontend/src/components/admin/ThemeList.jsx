import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Trash2, Edit, Copy, Download, Upload, Eye } from 'lucide-react';

function ThemeList({ onEditTheme }) {
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);

  useEffect(() => {
    async function fetchThemes() {
      try {
        const data = await api.getThemes();
        setThemes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchThemes();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.deleteTheme(id);
      setThemes(themes.filter(t => t.id !== id));
      setDeleteId(null);
    } catch (err) {
      alert('Error al eliminar theme: ' + err.message);
      setDeleteId(null);
    }
  };

  const handleDuplicate = async (id) => {
    const theme = themes.find(t => t.id === id);
    if (!theme) return;
    try {
      const newTheme = await api.createTheme(
        `${theme.name} - Copia`,
        theme.config,
        theme.canvas_json,
        theme.page_format,
        theme.background_config
      );
      setThemes(prev => [newTheme.theme, ...prev]);
    } catch (err) {
      alert('Error duplicando: ' + err.message);
    }
  };

const handleNewTheme = async () => {
  try {
    const newTheme = await api.createTheme('Nuevo Theme', {
      background_type: 'color',
      background_value: '#FFFFFF',
    }, null, 'A4-portrait', { type: 'color', value: '#FFFFFF' });
    if (!newTheme || !newTheme.theme || !newTheme.theme.id) {
      throw new Error('Respuesta inesperada del servidor al crear theme');
    }
    navigate(`/admin/themes/${newTheme.theme.id}/edit`);
  } catch (err) {
    alert('Error creando theme: ' + (err.message || err));
  }
};

  const handleExport = (theme) => {
    const canvasState = theme.canvas_json ? (typeof theme.canvas_json === 'string' ? JSON.parse(theme.canvas_json) : theme.canvas_json) : null;
    if (!canvasState) {
      alert('Este theme no tiene canvas para exportar');
      return;
    }
    const blob = new Blob([JSON.stringify(canvasState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${theme.name.replace(/\s+/g, '-')}.json`;
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
        const newTheme = await api.createTheme(
          `Importado ${new Date().toLocaleDateString()}`,
          {},
          JSON.stringify(canvasState),
          canvasState.page_format || 'A4-portrait',
          canvasState.background_config || { type: 'color', value: '#FFFFFF' }
        );
        setThemes(prev => [newTheme.theme, ...prev]);
        setShowImportModal(false);
      } catch (err) {
        alert('Error importando: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const getCanvasPreview = (theme) => {
    if (!theme.canvas_json) return null;
    try {
      const canvas = typeof theme.canvas_json === 'string' ? JSON.parse(theme.canvas_json) : theme.canvas_json;
      if (!canvas.elements || !canvas.elements.length) return null;
      return canvas;
    } catch {
      return null;
    }
  };

  const renderPreview = (canvas) => {
    if (!canvas) return null;
    const bg = canvas.background_config || { type: 'color', value: '#FFFFFF' };
    const elements = canvas.elements || [];
    
    return (
      <div className="relative w-full aspect-[794/1123] bg-gray-100 rounded overflow-hidden border border-gray-200" style={{ width: '200px' }}>
        <div className="absolute inset-0" style={{
          background: bg.type === 'gradient' 
            ? `linear-gradient(135deg, ${bg.value?.from || '#FF6B6B'}, ${bg.value?.to || '#4ECDC4'})`
            : bg.type === 'image' && bg.value
              ? `url(${bg.value})`
              : bg.value || '#FFFFFF',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        <svg width="100%" height="100%" viewBox="0 0 794 1123" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          {elements
            .slice()
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map(el => {
              const x = (el.x || 0) / 794 * 100;
              const y = (el.y || 0) / 1123 * 100;
              const w = (el.width || 0) / 794 * 100;
              const h = (el.height || 0) / 1123 * 100;
              const bgColor = el.config?.color || el.config?.background || '#3B82F6';
              return (
                <rect
                  key={el.id}
                  x={`${x}%`}
                  y={`${y}%`}
                  width={`${w}%`}
                  height={`${h}%`}
                  fill={bgColor}
                  opacity={0.7}
                />
              );
            })}
        </svg>
      </div>
    );
  };

  if (loading) return <div className="p-4">Cargando themes...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Temas del Menú</h2>
        <button
          onClick={handleNewTheme}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo Theme
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {themes.map((t) => {
          const canvas = getCanvasPreview(t);
          return (
            <div key={t.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {/* Preview */}
              <div className="relative aspect-[794/1123] bg-gray-100 overflow-hidden">
                {renderPreview(getCanvasPreview(t))}
                {!getCanvasPreview(t) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                    <div className="flex gap-2">
                      {t.config?.colors && (
                        <>
                          <div className="w-8 h-8 rounded" style={{ background: t.config.colors.primary }} />
                          <div className="w-8 h-8 rounded" style={{ background: t.config.colors.secondary }} />
                          <div className="w-8 h-8 rounded" style={{ background: t.config.colors.background }} />
                        </>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 mt-2">Sin canvas</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => navigate(`/admin/themes/${t.id}/edit`)} className="p-1 bg-white/90 rounded hover:bg-white" title="Editar en Canvas">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => navigate(`/admin/themes/${t.id}/edit`)} className="p-1 bg-white/90 rounded hover:bg-white" title="Vista previa">
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* Info & Actions */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 truncate">{t.name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {t.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => navigate(`/admin/themes/${t.id}/edit`)} className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 text-center">
                    <Edit className="w-4 h-4 mx-auto" />
                  </button>
                  <button onClick={() => handleDuplicate(t.id)} className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-center" title="Duplicar">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleExport(t)} className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-center" title="Exportar JSON">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setImportFile(null); setShowImportModal(true); }} className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-center" title="Importar">
                    <Upload className="w-4 h-4" />
                  </button>
                  {deleteId === t.id ? (
                    <div className="flex gap-1 w-full">
                      <button onClick={() => handleDelete(t.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs flex-1">Sí</button>
                      <button onClick={() => setDeleteId(null)} className="px-2 py-1 bg-gray-300 rounded text-xs">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteId(t.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs w-full">Eliminar</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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

export default ThemeList;