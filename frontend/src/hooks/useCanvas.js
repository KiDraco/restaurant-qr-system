/* eslint-disable */
import { useState, useCallback, useMemo } from 'react';

const DEFAULT_CANVAS_CONFIG = {
  page_format: 'A4-portrait',
  background_config: { type: 'color', value: '#FFFFFF' },
  grid: { enabled: true, size: 8 },
};

export const PAGE_DIMENSIONS = {
  'A4-portrait': { width: 794, height: 1123 },
  'A4-landscape': { width: 1123, height: 794 },
  Letter: { width: 816, height: 1056 },
};

export const DEFAULT_ELEMENT_CONFIG = {
  image: {
    src: '',
    alt: '',
    width: 300,
    height: 200,
    borderRadius: 0,
    opacity: 1,
    objectFit: 'cover',
    scale: 1,
    crop: { x: 0, y: 0, width: 1, height: 1 },
  },
  text: {
    content: 'Nuevo texto',
    fontFamily: 'system-ui',
    fontSize: 16,
    fontWeight: 'normal',
    color: '#2A2A2A',
    textAlign: 'left',
    lineHeight: 1.5,
    letterSpacing: 'normal',
    width: 200,
  },
  category: {
    title: 'Categoría',
    fontFamily: 'system-ui',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    textAlign: 'left',
    separator: true,
    separatorColor: '#FF6B6B',
    separatorWidth: 2,
    separatorStyle: 'solid',
    paddingTop: 16,
    paddingBottom: 8,
  },
  product: {
    name: 'Producto',
    description: '',
    price: '$0.00',
    nameFont: 'system-ui',
    nameSize: 16,
    nameWeight: 'semibold',
    nameColor: '#2A2A2A',
    descFont: 'system-ui',
    descSize: 13,
    descColor: '#666666',
    priceFont: 'system-ui',
    priceSize: 16,
    priceWeight: 'bold',
    priceColor: '#FF6B6B',
    layout: 'horizontal',
    spacing: 16,
    showPrice: true,
  },
  separator: {
    color: '#FF6B6B',
    width: 2,
    style: 'solid',
    length: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  decorative: {
    kind: 'divider-icon',
    src: '',
    color: '#FF6B6B',
    width: 48,
    height: 48,
    opacity: 1,
    rotation: 0,
  },
  logo: {
    src: '',
    alt: 'Logo',
    width: 120,
    height: 120,
    borderRadius: 0,
    opacity: 1,
    linkUrl: '',
  },
};

function getDefaultPosition(existingElements, canvasWidth, canvasHeight) {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const stagger = existingElements.length * 30;
  return {
    x: Math.max(20, Math.min(centerX - 150 + stagger, canvasWidth - 320)),
    y: Math.max(20, Math.min(centerY - 100 + stagger, canvasHeight - 220)),
  };
}

export function useCanvas() {
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [canvasConfig, setCanvasConfigState] = useState({
    page_format: 'A4-portrait',
    background_config: { type: 'color', value: '#FFFFFF' },
    grid: { enabled: true, size: 8 },
  });

  const canvasSize = useMemo(() => {
    const format = canvasConfig.page_format || 'A4-portrait';
    return PAGE_DIMENSIONS[format] || PAGE_DIMENSIONS['A4-portrait'];
  }, [canvasConfig.page_format]);

  const setCanvasConfig = useCallback((updates) => {
    setCanvasConfigState(prev => ({ ...prev, ...updates }));
  }, []);

  const selectElement = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const addElement = useCallback((type, configOverrides = {}, customId = null) => {
    const defaults = DEFAULT_ELEMENT_CONFIG[type] || {};
    const position = getDefaultPosition(elements, 794, 1123);
    
    const newElement = {
      id: customId || crypto.randomUUID(),
      type,
      x: configOverrides.x ?? position.x,
      y: configOverrides.y ?? position.y,
      width: configOverrides.width ?? (defaults.width || 200),
      height: configOverrides.height ?? (defaults.height || 100),
      zIndex: elements.length,
      locked: configOverrides.locked || false,
      visible: configOverrides.visible !== false,
      config: { ...defaults, ...configOverrides },
    };

    setElements(prev => [...prev, newElement]);
    return newElement.id;
  }, [elements]);

  const updateElement = useCallback((id, updates) => {
    setElements(prev => prev.map(el => {
      if (el.id !== id) return el;
      
      const updated = { ...el };
      
      if ('x' in updates) updated.x = Math.max(0, Math.min(updates.x, 794 - (el.width || 0)));
      if ('y' in updates) updated.y = Math.max(0, Math.min(updates.y, 1123 - (el.height || 0)));
      if ('width' in updates) updated.width = Math.max(10, Math.min(updates.width, 794 - (el.x || 0)));
      if ('height' in updates) updated.height = Math.max(10, Math.min(updates.height, 1123 - (el.y || 0)));
      if ('zIndex' in updates) updated.zIndex = updates.zIndex;
      if ('locked' in updates) updated.locked = updates.locked;
      if ('visible' in updates) updated.visible = updates.visible;
      if (updates.config) updated.config = { ...updated.config, ...updates.config };
      
      ['x', 'y', 'width', 'height', 'zIndex', 'locked', 'visible'].forEach(key => {
        if (key in updates) updated[key] = updates[key];
      });
      
      return updated;
    }));
  }, []);

  const deleteElement = useCallback((id) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const duplicateElement = useCallback((id) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    const newId = crypto.randomUUID();
    const duplicated = {
      ...element,
      id: newId,
      x: element.x + 20,
      y: element.y + 20,
      zIndex: elements.length,
    };
    
    setElements(prev => [...prev, duplicated]);
    return newId;
  }, [elements]);

  const reorderElements = useCallback((fromIndex, toIndex) => {
    setElements(prev => {
      const newElements = [...prev];
      const [removed] = newElements.splice(fromIndex, 1);
      newElements.splice(toIndex, 0, removed);
      return newElements.map((el, idx) => ({ ...el, zIndex: idx }));
    });
  }, []);

  const moveElementInLayer = useCallback((id, direction) => {
    setElements(prev => {
      const index = prev.findIndex(el => el.id === id);
      if (index === -1) return prev;
      
      let newIndex = index;
      if (direction === 'front') newIndex = prev.length - 1;
      else if (direction === 'back') newIndex = 0;
      else if (direction === 'forward') newIndex = Math.min(index + 1, prev.length - 1);
      else if (direction === 'backward') newIndex = Math.max(index - 1, 0);
      
      if (newIndex === index) return prev;
      
      const newElements = [...prev];
      const [removed] = newElements.splice(index, 1);
      newElements.splice(newIndex, 0, removed);
      return newElements.map((el, idx) => ({ ...el, zIndex: idx }));
    });
  }, []);

  const resetCanvas = useCallback(() => {
    setElements([]);
    setSelectedId(null);
    setCanvasConfigState({
      page_format: 'A4-portrait',
      background_config: { type: 'color', value: '#FFFFFF' },
      grid: { enabled: true, size: 8 },
    });
  }, []);

  const snapToGrid = useCallback((value, gridSize = 8) => {
    return Math.round(value / gridSize) * gridSize;
  }, []);

  return {
    elements,
    selectedId,
    canvasConfig,
    canvasSize: {
      width: 794,
      height: 1123,
    },
    selectElement,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    reorderElements,
    moveElementInLayer,
    setCanvasConfig,
    resetCanvas,
    snapToGrid,
    DEFAULT_ELEMENT_CONFIG,
    PAGE_DIMENSIONS,
  };
}

export default useCanvas;