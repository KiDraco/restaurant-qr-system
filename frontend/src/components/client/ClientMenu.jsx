import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft, List, LayoutGrid, UtensilsCrossed,
  Check, Search, Star, X, Loader2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function ItemSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
      <div className="h-32 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-5 bg-gray-100 rounded-full w-1/4" />
          <div className="h-8 w-16 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-lg mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-gray-100 rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 bg-gray-100 rounded-full w-24 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded-full w-16 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <ItemSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}

export default function ClientMenu({ tableNumber, bill, onOrder, onBack, formatPrice }) {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(null);
  const [orderMessage, setOrderMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadedImages, setLoadedImages] = useState(new Set());
  const carouselRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const searchRef = useRef(null);

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

  // Focus search on Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredItems = useMemo(() => {
    let items = selectedCategory === 'all'
      ? menuItems
      : menuItems.filter(item => item.category === selectedCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
      );
    }

    return items;
  }, [menuItems, selectedCategory, searchQuery]);

  // Mark first item per category as "popular" for demo
  const popularItems = useMemo(() => {
    const seen = new Set();
    const popular = new Set();
    for (const item of menuItems) {
      if (!seen.has(item.category)) {
        seen.add(item.category);
        popular.add(item.id);
      }
    }
    return popular;
  }, [menuItems]);

  const handleOrder = async (itemId) => {
    setOrdering(itemId);
    try {
      const result = await onOrder(itemId);
      if (result && result.success) {
        setOrderMessage({ type: 'success', text: '¡Agregado a tu cuenta!' });
      } else {
        setOrderMessage({ type: 'error', text: result?.error || 'Error al agregar' });
      }
    } catch {
      setOrderMessage({ type: 'error', text: 'Error de conexión' });
    }
    setTimeout(() => {
      setOrderMessage(null);
      setOrdering(null);
    }, 2000);
  };

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, children } = carouselRef.current;
    if (!children.length) return;
    const slideWidth = children[0].offsetWidth || 1;
    setCurrentSlide(Math.round(scrollLeft / slideWidth));
  };

  const handleCarouselKeyDown = (e) => {
    if (!carouselRef.current) return;
    const slideWidth = carouselRef.current.children[0]?.offsetWidth || 300;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      carouselRef.current.scrollBy({ left: slideWidth, behavior: 'smooth' });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      carouselRef.current.scrollBy({ left: -slideWidth, behavior: 'smooth' });
    }
  };

  const handleImageLoad = (id) => {
    setLoadedImages(prev => new Set(prev).add(id));
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Toast notification */}
      {orderMessage && (
        <div
          className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-white backdrop-blur-sm animate-[slideDown_0.3s_ease-out]"
          style={{
            backgroundColor: orderMessage.type === 'success' ? '#16a34a' : '#dc2626'
          }}
          role="alert"
          aria-live="polite"
        >
          {orderMessage.type === 'success' ? (
            <Check className="w-5 h-5 shrink-0" aria-hidden="true" />
          ) : null}
          <span className="text-sm font-medium">{orderMessage.text}</span>
          <button
            onClick={() => setOrderMessage(null)}
            className="ml-auto p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-lg mx-auto pb-24">
        {/* Sticky header */}
        <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-40">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Volver al inicio"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Menú</h1>
              <p className="text-xs text-gray-500">Mesa {tableNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total consumido</p>
              <p className="text-sm font-bold text-green-600">
                {formatPrice(bill?.totalAmount)}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en el menú…"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-100 border border-transparent rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                aria-label="Buscar productos del menú"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-200 transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Promotions banner */}
        {promotions.length > 0 && (
          <div className="px-4 mt-4 overflow-x-auto scrollbar-hide" role="region" aria-label="Promociones activas">
            <div className="flex gap-3 pb-2">
              {promotions.map(promo => (
                <div
                  key={promo.id}
                  className="flex-shrink-0 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl p-4 min-w-[180px] shadow-lg shadow-orange-500/20"
                  aria-label={`Promoción: ${promo.name}, ${promo.discount_percentage}% de descuento`}
                >
                  <p className="text-2xl font-bold tracking-tight">{promo.discount_percentage}% OFF</p>
                  <p className="text-sm font-medium mt-1 text-white/90">{promo.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category tabs */}
        <div className="px-4 mt-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-2" role="tablist" aria-label="Categorías del menú">
            <button
              onClick={() => setSelectedCategory('all')}
              role="tab"
              aria-selected={selectedCategory === 'all'}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                role="tab"
                aria-selected={selectedCategory === cat}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center justify-between px-4 mt-3">
          <div
            className="flex bg-white rounded-xl border border-gray-200 p-0.5 shadow-sm"
            role="radiogroup"
            aria-label="Modo de visualización"
          >
            <button
              onClick={() => setViewMode('list')}
              role="radio"
              aria-checked={viewMode === 'list'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <List className="w-4 h-4" aria-hidden="true" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('carousel')}
              role="radio"
              aria-checked={viewMode === 'carousel'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'carousel'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" aria-hidden="true" />
              Carrusel
            </button>
          </div>

          {searchQuery && (
            <p className="text-xs text-gray-500">
              {filteredItems.length} resultado{filteredItems.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Items */}
        <div className="px-4 mt-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {searchQuery ? (
                  <Search className="w-7 h-7 text-gray-400" aria-hidden="true" />
                ) : (
                  <UtensilsCrossed className="w-7 h-7 text-gray-400" aria-hidden="true" />
                )}
              </div>
              <p className="text-gray-900 font-semibold">
                {searchQuery ? 'Sin resultados' : 'No hay productos'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery
                  ? 'Probá con otro término de búsqueda'
                  : 'No hay productos disponibles en esta categoría'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : viewMode === 'list' ? (
            <div className="grid grid-cols-2 gap-3" role="list" aria-label="Lista de productos">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                  role="listitem"
                >
                  <div className="relative">
                    {item.image_url ? (
                      <>
                        <div className={`absolute inset-0 bg-gray-100 transition-opacity duration-300 ${loadedImages.has(item.id) ? 'opacity-0' : 'opacity-100'}`} />
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className={`w-full h-32 object-cover transition-opacity duration-300 ${loadedImages.has(item.id) ? 'opacity-100' : 'opacity-0'}`}
                          onLoad={() => handleImageLoad(item.id)}
                          loading="lazy"
                        />
                      </>
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                        <UtensilsCrossed className="w-8 h-8 text-orange-200" aria-hidden="true" />
                      </div>
                    )}

                    {/* Category badge */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-sm">
                      {item.category}
                    </span>

                    {/* Popular badge */}
                    {popularItems.has(item.id) && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-amber-400/90 backdrop-blur-sm text-amber-900 rounded-full shadow-sm">
                        <Star className="w-3 h-3" aria-hidden="true" />
                        Popular
                      </span>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-base font-bold text-gray-900">
                        {formatPrice(item.price)}
                      </span>
                      <button
                        onClick={() => handleOrder(item.id)}
                        disabled={ordering === item.id}
                        className="bg-orange-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        aria-label={`Pedir ${item.name}`}
                      >
                        {ordering === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
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
              {/* Carousel */}
              <div
                ref={carouselRef}
                onScroll={handleScroll}
                onKeyDown={handleCarouselKeyDown}
                tabIndex={0}
                role="region"
                aria-label="Productos en carrusel"
                aria-roledescription="carrusel"
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-hide outline-none rounded-2xl"
              >
                {filteredItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="snap-start shrink-0 w-[85vw] max-w-sm bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${item.name}, ${formatPrice(item.price)}`}
                    aria-label={`${item.name}, ${item.description || ''}, ${formatPrice(item.price)}`}
                  >
                    <div className="relative">
                      {item.image_url ? (
                        <>
                          <div className={`absolute inset-0 bg-gray-100 transition-opacity duration-300 ${loadedImages.has(item.id) ? 'opacity-0' : 'opacity-100'}`} />
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className={`w-full h-52 object-cover transition-opacity duration-300 ${loadedImages.has(item.id) ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => handleImageLoad(item.id)}
                            loading="lazy"
                          />
                        </>
                      ) : (
                        <div className="w-full h-52 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                          <UtensilsCrossed className="w-12 h-12 text-orange-200" aria-hidden="true" />
                        </div>
                      )}
                      <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-sm">
                        {item.category}
                      </span>
                      {popularItems.has(item.id) && (
                        <span className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-amber-400/90 backdrop-blur-sm text-amber-900 rounded-full shadow-sm">
                          <Star className="w-3.5 h-3.5" aria-hidden="true" />
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xl font-bold text-orange-600">
                          {formatPrice(item.price)}
                        </span>
                        <button
                          onClick={() => handleOrder(item.id)}
                          disabled={ordering === item.id}
                          className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          aria-label={`Pedir ${item.name}`}
                        >
                          {ordering === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                          ) : (
                            'Pedir'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Carousel dots */}
              {filteredItems.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3" role="tablist" aria-label="Posición del carrusel">
                  {filteredItems.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (carouselRef.current?.children[index]) {
                          carouselRef.current.children[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                        }
                      }}
                      role="tab"
                      aria-selected={index === currentSlide}
                      aria-label={`Ir al slide ${index + 1}`}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentSlide
                          ? 'bg-orange-600 w-6'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}

              {filteredItems.length > 0 && (
                <p className="text-center text-xs text-gray-400 mt-2">
                  Usá las flechas ← → para navegar
                </p>
              )}
            </div>
          )}
        </div>

        {/* Keyboard hint for search */}
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2">
          {!searchQuery && (
            <p className="text-[10px] text-gray-400 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
              <kbd className="font-medium text-gray-600">⌘K</kbd> para buscar
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
