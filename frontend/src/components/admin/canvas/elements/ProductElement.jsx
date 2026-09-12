import React from 'react';

/**
 * ProductElement - renders a menu product item
 */
export function ProductElement({ element, isSelected, isDragging, isResizing }) {
  const config = element.config || {};
  const { 
    name = 'Producto',
    description = '',
    price = '$0.00',
    nameFont = 'system-ui',
    nameSize = 16,
    nameWeight = 'semibold',
    nameColor = '#2A2A2A',
    descFont = 'system-ui',
    descSize = 13,
    descColor = '#666666',
    priceFont = 'system-ui',
    priceSize = 16,
    priceWeight = 'bold',
    priceColor = '#FF6B6B',
    layout = 'horizontal',
    spacing = 16,
    showPrice = true,
  } = config;

  const fontFamilyMap = {
    'system-ui': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Georgia': 'Georgia, serif',
    'Roboto': 'Roboto, sans-serif',
    'Montserrat': 'Montserrat, sans-serif',
    'Playfair Display': '"Playfair Display", serif',
    'Lora': 'Lora, serif',
  };

  const renderHorizontal = () => (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: fontFamilyMap[nameFont] || nameFont,
          fontSize: `${nameSize}px`,
          fontWeight: nameWeight,
          color: nameColor,
          marginBottom: description ? '4px' : '0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {name}
        </div>
        {description && (
          <div style={{
            fontFamily: fontFamilyMap[descFont] || descFont,
            fontSize: `${descSize}px`,
            color: descColor,
            lineHeight: 1.4,
          }}>
            {description}
          </div>
        )}
      </div>
      {showPrice && (
        <div style={{
          fontFamily: fontFamilyMap[priceFont] || priceFont,
          fontSize: `${priceSize}px`,
          fontWeight: priceWeight,
          color: priceColor,
          whiteSpace: 'nowrap',
          marginLeft: `${spacing}px`,
          flexShrink: 0,
        }}>
          {price}
        </div>
      )}
    </div>
  );

  const renderVertical = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <div style={{
        fontFamily: fontFamilyMap[nameFont] || nameFont,
        fontSize: `${nameSize}px`,
        fontWeight: nameWeight,
        color: nameColor,
      }}>
        {name}
      </div>
      {description && (
        <div style={{
          fontFamily: fontFamilyMap[descFont] || descFont,
          fontSize: `${descSize}px`,
          color: descColor,
          lineHeight: 1.4,
        }}>
          {description}
        </div>
      )}
      {showPrice && (
        <div style={{
          fontFamily: fontFamilyMap[priceFont] || priceFont,
          fontSize: `${priceSize}px`,
          fontWeight: priceWeight,
          color: priceColor,
        }}>
          {price}
        </div>
      )}
    </div>
  );

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
            flexDirection: 'column',
            justifyContent: 'flex-start',
            pointerEvents: 'none',
          }}
        >
          {layout === 'horizontal' ? renderHorizontal() : renderVertical()}
        </div>
      </foreignObject>

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

export default ProductElement;