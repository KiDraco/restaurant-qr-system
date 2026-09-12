import React from 'react';

/**
 * TextElement - renders a text element on the canvas
 */
export function TextElement({ element, isSelected, isDragging, isResizing }) {
  const config = element.config || {};
  const { 
    content = 'Nuevo texto',
    fontFamily = 'system-ui',
    fontSize = 16,
    fontWeight = 'normal',
    color = '#2A2A2A',
    textAlign = 'left',
    lineHeight = 1.5,
    letterSpacing = 'normal',
    width,
  } = config;

  const lines = content.split('\n');
  const lineHeightPx = fontSize * lineHeight;
  const totalHeight = lines.length * lineHeightPx;

  const fontFamilyMap = {
    'system-ui': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Georgia': 'Georgia, serif',
    'Roboto': 'Roboto, sans-serif',
    'Montserrat': 'Montserrat, sans-serif',
    'Playfair Display': '"Playfair Display", serif',
    'Lora': 'Lora, serif',
  };

  return (
    <g>
      <foreignObject
        x={0}
        y={0}
        width={element.width}
        height={element.height}
        style={{ overflow: 'visible' }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
            fontFamily: fontFamilyMap[fontFamily] || fontFamily,
            fontSize: `${fontSize}px`,
            fontWeight: fontWeight,
            color: color,
            lineHeight: lineHeight,
            letterSpacing: letterSpacing,
            textAlign: textAlign,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          {content}
        </div>
      </foreignObject>
      
      {/* Text bounds outline when selected */}
      <rect
        x={0}
        y={0}
        width={element.width}
        height={element.height}
        fill="none"
        stroke="transparent"
        pointerEvents="none"
      />
    </g>
  );
}

export default TextElement;