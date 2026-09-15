import React, { useRef, useEffect, useMemo } from 'react';
import { CanvasElement } from './CanvasElement';

/**
 * Grid pattern background
 */
function GridPattern({ size, color, enabled }) {
  if (!enabled) return null;
  
  return (
    <defs>
      <pattern id="grid" width={size} height={size} patternUnits="userSpaceOnUse">
        <path d={`M ${size} 0 L 0 0 0 ${size}`} fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />
      </pattern>
    </defs>
  );
}

/**
 * Canvas component - renders the fixed-size page with background, grid, and elements
 */
export function Canvas({ 
  elements, 
  selectedId, 
  canvasConfig, 
  canvasSize,
  onSelectElement, 
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElements,
}) {
  const canvasRef = useRef(null);
  const format = canvasConfig.page_format || 'mobile-portrait';
  const dimensions = canvasSize || { width: 375, height: 667 };
  const background = canvasConfig.background_config || { type: 'color', value: '#FFFFFF' };
  const grid = canvasConfig.grid || { enabled: true, size: 8 };

  // Background style
  const backgroundStyle = useMemo(() => {
    switch (background.type) {
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${background.value?.from || '#FF6B6B'}, ${background.value?.to || '#4ECDC4'})`,
        };
      case 'image':
        return {
          backgroundImage: `url(${background.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      case 'color':
      default:
        return { backgroundColor: background.value || '#FFFFFF' };
    }
  }, [background]);

  // Handle click on canvas background to deselect
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      // Deselect when clicking empty space
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center min-h-screen"
      onClick={handleCanvasClick}
    >
      {/* Page shadow wrapper */}
      <div className="shadow-2xl relative">
        {/* Actual canvas/page */}
        <svg
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            ...backgroundStyle,
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
          }}
          className="shadow-2xl"
        >
          {/* Grid pattern */}
          <GridPattern size={canvasConfig.grid?.size || 8} color="#999" enabled={canvasConfig.grid?.enabled} />
          
          {/* Background rectangle (for click detection) */}
          <rect
            width="100%"
            height="100%"
            fill="transparent"
            pointerEvents="all"
          />
          
          {/* Elements rendered in z-index order */}
          {elements
            .slice()
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map(element => (
              <CanvasElement
                key={element.id}
                element={element}
                isSelected={element.id === selectedId}
                onSelect={onSelectElement}
                onUpdate={onUpdateElement}
                onDelete={onDeleteElement}
                onDuplicate={onDuplicateElement}
              />
            ))}
          
          {/* Safe area guides */}
          <g stroke="#FF6B6B" strokeWidth="1" strokeDasharray="5,5" opacity="0.3">
            <rect x={40} y={40} width={dimensions.width - 80} height={dimensions.height - 80} fill="none" />
          </g>
        </svg>
      </div>
      
      {/* Page size indicator */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
        {format} ({dimensions.width} × {dimensions.height}px)
      </div>
    </div>
  );
}

export default Canvas;