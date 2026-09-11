import React, { useState, useEffect } from 'react';

function ThemeList({ onEditTheme }) {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    async function fetchThemes() {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/theme`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
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
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/theme/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete');
      const r = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/theme`, { credentials: 'include' });
      if (r.ok) setThemes(await r.json());
      setDeleteId(null);
    } catch (err) {
      alert('Error al eliminar theme: ' + err.message);
      setDeleteId(null);
    }
  };

  if (loading) return <div className="p-4">Cargando themes...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Temas del Menú</h2>
      <button
        onClick={() => onEditTheme(null)}
        className="mb-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
      >
        Crear nuevo theme
      </button>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Nombre</th>
            <th className="border p-2 text-left">Activo</th>
            <th className="border p-2 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {themes.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="border p-2">{t.name}</td>
              <td className="border p-2">{t.is_active ? 'Sí' : 'No'}</td>
              <td className="border p-2">
                {deleteId === t.id ? (
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-red-600">¿Seguro?</span>
                    <button onClick={() => handleDelete(t.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Sí</button>
                    <button onClick={() => setDeleteId(null)} className="px-2 py-1 bg-gray-300 rounded text-xs">No</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteId(t.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 mr-2">Eliminar</button>
                )}
                <button onClick={() => onEditTheme(t.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ThemeList;
