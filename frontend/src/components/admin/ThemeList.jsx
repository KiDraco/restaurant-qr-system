import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../../components/ui/button';
import { Table, TableHeader, TableRow, TableCell, TableBody } from '../../components/ui/table';
import { useNavigate } from 'react-router-dom';

function ThemeList() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { theme, loading: themeLoading } = useTheme();

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
    if (!confirm('¿Seguro que quieres eliminar este theme?')) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/theme/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchThemes();
    } catch (err) {
      alert('Error al eliminar theme: ' + err.message);
    }
  };

  if (loading) return <div>Cargando themes...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Temas del Menú</h2>
      <Button
        variant="primary"
        onClick={() => navigate('/admin/themes/new')}
        className="mb-3"
      >
        Crear nuevo theme
      </Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Activo</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {themes.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.name}</TableCell>
              <TableCell>{t.is_active ? 'Sí' : 'No'}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(t.id)}
                >
                  Eliminar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/admin/themes/edit/${t.id}`)}
                >
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default ThemeList;