import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, ArrowRight, Check, AlertTriangle, X } from 'lucide-react';
import api from '../../services/api';

const STEPS = ['Archivo', 'Mapeo', 'Vista Previa', 'Resultado'];

export default function MenuImportWizard({ onClose, onImported }) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [mapping, setMapping] = useState({ name: '', price: '', category: '', description: '' });
  const [rows, setRows] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFileSelect = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.name.match(/\.xlsx?$/i)) {
      setError('Solo archivos .xlsx o .xls');
      return;
    }

    setError('');
    setFile(selected);
    setLoading(true);

    try {
      const data = await api.importMenuParse(selected);
      if (!data.columns || data.columns.length === 0) {
        setError('No se pudieron leer columnas del archivo');
        setLoading(false);
        return;
      }
      setParsed(data);
      setMapping({
        name: data.suggestions?.name || '',
        price: data.suggestions?.price || '',
        category: data.suggestions?.category || '',
        description: data.suggestions?.description || '',
      });
      setRows(data.preview);
    } catch (err) {
      setError('Error al leer el archivo');
    }

    setLoading(false);
  };

  const isMappingValid = () => mapping.name && mapping.price && mapping.category;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await api.importMenuConfirm(mapping, rows);
      setResult(res);
      setStep(3);
    } catch (err) {
      setError('Error al importar');
    }
    setLoading(false);
  };

  const handleDone = () => {
    if (onImported) onImported();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-orange-600" />
            Importar Menú desde Excel
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className={`flex items-center gap-2 ${i <= step ? 'text-orange-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i < step ? 'bg-orange-600 text-white' :
                    i === step ? 'bg-orange-100 text-orange-600 border-2 border-orange-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px ${i < step ? 'bg-orange-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 0 && (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-orange-400 transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {file ? file.name : 'Hacé clic para seleccionar un archivo'}
              </p>
              <p className="text-sm text-gray-500">Formatos: .xlsx, .xls</p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              {loading && (
                <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto" />
              )}
            </div>
          )}

          {step === 1 && parsed && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Asigná cada columna del Excel al campo correspondiente:
              </p>
              {[
                { key: 'name', label: 'Nombre del producto', required: true },
                { key: 'price', label: 'Precio', required: true },
                { key: 'category', label: 'Categoría', required: true },
                { key: 'description', label: 'Descripción', required: false },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                    <span className="text-gray-500 ml-1">({parsed.columns.length} columnas detectadas)</span>
                  </label>
                  <select
                    value={mapping[field.key]}
                    onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar columna...</option>
                    {parsed.columns.map((col) => (
                      <option key={col.key} value={col.key}>
                        {col.label} (ej: {col.sample})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Vista previa de los primeros {rows.length} items. Revisá y corregí antes de importar.
              </p>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                        {['name', 'price', 'category', 'description'].map((field) => (
                          <td key={field} className="px-3 py-2">
                            <input
                              value={row[mapping[field]] ?? ''}
                              onChange={(e) => {
                                const updated = [...rows];
                                updated[i] = { ...updated[i], [mapping[field]]: e.target.value };
                                setRows(updated);
                              }}
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {parsed?.totalRows ? `${Math.min(rows.length, parsed.totalRows)} de ${parsed.totalRows} filas` : ''}
              </p>
            </div>
          )}

          {step === 3 && result && (
            <div className="text-center py-8">
              {result.errors?.length > 0 ? (
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              ) : (
                <Check className="w-16 h-16 mx-auto mb-4 text-green-500" />
              )}
              <h4 className="text-xl font-bold text-gray-900 mb-2">Importación completada</h4>
              <div className="space-y-2 text-gray-600">
                <p>✅ {result.imported} productos importados</p>
                {result.skipped > 0 && <p>⚠️ {result.skipped} filas omitidas (datos incompletos)</p>}
                {result.errors?.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg text-left text-sm">
                    <p className="font-medium text-red-700 mb-2">Errores:</p>
                    {result.errors.map((e, i) => (
                      <p key={i} className="text-red-600">Fila {e.row}: {e.name} - {e.error}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <div className="flex gap-2">
            {step === 0 && parsed && (
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Siguiente <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!isMappingValid()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Vista Previa <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {step === 2 && !loading && (
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Importar {rows.length} productos <Check className="w-4 h-4" />
              </button>
            )}
            {step === 2 && loading && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
            )}
            {step === 3 && (
              <button
                onClick={handleDone}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Finalizar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
