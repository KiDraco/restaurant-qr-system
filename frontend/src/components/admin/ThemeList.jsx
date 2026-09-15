import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Trash2, Edit, Copy, Download, Upload, Eye, CheckCircle } from 'lucide-react';

function ThemeList({ onEditTheme }) {
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [activatingId, setActivatingId] = useState(null);

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

  const handleActivate = async (id) => {
    setActivatingId(id);
    try {
      const result = await api.activateTheme(id);
      if (result && result.error) throw new Error(result.error);
      // Actualizar estado local: solo el theme activado queda activo
      setThemes(prev => prev.map(t => ({ ...t, is_active: t.id === id })));
    } catch (err) {
      alert('Error al activar theme: ' + err.message);
    } finally {
      setActivatingId(null);
    }
  };

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
    }, null, null, 'A4-portrait');
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

  // Extraer colores del theme (config o canvas)
  const getThemeColors = (theme) => {
    const config = theme.config || {};
    const canvas = getCanvasPreview(theme);
    const canvasBg = canvas?.background_config;
    return {
      primary: config.colors?.primary || '#FF6B6B',
      secondary: config.colors?.secondary || '#4ECDC4',
      background: config.colors?.background || canvasBg?.value || '#FFFFFF',
      text: config.colors?.text || '#2A2A2A',
      font: config.font_family || 'system',
    };
  };

  const renderPreview = (canvas, theme) => {
    const colors = getThemeColors(theme);
    const bg = canvas?.background_config || { type: 'color', value: colors.background };
    const elements = canvas?.elements || [];
    
    return (
      <div className="relative w-full aspect-[794/1123] rounded overflow-hidden border border-gray-200 bg-gray-50">
        {/* Fondo del theme */}
        <div className="absolute inset-0" style={{
          background: bg.type === 'gradient' 
            ? `linear-gradient(135deg, ${bg.value?.from || colors.primary}, ${bg.value?.to || colors.secondary})`
            : bg.type === 'image' && bg.value
              ? `url(${bg.value})`
              : bg.value || colors.background,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        {/* Elementos del canvas - renderizado por tipo */}
        <svg width="100%" height="100%" viewBox="0 0 794 1123" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          {elements
            .slice()
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map(el => {
              const x = (el.x || 0) / 794 * 100;
              const y = (el.y || 0) / 1123 * 100;
              const w = (el.width || 0) / 794 * 100;
              const h = (el.height || 0) / 1123 * 100;
              const cfg = el.config || {};
              
              // Texto: mostrar como texto real truncado
              if (el.type === 'text') {
                const content = cfg.content || 'Texto';
                const fontSize = Math.max(4, (cfg.fontSize || 16) * 0.15); // escalado para preview
                const fontFamily = cfg.fontFamily || 'system-ui';
                const fontWeight = cfg.fontWeight || 'normal';
                const color = cfg.color || colors.text;
                const align = cfg.textAlign || 'left';
                const lines = content.split('\n').slice(0, 3); // máx 3 líneas
                return (
                  <g key={el.id} transform={`translate(${x}%, ${y}%)`}>
                    <rect x="0" y="0" width={`${w}%`} height={`${h}%`} fill="transparent" />
                    {lines.map((line, i) => (
                      <text
                        key={i}
                        x="0"
                        y={`${i * (fontSize * 1.3)}`}
                        fontSize={fontSize}
                        fontFamily={fontFamily}
                        fontWeight={fontWeight}
                        fill={color}
                        textAnchor={align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start'}
                        dominantBaseline="hanging"
                        style={{ width: `${w}%`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {line.length > 30 ? line.slice(0, 30) + '…' : line}
                      </text>
                    ))}
                  </g>
                );
              }
              
              // Imagen: mostrar la imagen real o placeholder
              if (el.type === 'image') {
                const src = cfg.src;
                const radius = cfg.borderRadius || 0;
                return (
                  <g key={el.id}>
                    {src ? (
                      <image
                        x={`${x}%`}
                        y={`${y}%`}
                        width={`${w}%`}
                        height={`${h}%`}
                        href={src}
                        rx={radius}
                        ry={radius}
                        style={{ objectFit: cfg.objectFit || 'cover' }}
                        opacity={cfg.opacity ?? 1}
                      />
                    ) : (
                      // Placeholder para imagen sin src
                      <>
                        <rect
                          x={`${x}%`}
                          y={`${y}%`}
                          width={`${w}%`}
                          height={`${h}%`}
                          fill="#F3F4F6"
                          stroke="#D1D5DB"
                          strokeWidth="0.5"
                          strokeDasharray="2,2"
                          rx={radius}
                          ry={radius}
                        />
                        <text
                          x={`${x + w/2}%`}
                          y={`${y + h/2}%`}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={Math.max(4, w * 0.15)}
                          fill="#9CA3AF"
                          fontFamily="system-ui"
                        >
                          📷
                        </text>
                      </>
                    )}
                  </g>
                );
              }
              
              // Categoría: barra con label
              if (el.type === 'category') {
                const label = cfg.label || 'Categoría';
                const fontSize = Math.max(4, (cfg.fontSize || 18) * 0.15);
                const fontFamily = cfg.fontFamily || 'system-ui';
                const fontWeight = cfg.fontWeight || 'bold';
                const color = cfg.color || colors.primary;
                const showSep = cfg.separator !== false;
                return (
                  <g key={el.id}>
                    <rect
                      x={`${x}%`}
                      y={`${y}%`}
                      width={`${w}%`}
                      height={`${h}%`}
                      fill={cfg.background || 'transparent'}
                      opacity={cfg.opacity ?? 1}
                      rx={cfg.borderRadius || 0}
                    />
                    <text
                      x={`${x + 2}%`}
                      y={`${y + h/2}%`}
                      dominantBaseline="middle"
                      fontSize={fontSize}
                      fontFamily={fontFamily}
                      fontWeight={fontWeight}
                      fill={color}
                      style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {label.length > 25 ? label.slice(0, 25) + '…' : label}
                    </text>
                    {showSep && (
                      <line
                        x1={`${x}%`}
                        y1={`${y + h}%`}
                        x2={`${x + w}%`}
                        y2={`${y + h}%`}
                        stroke={color}
                        strokeWidth="0.5"
                        opacity={0.5}
                      />
                    )}
                  </g>
                );
              }
              
              // Otros elementos (decorative, etc.): rectángulo simple
              const bgColor = cfg.color || cfg.background || colors.primary;
              return (
                <rect
                  key={el.id}
                  x={`${x}%`}
                  y={`${y}%`}
                  width={`${w}%`}
                  height={`${h}%`}
                  fill={bgColor}
                  opacity={0.5}
                  rx={cfg.borderRadius || 0}
                />
              );
            })}
        </svg>
        {/* Paleta de colores del theme - barra inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-3 flex" style={{ background: 'rgba(0,0,0,0.08)' }}>
          <div className="flex-1" style={{ background: colors.primary }} title="Primary" />
          <div className="flex-1" style={{ background: colors.secondary }} title="Secondary" />
          <div className="flex-1" style={{ background: colors.background }} title="Background" />
          <div className="flex-1" style={{ background: colors.text }} title="Text" />
        </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
        {themes.map((t) => {
          const canvas = getCanvasPreview(t);
          return (
            <div key={t.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
{/* Preview */}
              <div className="relative aspect-[794/1123] bg-gray-100 overflow-hidden">
                {renderPreview(getCanvasPreview(t), t)}
                {!getCanvasPreview(t) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                    <div className="flex gap-1">
                      <div className="w-6 h-6 rounded" style={{ background: t.config?.colors?.primary || '#FF6B6B' }} title="Primary" />
                      <div className="w-6 h-6 rounded" style={{ background: t.config?.colors?.secondary || '#4ECDC4' }} title="Secondary" />
                      <div className="w-6 h-6 rounded" style={{ background: t.config?.colors?.background || '#FFFFFF' }} title="Background" />
                      <div className="w-6 h-6 rounded" style={{ background: t.config?.colors?.text || '#2A2A2A' }} title="Text" />
                    </div>
                    <span className="text-xs text-gray-500 mt-1">Sin canvas</span>
                  </div>
                )}
                {/* Badge formato */}
                <div className="absolute top-1 left-1 px-1.5 py-0.5 text-xs font-medium rounded bg-white/90 backdrop-blur-sm text-gray-700">
                  {t.page_format || 'A4'}
                </div>
                <div className="absolute top-1 right-1 flex gap-1">
                  <button onClick={() => navigate(`/admin/themes/${t.id}/edit`)} className="p-1 bg-white/90 rounded hover:bg-white" title="Editar en Canvas">
                    <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => navigate(`/admin/themes/${t.id}/edit`)} className="p-1 bg-white/90 rounded hover:bg-white" title="Vista previa">
                    <Eye className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* Info & Actions */}
              <div className="p-2">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-medium text-gray-800 truncate text-sm">{t.name}</h3>
                  <span className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-full ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {t.is_active && <CheckCircle className="w-2.5 h-2.5" />}
                    {t.is_active ? 'Usado en menú' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex gap-1 mb-1.5">
                  <button
                    onClick={() => handleActivate(t.id)}
                    disabled={t.is_active || activatingId === t.id}
                    className={`flex-1 px-1.5 py-1 rounded text-xs text-center disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1 ${
                      t.is_active
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                    title={t.is_active ? 'Este theme se muestra en tu menú' : 'Mostrar este theme en tu menú'}
                  >
                    {activatingId === t.id ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : t.is_active ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    {activatingId === t.id ? 'Activando...' : t.is_active ? 'Activo' : 'Usar en mi menú'}
                  </button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => navigate(`/admin/themes/${t.id}/edit`)} className="flex-1 px-1.5 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 text-center">
                    <Edit className="w-3.5 h-3.5 mx-auto" />
                  </button>
                  <button onClick={() => handleDuplicate(t.id)} className="px-1.5 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-center" title="Duplicar">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleExport(t)} className="px-1.5 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-center" title="Exportar JSON">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setImportFile(null); setShowImportModal(true); }} className="px-1.5 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-center" title="Importar">
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  {deleteId === t.id ? (
                    <div className="flex gap-1 w-full">
                      <button onClick={() => handleDelete(t.id)} className="px-1.5 py-1 bg-red-600 text-white rounded text-xs flex-1">Sí</button>
                      <button onClick={() => setDeleteId(null)} className="px-1.5 py-1 bg-gray-300 rounded text-xs">No</button>
                    </div>
                  ) : (
                      <button onClick={() => setDeleteId(t.id)} className="px-1.5 py-1 bg-red-600 text-white rounded text-xs w-full">Eliminar</button>
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