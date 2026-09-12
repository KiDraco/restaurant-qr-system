import React from 'react';

/**
 * LogoElement - renders a logo/branding image
 */
export function LogoElement({ element, isSelected, isDragging, isResizing }) {
  const config = element.config || {};
  const { 
    src = '',
    alt = 'Logo',
    borderRadius = 0,
    opacity = 1,
    linkUrl = '',
  } = config;

  const style = {
    width: element.width,
    height: element.height,
    borderRadius: `${borderRadius}px`,
    opacity,
    overflow: 'hidden',
    cursor: element.locked ? 'default' : 'move',
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
          y={element.height / 2 - 10} 
          textAnchor="middle" 
          dominantBaseline="middle"
          fontSize="24"
          fill="#9CA3AF"
          pointerEvents="none"
        >
          🏷️
        </text>
        <text 
          x={element.width / 2} 
          y={element.height / 2 + 20} 
          textAnchor="middle" 
          dominantBaseline="middle"
          fontSize="12"
          fill="#D1D5DB"
          fontFamily="system-ui"
          pointerEvents="none"
        >
          Logo
        </text>
      </g>
    );
  }

  return (
    <g>
      {linkUrl ? (
        <a xlinkHref={linkUrl} target="_blank" rel="noopener noreferrer">
          <image
            x={0}
            y={0}
            width={element.width}
            height={element.height}
            href={src}
            style={{
              width: element.width,
              height: element.height,
              borderRadius: `${borderRadius}px`,
              opacity: config.opacity,
              objectFit: 'cover',
            }}
            preserveAspectRatio="xMidYMid slice"
          />
        </a>
      ) : (
        <image
          x={0}
          y={0}
          width={element.width}
          height={element.height}
          href={src}
          style={{
            width: element.width,
            height: element.height,
            borderRadius: `${borderRadius}px`,
            opacity: config.opacity,
            objectFit: 'cover',
          }}
          preserveAspectRatio="xMidYMid slice"
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

export default LogoElement;