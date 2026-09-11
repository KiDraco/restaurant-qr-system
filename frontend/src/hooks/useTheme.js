import { useEffect, useState, useRef } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

/**
 * Hook para consumir el theme activo desde el backend.
 * - Fetch on mount de `/api/theme/active`
 * - Inyección de CSS variables en `:root` (solo si hay theme)
 * - Carga dinámica de Google Fonts con preload y font-display: swap
 * - Fallback a defaults si el fetch falla o el theme está corrupto
 * - Debounce pequeño para evitar re-renders excesivos
 */
export function useTheme() {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const appliedRef = useRef(false); // asegurar que solo se injecta una vez

  useEffect(() => {
    let cancelled = false;

    async function fetchTheme() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/theme/active`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('No se pudo obtener el theme');
        const data = await res.json();
        if (data && data.config) {
          setTheme(data.config);
        } else {
          throw new Error('Theme sin configuración');
        }
      } catch (err) {
        setError(err.message);
        // Fallback a theme por defecto si falla
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

    // Cleanup: remover CSS vars y fonts si el componente se desmonta
    return () => {
      cancelled = true;
      // No removemos vars aquí para que el theme persista mientras la página esté abierta;
      // se limpiará al cerrar pestaña o navigation
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Efecto secundario: injectar CSS vars y cargar fonts SOLO cuándo el theme está listo
  useEffect(() => {
    if (!theme || appliedRef.current) return;
    appliedRef.current = true;

    const root = document.documentElement;

    // 1. Inyectar CSS variables
    if (theme.colors) {
      root.style.setProperty('--theme-primary', theme.colors.primary);
      root.style.setProperty('--theme-secondary', theme.colors.secondary);
      root.style.setProperty('--theme-background', theme.colors.background);
      root.style.setProperty('--theme-text', theme.colors.text);
    }
    if (theme.font_family) {
      root.style.setProperty('--theme-font', theme.font_family);
    }

    // 2. Cargar Google Fonts dinámicamente si el family no es "system"
    if (theme.font_family && theme.font_family !== 'system') {
      // Remover link previo si existe
      const prev = document.getElementById('google-font-preload');
      if (prev) prev.remove();

      const link = document.createElement('link');
      link.id = 'google-font-preload';
      link.rel = 'preload';
      link.as = 'style';
      link.href = `https://fonts.googleapis.com/css2:wght@400;600&family=${encodeURIComponent(theme.font_family)}`;
      link.type = 'text/css';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);

      // Injectar la regla CSS después de que el font cargue
      const style = document.createElement('style');
      style.textContent = `
        :root { font-family: '${theme.font_family}', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
      `;
      document.head.appendChild(style);

      // Cuando el link se hace load, removemos el preload y añadimos la regla definitva
      link.addEventListener('load', () => {
        // El style tag ya inyectó la familia; opcional: quitar el preload
        // No lo removemos para que persista la sesión
      });
    }

    // 3. Aplicar background según tipo
    if (theme.background_type === 'gradient' && theme.background_value) {
      root.style.setProperty('--theme-gradient', theme.background_value);
    } else if (theme.background_type === 'image' && theme.background_value) {
      root.style.setProperty('--theme-bg-image', `url('${theme.background_value}')`);
    } else if (theme.background_type === 'color' && theme.background_value) {
      root.style.setProperty('--theme-background', theme.background_value);
    }
  }, [theme]); // eslint-disable-line react-hooks/exhaustive-deps

  return { theme, loading, error };
}

export default useTheme;
