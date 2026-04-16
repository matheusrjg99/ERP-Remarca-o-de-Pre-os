import React, { useState } from 'react';

// 1. Adicionamos 'estiloHeader' às props
export default function ResizableHeader({ 
  label, 
  sortKey, 
  sortable, 
  currentSort, 
  requestSort, 
  initialWidth, 
  align, 
  userId,
  estiloHeader
}) {
  const cacheKey = `${userId}_col_width_${sortKey}`;
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(cacheKey);
    return saved ? parseInt(saved, 10) : initialWidth;
  });

  const startResize = (e) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.pageX; const startWidth = width;
    
    const doDrag = (e) => setWidth(Math.max(40, startWidth + e.pageX - startX));
    
    const stopDrag = (e) => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
      localStorage.setItem(cacheKey, Math.max(40, startWidth + e.pageX - startX));
    };
    
    //document.addEventListener('mousemove', handleMouseMove); // Note: Ajuste para doDrag se necessário
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  // 2. Montamos o objeto de estilo mesclando o redimensionamento com a personalização
  const dynamicStyle = {
    width,
    minWidth: width,
    maxWidth: width,
    // Se houver cor no estiloHeader usa ela, senão usa o padrão antigo
    backgroundColor: estiloHeader?.bg || '#18181b', 
    color: estiloHeader?.text || '#a1a1aa', // zinc-400
    fontSize: estiloHeader?.size ? `${estiloHeader.size}px` : '10px'
  };

  return (
    <th
      style={dynamicStyle}
      // 3. Removemos bg-[#18181b], text-zinc-400 e text-[10px] das classes abaixo
      className="relative py-3 px-2 border-b border-zinc-800 uppercase font-semibold tracking-wider select-none group transition-colors"
    >
      <div className={`flex items-center gap-1.5 overflow-hidden ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        <span 
          className={`truncate ${sortable ? 'cursor-pointer hover:opacity-80' : ''} transition-all`}
          onClick={() => sortable && requestSort && requestSort(sortKey)}
        >
          {label}
        </span>
        
        {sortable && (
          <span className={`text-[10px] ${currentSort?.key === sortKey ? 'text-blue-500 opacity-100' : 'opacity-0 group-hover:opacity-40'}`} style={{ color: currentSort?.key === sortKey ? '' : 'inherit' }}>
            {currentSort?.direction === 'desc' ? '▼' : '▲'}
          </span>
        )}
      </div>

      {/* Alça de redimensionamento */}
      <div 
        onMouseDown={startResize} 
        onClick={(e) => e.stopPropagation()} 
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 z-10 opacity-0 hover:opacity-100 transition-opacity" 
      />
    </th>
  );
}