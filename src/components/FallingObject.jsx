import React from 'react';

function FallingObject({ x, y, size, caught, shape = 'circle', color = 'var(--accent)' }) {
  const wrapperStyle = {
    position: 'absolute',
    transform: `translate(${Math.round(x)}px, ${Math.round(y)}px)`,
    willChange: 'transform',
  };
  const isStar = shape === 'star';
  const innerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    background: color,
    borderRadius: shape === 'circle' ? '50%' : isStar ? '0' : '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
    clipPath: isStar
      ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
      : 'none',
  };
  const cls = `falling-object${caught ? ' caught' : ''}`;
  return (
    <div style={wrapperStyle} aria-label="falling-object">
      <div className={cls} style={innerStyle} />
    </div>
  );
}

export default FallingObject;