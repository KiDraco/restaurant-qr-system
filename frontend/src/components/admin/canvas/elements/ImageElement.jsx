import React from 'react';

/**
 * ImageElement - renders an image element on the canvas
 */
export function ImageElement({ element, isSelected, isDragging, isResizing }) {
  const config = element.config || {};
  const { 
    src, 
    alt = '', 
    borderRadius = 0, 
    opacity = 1, 
    objectFit = 'cover',
    scale = 1,
    crop,
  } = config;

  const style = {
    width: element.width,
    height: element.height,
    borderRadius: `${borderRadius}px`,
    opacity,
    overflow: 'hidden',
    cursor: element.locked ? 'default' : 'move',
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit,
    objectPosition: crop ? `${crop.x * 100}% ${crop.y * 100}%` : 'center',
    transform: crop && crop.width ? `scale(${1 / (crop.width || 1)})` : 'none',
    transformOrigin: crop ? `${crop.x * 100}% ${crop.y * 100}%` : 'center',
  };

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
      style={style}
      preserveAspectRatio={config.objectFit === 'cover' ? 'xMidYMid slice' : 'none'}
      opacity={config.opacity}
    />
  );
}

export default ImageElement;