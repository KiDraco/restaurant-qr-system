import React from 'react';

/**
 * SeparatorElement - renders a horizontal line separator
 */
export function SeparatorElement({ element, isSelected, isDragging, isResizing }) {
  const config = element.config || {};
  const { 
    color = '#FF6B6B',
    width: lineWidth = 2,
    style: lineStyle = 'solid',
    length = '100%',
    marginTop = 8,
    marginBottom = 8,
  } = config;

  const lineLength = typeof length === 'string' && length.endsWith('%') 
    ? (parseFloat(length) / 100) * element.width 
    : Math.min(Number(length) || element.width, element.width);

  const startX = (element.width - lineLength) / 2;
  const y = element.height / 2;

  const styleMap = {
    solid: 'none',
    dashed: '8,4',
    dotted: '2,4',
    double: '4,2,1,2',
  };

  return (
    <g>
      <line
        x1={startX}
        y1={y}
        x2={startX + lineLength}
        y2={y}
        stroke={color}
        strokeWidth={lineWidth}
        strokeDasharray={styleMap[lineStyle] || 'none'}
        strokeLinecap="round"
      />
      
      {/* Margins visualization when selected */}
      {marginTop > 0 && (
        <line
          x1={startX}
          y1={y - marginTop}
          x2={startX + lineLength}
          y2={y - marginTop}
          stroke="#E5E7EB"
          strokeWidth={1}
          strokeDasharray="4,4"
          opacity={0.5}
        />
      )}
      {marginBottom > 0 && (
        <line
          x1={startX}
          y1={y + marginBottom}
          x2={startX + lineLength}
          y2={y + marginBottom}
          stroke="#E5E7EB"
          strokeWidth={1}
          strokeDasharray="4,4"
          opacity={0.5}
        />
      )}

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

export default SeparatorElement;