import React, { useState } from 'react';

export default function ResizableHeader({ label, sortKey, sortable, currentSort, requestSort, initialWidth, align, userId }) {
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
    
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  return (
    <th
      style={{ width, minWidth: width, maxWidth: width }}
      className="relative py-3 px-2 border-b border-zinc-800 bg-[#18181b] text-zinc-400 text-[10px] uppercase font-semibold tracking-wider select-none group"
    >
      <div className={`flex items-center gap-1.5 overflow-hidden ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        <span 
          className={`truncate ${sortable ? 'cursor-pointer hover:text-zinc-200' : ''} transition-colors`}
          onClick={() => sortable && requestSort && requestSort(sortKey)}
        >
          {label}
        </span>
        {sortable && (
          <span className={`text-[10px] ${currentSort?.key === sortKey ? 'text-blue-500 opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
            {currentSort?.direction === 'desc' ? '▼' : '▲'}
          </span>
        )}
      </div>
      {/* Alça de redimensionamento invisível */}
      <div onMouseDown={startResize} onClick={(e) => e.stopPropagation()} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 z-10 opacity-0 hover:opacity-100 transition-opacity" />
    </th>
  );
}