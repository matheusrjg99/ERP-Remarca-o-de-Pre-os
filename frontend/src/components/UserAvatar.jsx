import { useState, useRef, useEffect } from 'react';

const UserAvatar = ({ usuarioLogado, onLogout, showName = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const inicial = usuarioLogado?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar - Clicável */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center group focus:outline-none ${showName ? 'gap-3' : ''}`}
        title={!showName ? usuarioLogado : undefined}
      >
        <div className="w-8 h-8 rounded-full bg-[#121215] flex items-center justify-center border border-white/10 shadow-inner group-hover:border-white/20 transition-colors">
          <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-300">
            {inicial}
          </span>
        </div>
        
        {/* Nome - Renderizado condicionalmente */}
        {showName && (
          <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors capitalize">
            {usuarioLogado}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#121215] border border-white/10 rounded-lg shadow-xl overflow-hidden z-30">
          {/* Exibe o nome no dropdown quando showName=false */}
          {!showName && (
            <div className="px-4 py-2 border-b border-white/10">
              <span className="text-xs text-zinc-500">Logado como</span>
              <p className="text-sm text-zinc-300 truncate capitalize">{usuarioLogado}</p>
            </div>
          )}
          
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair
          </button>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;