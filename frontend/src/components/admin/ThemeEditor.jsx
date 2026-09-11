import React, { useState, useEffect, useRef } from 'react';

const API_URL = '/api';

function useTheme() {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const appliedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchTheme() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/theme/active`, { credentials: 'include' });
        if (!res.ok) throw new Error('No se pudo obtener el theme');
        const data = await res.json();
        if (data && data.config) {
          setTheme(data.config);
        } else {
          throw new Error('Theme sin configuración');
        }
      } catch (err) {
        setError(err.message);
        setTheme({
          logo_url: null,
          colors: { primary: '#FF6B6B', secondary: '#4ECDC4', background: '#FFFFFF', text: '#2A2A2A' },
          font_family: 'system',
          background_type: 'color',
          background_value: null,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTheme();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!theme || appliedRef.current) return;
    appliedRef.current = true;
    const root = document.documentElement;
    if (theme.colors) {
      root.style.setProperty('--theme-primary', theme.colors.primary);
      root.style.setProperty('--theme-secondary', theme.colors.secondary);
      root.style.setProperty('--theme-background', theme.colors.background);
      root.style.setProperty('--theme-text', theme.colors.text);
    }
    if (theme.font_family) {
      root.style.setProperty('--theme-font', theme.font_family);
    }
    if (theme.font_family && theme.font_family !== 'system') {
      const prev = document.getElementById('google-font-preload');
      if (prev) prev.remove();
      const link = document.createElement('link');
      link.id = 'google-font-preload';
      link.rel = 'preload';
      link.as = 'style';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.font_family)}`;
      link.type = 'text/css';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
    if (theme.background_type === 'gradient' && theme.background_value) {
      root.style.setProperty('--theme-gradient', theme.background_value);
    } else if (theme.background_type === 'image' && theme.background_value) {
      root.style.setProperty('--theme-bg-image', `url('${theme.background_value}')`);
    }
  }, [theme]);

  return { theme, loading, error };
}

function ThemeEditor({ themeId, onBack }) {
  const { theme, loading, error } = useTheme();
  const [form, setForm] = useState({
    name: '',
    colors: { primary: '#FF6B6B', secondary: '#4ECDC4', background: '#FFFFFF', text: '#2A2A2A' },
    font_family: 'system',
    background_type: 'color',
    background_value: '',
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (themeId && theme) {
      setForm({
        name: theme.name || '',
        colors: theme.colors || { primary: '#FF6B6B', secondary: '#4ECDC4', background: '#FFFFFF', text: '#2A2A2A' },
        font_family: theme.font_family || 'system',
        background_type: theme.background_type || 'color',
        background_value: theme.background_value || '',
      });
    }
  }, [themeId, theme]);

  useEffect(() => {
    if (!form.name) return;
    setPreviewUrl(`/preview?theme=${btoa(JSON.stringify(form))}`);
  }, [form]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleColorChange = (color, value) => {
    setForm(prev => ({ ...prev, colors: { ...prev.colors, [color]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = themeId ? `/api/theme/${themeId}` : '/api/theme';
      const method = themeId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to save');
      onBack();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && themeId) return <div className="p-4">Cargando theme...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        {onBack && (
          <button onClick={onBack} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm">
            ← Volver
          </button>
        )}
        <h2 className="text-xl font-bold">{themeId ? 'Editar Theme' : 'Crear Nuevo Theme'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            placeholder="Ej: Moderno, Clásico"
            required
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {['primary', 'secondary', 'background', 'text'].map(c => (
            <div key={c}>
              <label className="block text-sm font-medium mb-1 capitalize">{c}</label>
              <div className="flex gap-2">
                <input type="color" value={form.colors[c]} onChange={e => handleColorChange(c, e.target.value)} className="w-14 h-10 p-1 cursor-pointer border rounded" />
                <input value={form.colors[c]} onChange={e => handleColorChange(c, e.target.value)} placeholder="#HEX" className="flex-1 border rounded-lg p-2" />
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tipo de fondo</label>
          <select value={form.background_type} onChange={e => handleChange('background_type', e.target.value)} className="w-full border rounded-lg p-2">
            <option value="color">Color sólido</option>
            <option value="image">Imagen</option>
            <option value="gradient">Gradiente</option>
          </select>
        </div>

        {(form.background_type === 'image' || form.background_type === 'gradient') && (
          <div>
            <label className="block text-sm font-medium mb-1">URL del fondo</label>
            <input value={form.background_value} onChange={e => handleChange('background_value', e.target.value)} placeholder="https://..." className="w-full border rounded-lg p-2" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Tipografía</label>
          <select value={form.font_family} onChange={e => handleChange('font_family', e.target.value)} className="w-full border rounded-lg p-2">
            <option value="system">System (default)</option>
            <option value="Inter">Inter</option>
            <option value="Playfair Display">Playfair Display</option>
            <option value="Roboto">Roboto</option>
            <option value="Poppins">Poppins</option>
            <option value="Montserrat">Montserrat</option>
          </select>
        </div>

        {previewUrl && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Vista previa:</label>
            <iframe src={previewUrl} className="w-full h-64 border rounded-lg" sandbox="allow-same-origin" title="Preview theme" />
          </div>
        )}

        <button type="submit" disabled={saving} className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
          {saving ? 'Guardando...' : (themeId ? 'Actualizar' : 'Crear') + ' Theme'}
        </button>
      </form>
    </div>
  );
}

export default ThemeEditor;
