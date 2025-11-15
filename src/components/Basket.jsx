import React from 'react';

function Basket({ x, width, height, variant = 'classic' }) {
  const base = {
    position: 'absolute',
    bottom: '0px',
    width: `${width}px`,
    height: `${height}px`,
    transform: `translateX(${Math.round(x)}px)`,
    willChange: 'transform',
  };
  const variants = {
    classic: {
      background: 'linear-gradient(180deg, #ff9e2c, #ff7a00)',
      border: '2px solid #ffffff20',
      borderRadius: '8px 8px 2px 2px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
    },
    neon: {
      background: 'linear-gradient(90deg, #2d6cdf, #6a5acd)',
      borderRadius: '12px 12px 4px 4px',
      boxShadow: '0 0 12px rgba(45,108,223,0.6)',
    },
    dark: {
      background: 'linear-gradient(180deg, #444, #222)',
      borderRadius: '10px 10px 3px 3px',
      boxShadow: '0 6px 12px rgba(0,0,0,0.6)',
    },
    glass: {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.35))',
      border: '1px solid rgba(255,255,255,0.5)',
      backdropFilter: 'blur(2px)',
      borderRadius: '12px 12px 4px 4px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    },
  };
  const style = { ...base, ...(variants[variant] || variants.classic) };
  return <div className="basket" style={style} aria-label="basket" />;
}

export default Basket;