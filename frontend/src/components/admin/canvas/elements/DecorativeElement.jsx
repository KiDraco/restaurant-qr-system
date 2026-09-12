import React from 'react';

/**
 * DecorativeElement - renders decorative flourishes, icons, dividers
 */
export function DecorativeElement({ element, isSelected, isDragging, isResizing }) {
  const config = element.config || {};
  const { 
    kind = 'divider-icon',
    src = '',
    color = '#FF6B6B',
    width = 48,
    height = 48,
    opacity = 1,
    rotation = 0,
  } = config;

  // Built-in decorative SVGs
  const decorativeSVGs = {
    'divider-icon': (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    ),
    'flourish': (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    'corner-accent': (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12V2h10" />
        <path d="M22 12V2H14" />
        <path d="M2 22V14h10" />
        <path d="M22 22V14H14" />
      </svg>
    ),
  };

  const content = kind === 'custom-svg' && src 
    ? <image x={0} y={0} width={width} height={height} href={src} opacity={opacity} />
    : decorativeSVGs[kind] || decorativeSVGs['divider-icon'];

  return (
    <g transform={`translate(${element.width / 2}, ${element.height / 2}) rotate(${rotation}) translate(${-element.width / 2}, ${-element.height / 2})`}>
      <g 
        transform={`translate(${(element.width - width) / 2}, ${(element.height - height) / 2})`}
        opacity={opacity}
      >
        {React.cloneElement(content, { width, height })}
      </g>
      
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

export default DecorativeElement;