import React from 'react';

export default function LogoSophon({ className = "w-32 h-auto text-zinc-100" }) {
  return (
    <svg
      viewBox="0 0 360 100" // A lente agora corta exatamente no final do "n"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Símbolo alinhado perfeitamente na borda esquerda */}
      <circle cx="45" cy="50" r="34" stroke="currentColor" strokeWidth="8" />
      <circle cx="45" cy="50" r="14" fill="currentColor" />
      
      {/* Texto alinhado mais próximo do símbolo para dar balanço */}
      <text
        x="95"
        y="70"
        fill="currentColor"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="66"
        fontWeight="500"
        letterSpacing="-1.5"
      >
        Sophon
      </text>
    </svg>
  );
}