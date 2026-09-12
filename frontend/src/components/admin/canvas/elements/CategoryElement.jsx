import React from 'react';

/**
 * CategoryElement - renders a category header with optional separator
 */
export function CategoryElement({ element, isSelected, isDragging, isResizing }) {
  const config = element.config || {};
  const { 
    title = 'Categoría',
    fontFamily = 'system-ui',
    fontSize = 20,
    fontWeight = 'bold',
    color = '#2A2A2A',
    textAlign = 'left',
    separator = true,
    separatorColor = '#FF6B6B',
    separatorWidth = 2,
    separatorStyle = 'solid',
    paddingTop = 16,
    paddingBottom = 8,
  } = config;

  const fontFamilyMap = {
    'system-ui': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Georgia': 'Georgia, serif',
    'Roboto': 'Roboto, sans-serif',
    'Montserrat': 'Montserrat, sans-serif',
    'Playfair Display': '"Playfair Display", serif',
    'Lora': 'Lora, serif',
  };

  const separatorStyleMap = {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
    double: 'double',
  };

  return (
    <g>
      {/* Category title */}
      <foreignObject
        x={0}
        y={paddingTop}
        width={element.width}
        height={40}
        style={{ overflow: 'visible' }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
            fontFamily: fontFamilyMap[fontFamily] || fontFamily,
            fontSize: `${fontSize}px`,
            fontWeight: fontWeight,
            color: color,
            textAlign: textAlign,
            whiteSpace: 'pre-wrap',
            pointerEvents: 'none',
          }}
        >
          {title}
        </div>
      </foreignObject>

      {/* Separator line */}
      {separator && (
        <line
          x1={0}
          y1={paddingTop + 40}
          x2={element.width}
          y2={paddingTop + 40}
          stroke={separatorColor}
          strokeWidth={separatorWidth}
          strokeDasharray={separatorStyleMap[separatorStyle] === 'dashed' ? '8,4' : separatorStyleMap[separatorStyle] === 'dotted' ? '2,4' : separatorStyleMap[separatorStyle] === 'double' ? '4,2,1,2' : 'none'}
        />
      )}

      {/* Category bounds */}
      <rect
        x={0}
        y={0}
        width={element.width}
        height={element.height}
        fill="transparent"
        pointerEvents="none"
      />
    </g>
  );
}

export default CategoryElement;