import React, { useState, useEffect } from 'react';
import { Gift, Plus, Edit2, Trash2, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-[scaleIn_0.2s_ease-out]">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-2">{message}</p>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-8 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 bg-gray-100 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded-full w-1/3" />
              <div className="h-3 bg-gray-100 rounded-full w-1/4" />
            </div>
            <div className="h-4 bg-gray-100 rounded-full w-16" />
            <div className="h-6 w-16 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PromotionManager() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
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
    try {
      await api.deletePromotion(id);
      showNotification('success', 'Promoción desactivada correctamente');
      loadPromotions();
    } catch (error) {
      console.error('Error eliminando promoción:', error);
      showNotification('error', 'Error al eliminar promoción');
    }
    setConfirmDelete(null);
  };

  const formatDiscount = (percentage) => `${percentage}%`;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-AR');
  };

  return (
    <div className="p-6">
      {/* Confirmation dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar promoción"
        message="¿Estás seguro de desactivar esta promoción? Podés volver a activarla después."
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Toast notification */}
      {notification && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-white backdrop-blur-sm animate-[slideIn_0.3s_ease-out]"
          style={{ backgroundColor: notification.type === 'success' ? '#16a34a' : '#dc2626' }}
          role="alert"
          aria-live="polite"
        >
          {notification.type === 'success'
            ? <CheckCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
            : <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          }
          <span className="text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Promociones</h2>
          <p className="text-sm text-gray-500 mt-1">Gestioná descuentos y ofertas especiales</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm shadow-sm"
          aria-label="Crear nueva promoción"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Nueva Promoción
        </button>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto animate-[scaleIn_0.2s_ease-out]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Cerrar formulario"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="promo-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre
                </label>
                <input
                  id="promo-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none transition-all"
                  placeholder="Ej: Happy Hour"
                />
              </div>

              <div>
                <label htmlFor="promo-desc" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Descripción
                </label>
                <textarea
                  id="promo-desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none transition-all resize-none"
                  rows={2}
                  placeholder="Describí la promoción..."
                />
              </div>

              <div>
                <label htmlFor="promo-discount" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Porcentaje de descuento
                </label>
                <input
                  id="promo-discount"
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="promo-start" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Fecha inicio
                  </label>
                  <input
                    id="promo-start"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="promo-end" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Fecha fin
                  </label>
                  <input
                    id="promo-end"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="promo-img" className="block text-sm font-medium text-gray-700 mb-1.5">
                  URL de imagen <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  id="promo-img"
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none transition-all"
                  placeholder="https://images.unsplash.com/photo-..."
                />
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Vista previa"
                    className="w-16 h-16 object-cover rounded-xl mt-2 border border-gray-100"
                  />
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 focus:ring-offset-0"
                />
                <span className="text-sm font-medium text-gray-700">Promoción activa</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  <Save className="w-4 h-4 inline mr-1.5" aria-hidden="true" />
                  {editingPromotion ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <TableSkeleton />
      ) : promotions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gift className="w-7 h-7 text-orange-400" aria-hidden="true" />
          </div>
          <p className="text-gray-900 font-semibold">No hay promociones todavía</p>
          <p className="text-sm text-gray-500 mt-1">Creá tu primera promoción para empezar</p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Crear Promoción
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" role="table" aria-label="Lista de promociones">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Promoción
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Descuento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Vigencia
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {promotions.map(promo => (
                  <tr
                    key={promo.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {promo.image_url ? (
                          <img
                            src={promo.image_url}
                            alt={promo.name}
                            className="w-10 h-10 object-cover rounded-xl shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                            <Gift className="w-5 h-5 text-orange-400" aria-hidden="true" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{promo.name}</p>
                          {promo.description && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{promo.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-orange-600">
                        {formatDiscount(promo.discount_percentage)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                      <p>Inicio: {formatDate(promo.start_date)}</p>
                      <p>Fin: {formatDate(promo.end_date)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
                        promo.active !== false
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-50 text-gray-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          promo.active !== false ? 'bg-green-500' : 'bg-gray-400'
                        }`} aria-hidden="true" />
                        {promo.active !== false ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEditForm(promo)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                          aria-label={`Editar ${promo.name}`}
                        >
                          <Edit2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(promo.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          aria-label={`Desactivar ${promo.name}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
