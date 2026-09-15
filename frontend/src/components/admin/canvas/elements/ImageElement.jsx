import React from 'react';

/**
 * ImageElement - renders an image element on the canvas
 * Note: positioned by parent CanvasElement via translate(x, y) transform
 */
export function ImageElement({ element, isSelected, isDragging, isResizing }) {
  const config = element.config || {};
  const { 
    src, 
    alt = '', 
    borderRadius = 0, 
    opacity = 1, 
    objectFit = 'cover',
  } = config;

  // Placeholder if no image
  if (!src) {
    return (
      <g>
        <rect
          x={0}
          y={0}
          width={element.width}
          height={element.height}
          fill="#F3F4F6"
          stroke="#D1D5DB"
          strokeWidth={2}
          strokeDasharray="8,8"
          rx={borderRadius}
        />
        <text
          x={element.width / 2}
          y={element.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fill="#9CA3AF"
          fontFamily="system-ui"
          pointerEvents="none"
        >
          📷 Imagen
        </text>
        <text
          x={element.width / 2}
          y={element.height / 2 + 20}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fill="#D1D5DB"
          fontFamily="system-ui"
          pointerEvents="none"
        >
          Click para agregar imagen
        </text>
      </g>
    );
  }

  return (
    <image
      x={0}
      y={0}
      width={element.width}
      height={element.height}
      href={src}
      preserveAspectRatio={objectFit === 'cover' ? 'xMidYMid slice' : 'none'}
      opacity={opacity}
      style={{ cursor: element.locked ? 'default' : 'move', borderRadius: `${borderRadius}px`, overflow: 'hidden' }}
    />
  );
}

export default ImageElement;
