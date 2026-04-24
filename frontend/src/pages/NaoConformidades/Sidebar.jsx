import React from 'react';
import { Menu, X, LayoutDashboard, UserPlus, Users } from 'lucide-react';

const Sidebar = ({ aberta, setAberta, abaAtiva, setAbaAtiva }) => {
  return (
    <aside className={`${aberta ? 'w-64' : 'w-20'} hidden md:flex flex-col bg-[#141414] border-r border-[#2A2A2A] transition-all duration-300 p-4 sticky top-0 h-screen z-50`}>
      <button onClick={() => setAberta(!aberta)} className="p-3 hover:bg-[#2A2A2A] rounded-xl mb-10 self-end text-[#3B8ED0]">
        {aberta ? <X size={20}/> : <Menu size={20}/>}
      </button>
      
      <nav className="space-y-4 flex-1">
        <button onClick={() => setAbaAtiva('consulta')} className={`flex items-center gap-4 p-3 rounded-xl w-full transition-all ${abaAtiva === 'consulta' ? 'bg-[#3B8ED0] text-white shadow-lg shadow-[#3B8ED0]/20' : 'text-[#888888] hover:bg-[#2A2A2A] hover:text-white'}`}>
          <LayoutDashboard size={24} /> {aberta && <span className="font-bold uppercase text-[10px] tracking-widest">Registros</span>}
        </button>
        <button onClick={() => setAbaAtiva('novo')} className={`flex items-center gap-4 p-3 rounded-xl w-full transition-all ${abaAtiva === 'novo' ? 'bg-[#3B8ED0] text-white shadow-lg shadow-[#3B8ED0]/20' : 'text-[#888888] hover:bg-[#2A2A2A] hover:text-white'}`}>
          <UserPlus size={24} /> {aberta && <span className="font-bold uppercase text-[10px] tracking-widest">Lançar Erro</span>}
        </button>
        <button onClick={() => setAbaAtiva('equipe')} className={`flex items-center gap-4 p-3 rounded-xl w-full transition-all ${abaAtiva === 'equipe' ? 'bg-[#3B8ED0] text-white shadow-lg shadow-[#3B8ED0]/20' : 'text-[#888888] hover:bg-[#2A2A2A] hover:text-white'}`}>
          <Users size={24} /> {aberta && <span className="font-bold uppercase text-[10px] tracking-widest">Equipe</span>}
        </button>
      </nav>

      {/* ASSINATURA */}
      {aberta && (
        <div className="p-4 border-t border-[#2A2A2A] animate-in fade-in duration-700">
          <p className="text-[9px] uppercase tracking-[0.3em] text-slate-600 font-bold">Desenvolvido por:</p>
          <p className="text-xs font-black text-slate-400 mt-1 italic tracking-tight">Matheus Gomes</p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;