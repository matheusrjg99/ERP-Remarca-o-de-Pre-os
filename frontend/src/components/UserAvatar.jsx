import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Shield } from 'lucide-react';
import RBACManager from './RBACManager';

const UserAvatar = ({ usuarioLogado, onLogout, showName = true, extraAction, userPermissions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [showRBAC, setShowRBAC] = useState(false);
  
  // Verifica se tem permissão de gestor de cargos
  const hasGestaoCargos = userPermissions.includes('admin.gestao_cargos') || 
                          userPermissions.some(p => p === 'admin.gestao_cargos' || (p.codigo && p.codigo === 'admin.gestao_cargos'));
  
  useEffect(() => {
    console.log('🔍 UserAvatar: Permissões recebidas:', userPermissions);
    console.log('🔍 UserAvatar: Tem gestão de cargos?', hasGestaoCargos);
  }, [userPermissions, hasGestaoCargos]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(!isOpen);
  };

  const inicial = usuarioLogado?.charAt(0).toUpperCase() || 'U';

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`flex items-center group focus:outline-none ${showName ? 'gap-3' : ''}`}
        title={!showName ? usuarioLogado : undefined}
      >
        <div className="w-8 h-8 rounded-full bg-[#121215] flex items-center justify-center border border-white/10 shadow-inner group-hover:border-white/20 transition-colors relative">
          <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-300">
            {inicial}
          </span>
          {hasGestaoCargos && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-[#121215]" title="Administrador com acesso à gestão de cargos"></span>
          )}
        </div>
        
        {showName && (
          <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors capitalize">
            {usuarioLogado}
          </span>
        )}
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-48 bg-[#121215] border border-white/10 rounded-lg shadow-xl z-[9999]"
          style={{ top: `${dropdownPosition.top}px`, right: `${dropdownPosition.right}px` }}
        >
          {!showName && (
            <div className="px-4 py-2 border-b border-white/10">
              <span className="text-xs text-zinc-500"></span>
              <p className="text-sm text-zinc-300 truncate capitalize">{usuarioLogado}</p>
            </div>
          )}
          
          {/* Botão discreto de Gestão de Acessos - só aparece para admins */}
          {hasGestaoCargos && (
            <button
              onClick={() => {
                setIsOpen(false);
                setShowRBAC(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-blue-400 hover:bg-white/5 transition-colors border-b border-white/10"
              title="Gestão de Cargos e Permissões"
            >
              <Settings size={16} className="text-blue-500"/>
              <span className="text-xs">Configurações de Acesso</span>
            </button>
          )}
          
          {extraAction && (
            <button
              onClick={() => {
                setIsOpen(false);
                extraAction.onClick();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/10"
              title={extraAction.title}
            >
              {extraAction.icon}
              {extraAction.label}
            </button>
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
        </div>,
        document.body
      )}

      {showRBAC && <RBACManager onClose={() => setShowRBAC(false)} />}
    </>
  );
};

export default UserAvatar;
