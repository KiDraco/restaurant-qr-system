import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, List, LayoutGrid, UtensilsCrossed, Check, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export default function ClientMenu({ tableNumber, onOrder, onBack, formatPrice }) {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(null);
  const [orderMessage, setOrderMessage] = useState(null);
  const carouselRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, promosRes] = await Promise.all([
          fetch(`${API_URL}/menu`),
          fetch(`${API_URL}/promotions/active`)
        ]);
        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setMenuItems(menuData);
          const uniqueCategories = [...new Set(menuData.map(item => item.category))].sort();
          setCategories(uniqueCategories);
        }
        if (promosRes.ok) {
          const promosData = await promosRes.json();
          setPromotions(promosData);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  const handleOrder = async (itemId) => {
    setOrdering(itemId);
    try {
      const result = await onOrder(itemId);
      if (result && result.success) {
        setOrderMessage({ type: 'success', text: 'Agregado a tu cuenta!' });
      } else {
        setOrderMessage({ type: 'error', text: result?.error || 'Error al agregar' });
      }
    } catch {
      setOrderMessage({ type: 'error', text: 'Error de conexi\u00f3n' });
    }
    setTimeout(() => {
      setOrderMessage(null);
      setOrdering(null);
    }, 2000);
  };

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const slideWidth = carouselRef.current.children[0]?.offsetWidth || 1;
    const index = Math.round(scrollLeft / slideWidth);
    setCurrentSlide(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
          <p className="text-gray-500">Cargando men&uacute;...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {orderMessage && (
        <div className={`fixed top-4 left-4 right-4 z-50 max-w-md mx-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white ${
          orderMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {orderMessage.type === 'success' ? <Check className="w-5 h-5" /> : null}
          {orderMessage.text}
        </div>
      )}

      <div className="max-w-lg mx-auto pb-8">
        <div className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Men&uacute;</h1>
              <p className="text-sm text-gray-500">Mesa {tableNumber}</p>
            </div>
          </div>
        </div>

        {promotions.length > 0 && (
          <div className="px-4 mt-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 pb-2">
              {promotions.map(promo => (
                <div
                  key={promo.id}
                  className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl p-3 min-w-[160px]"
                >
                  <div className="text-lg font-bold">{promo.discount_percentage}% OFF</div>
                  <div className="text-sm font-medium opacity-90">{promo.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 mt-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 mt-2">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1 w-fit">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="w-4 h-4" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('carousel')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'carousel'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Carrusel
            </button>
          </div>
        </div>

        <div className="px-4 mt-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No hay productos en esta categor&iacute;a</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="relative">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                        <UtensilsCrossed className="w-8 h-8 text-orange-300" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-white bg-opacity-90 text-gray-700 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{item.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-orange-600">{formatPrice(item.price)}</span>
                      <button
                        onClick={() => handleOrder(item.id)}
                        disabled={ordering === item.id}
                        className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
                      >
                        {ordering === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Pedir'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div
                ref={carouselRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-hide"
              >
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="snap-start shrink-0 w-[85vw] max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden"
                  >
                    <div className="relative">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                          <UtensilsCrossed className="w-12 h-12 text-orange-300" />
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-3 py-1 text-xs font-medium bg-white bg-opacity-90 text-gray-700 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="text-2xl font-bold text-gray-900">{item.name}</h3>
                      <p className="text-gray-600 mt-1">{item.description}</p>
                      <div className="text-2xl font-bold text-orange-600 mt-3">
                        {formatPrice(item.price)}
                      </div>
                      <button
                        onClick={() => handleOrder(item.id)}
                        disabled={ordering === item.id}
                        className="w-full mt-4 bg-orange-600 text-white rounded-xl py-3 font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
                      >
                        {ordering === item.id ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                          'Pedir'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {filteredItems.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-2">
                  {filteredItems.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentSlide ? 'bg-orange-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
