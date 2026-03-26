import React from 'react';

export default function ToggleSwitch({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      
      {/* O SEGREDO ESTÁ AQUI: O input invisível que avisa o React da mudança */}
      <input 
        type="checkbox" 
        className="sr-only" /* sr-only esconde o input original do HTML, mas mantém ele funcionando */
        checked={checked} 
        onChange={onChange} 
      />
      
      <div className={`w-8 h-4.5 rounded-full relative transition-colors duration-200 ease-in-out ${checked ? 'bg-blue-600' : 'bg-zinc-700'}`}>
        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      
      <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors text-sm font-medium">
        {label}
      </span>
    </label>
  );
}