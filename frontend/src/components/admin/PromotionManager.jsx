import React, { useState, useEffect } from 'react';
import { Gift, Plus, Edit2, Trash2, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function PromotionManager() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_percentage: '',
    image_url: '',
    start_date: '',
    end_date: '',
    active: true
  });

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const data = await api.getAllPromotions();
      setPromotions(data);
    } catch (error) {
      console.error('Error cargando promociones:', error);
      showNotification('error', 'Error al cargar promociones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_percentage: '',
      image_url: '',
      start_date: '',
      end_date: '',
      active: true
    });
    setEditingPromotion(null);
    setShowForm(false);
  };

  const openEditForm = (promotion) => {
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      discount_percentage: promotion.discount_percentage.toString(),
      image_url: promotion.image_url || '',
      start_date: promotion.start_date ? promotion.start_date.split('T')[0] : '',
      end_date: promotion.end_date ? promotion.end_date.split('T')[0] : '',
      active: promotion.active !== false
    });
    setEditingPromotion(promotion.id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        discount_percentage: parseFloat(formData.discount_percentage),
        image_url: formData.image_url || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        active: formData.active
      };

      if (editingPromotion) {
        await api.updatePromotion(editingPromotion, payload);
        showNotification('success', 'Promoción actualizada correctamente');
      } else {
        await api.createPromotion(
          payload.name,
          payload.description,
          payload.discount_percentage,
          payload.image_url,
          payload.start_date,
          payload.end_date
        );
        showNotification('success', 'Promoción creada correctamente');
      }
      resetForm();
      loadPromotions();
    } catch (error) {
      console.error('Error guardando promoción:', error);
      showNotification('error', 'Error al guardar promoción');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta promoción?')) return;

    try {
      await api.deletePromotion(id);
      showNotification('success', 'Promoción eliminada correctamente');
      loadPromotions();
    } catch (error) {
      console.error('Error eliminando promoción:', error);
      showNotification('error', 'Error al eliminar promoción');
    }
  };

  const formatDiscount = (percentage) => {
    return `${percentage}%`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-AR');
  };

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' 
            ? <CheckCircle className="w-5 h-5" /> 
            : <AlertCircle className="w-5 h-5" />
          }
          {notification.message}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gesti&oacute;n de Promociones</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus className="w-5 h-5" />
          Nueva Promoci&oacute;n
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingPromotion ? 'Editar Promoci&oacute;n' : 'Nueva Promoci&oacute;n'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripci&oacute;n
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de descuento
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de imagen (opcional)
                </label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="https://images.unsplash.com/photo-..."
                />
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Vista previa"
                    className="w-16 h-16 object-cover rounded mt-2"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de fin
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Activa
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700"
                >
                  <Save className="w-4 h-4 inline mr-1" />
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando promociones...</div>
        ) : promotions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Gift className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay promociones todav&iacute;a</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Promoci&oacute;n
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Descuento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vigencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {promotions.map(promo => (
                  <tr key={promo.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {promo.image_url ? (
                          <img
                            src={promo.image_url}
                            alt={promo.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-orange-100 rounded flex items-center justify-center">
                            <Gift className="w-5 h-5 text-orange-600" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{promo.name}</div>
                          <div className="text-sm text-gray-500">{promo.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-orange-600">
                        {formatDiscount(promo.discount_percentage)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>Inicio: {formatDate(promo.start_date)}</div>
                      <div>Fin: {formatDate(promo.end_date)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        promo.active !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {promo.active !== false ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditForm(promo)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
