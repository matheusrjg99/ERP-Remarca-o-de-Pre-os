import React, { useState, useEffect } from 'react';
import { Wallet, AlertCircle, ChevronDown, ChevronUp, TrendingDown } from 'lucide-react';
import { commissionsService } from '@/services';
import { error as logError } from '@/utils/logger';

/**
 * Componente MinhaComissaoBar - Versão Minimalista
 * 
 * Estado inicial: Barra compacta com apenas o essencial
 * Ao clicar na seta: Expande para mostrar detalhes completos
 */
export default function MinhaComissaoBar({ mes, ano }) {
  const [comissao, setComissao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [expandido, setExpandido] = useState(false); // Inicia FECHADO
  
  const buscarComissao = async () => {
    setCarregando(true);
    setErro(null);
    
    try {
      const response = await commissionsService.getMinhaComissao(mes, ano);
      
      if (response?.erro) {
        setErro(response.erro);
        setComissao(null);
      } else {
        setComissao(response);
      }
    } catch (err) {
      logError('Erro ao buscar comissão:', err);
      
      if (err?.response?.status === 404) {
        setErro('Nenhum colaborador vinculado ao seu usuário.');
      } else {
        setErro('Erro ao carregar sua comissão.');
      }
      setComissao(null);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarComissao();
  }, [mes, ano]);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  const formatarPercentual = (valor) => {
    return `${(valor || 0).toFixed(2)}%`;
  };

  // Calcula percentuais para a barra
  const calcularPercentuais = () => {
    if (!comissao || comissao.salario_base <= 0) return { desconto: 0, liquido: 100 };
    
    const percentualDesconto = (comissao.valor_total_desconto / comissao.salario_base) * 100;
    const percentualLiquido = (comissao.salario_final / comissao.salario_base) * 100;
    
    return {
      desconto: Math.min(percentualDesconto, 100),
      liquido: Math.max(percentualLiquido, 0)
    };
  };

  const percentuais = calcularPercentuais();

  // Se está carregando - Versão minimalista
  if (carregando) {
    return (
      <div className="bg-[#0f0f11] border border-zinc-800 rounded-xl px-4 py-3 mb-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-800 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-3 bg-zinc-800 rounded w-32 mb-2"></div>
            <div className="h-2 bg-zinc-800 rounded-full w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Se há erro - Versão minimalista
  if (erro || !comissao) {
    return (
      <div className="bg-[#0f0f11] border border-zinc-800 rounded-xl px-4 py-3 mb-4">
        <div className="flex items-center gap-3">
          <AlertCircle size={16} className="text-amber-500 shrink-0" />
          <p className="text-xs font-medium text-zinc-500">{erro || 'Não foi possível carregar sua comissão.'}</p>
        </div>
      </div>
    );
  }

  // VERSÃO MINIMALISTA (FECHADA)
  if (!expandido) {
    return (
      <div 
        className="bg-[#0f0f11] border border-zinc-800 rounded-xl px-4 py-3 mb-4 cursor-pointer hover:border-zinc-700 transition-all group"
        onClick={() => setExpandido(true)}
      >
        <div className="flex items-center gap-3">
          {/* Ícone */}
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Wallet size={16} className="text-emerald-500" />
          </div>
          
          {/* Barra de progresso + informação principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black text-zinc-300 uppercase tracking-tight truncate">
                Minha Comissão
              </span>
              <span className="text-[11px] font-black text-emerald-500 shrink-0 ml-2">
                {formatarMoeda(comissao.salario_final)}
              </span>
            </div>
            
            {/* Barra compacta */}
            <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                style={{ width: `${percentuais.liquido}%` }}
              />
              <div 
                className="absolute inset-y-0 right-0 bg-gradient-to-l from-red-600 to-red-400 transition-all duration-500"
                style={{ width: `${percentuais.desconto}%` }}
              />
            </div>
          </div>
          
          {/* Seta para expandir */}
          <button 
            className="p-1.5 rounded-lg text-zinc-500 group-hover:text-white transition-colors shrink-0"
            title="Expandir detalhes"
          >
            <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  // VERSÃO EXPANDIDA (DETALHADA)
  return (
    <div className="bg-[#0f0f11] border border-zinc-800 rounded-2xl p-5 mb-4 animate-in fade-in duration-200">
      
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Wallet size={20} className="text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">
              Minha Comissão
            </h3>
            <p className="text-[10px] text-zinc-500 font-medium">
              {comissao.nome_colaborador} • {mesesNomes[(mes || new Date().getMonth() + 1) - 1]} / {ano || new Date().getFullYear()}
            </p>
          </div>
        </div>
        
        {/* BOTÃO RECOLHER */}
        <button 
          onClick={() => setExpandido(false)}
          className="text-zinc-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-zinc-800"
          title="Recolher"
        >
          <ChevronUp size={18} />
        </button>
      </div>

      {/* BARRA DE PROGRESSO HORIZONTAL */}
      <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden mb-4">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
          style={{ width: `${percentuais.liquido}%` }}
        />
        <div 
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-red-600 to-red-400 transition-all duration-500"
          style={{ width: `${percentuais.desconto}%` }}
        />
        {percentuais.desconto > 0 && (
          <div 
            className="absolute inset-y-0 w-[2px] bg-white/50"
            style={{ left: `${percentuais.liquido}%` }}
          />
        )}
      </div>

      {/* LEGENDA */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] text-zinc-400 font-bold">Líquido</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-[10px] text-zinc-400 font-bold">Descontos</span>
        </div>
      </div>

      {/* VALORES PRINCIPAIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block mb-1">
            Salário Base
          </span>
          <span className="text-lg font-black text-white">
            {formatarMoeda(comissao.salario_base)}
          </span>
        </div>
        
        <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block mb-1">
            NCs no Período
          </span>
          <span className={`text-lg font-black ${comissao.total_ncs > 0 ? 'text-amber-500' : 'text-zinc-400'}`}>
            {comissao.total_ncs}
          </span>
        </div>
        
        <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/20">
          <span className="text-[9px] font-black text-red-500/70 uppercase tracking-wider block mb-1">
            Total Descontos
          </span>
          <span className="text-lg font-black text-red-500">
            -{formatarMoeda(comissao.valor_total_desconto)}
          </span>
        </div>
        
        <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/20">
          <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-wider block mb-1">
            Salário Final
          </span>
          <span className="text-lg font-black text-emerald-500">
            {formatarMoeda(comissao.salario_final)}
          </span>
        </div>
      </div>

      {/* INFORMAÇÕES ADICIONAIS */}
      <div className="border-t border-zinc-800 pt-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-wider mb-1">
              % Desconto por NC
            </span>
            <span className="text-sm font-bold text-amber-500">
              {formatarPercentual(comissao.percentual_desconto)}
            </span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-wider mb-1">
              Valor por NC
            </span>
            <span className="text-sm font-bold text-red-500">
              -{formatarMoeda(comissao.valor_por_nc)}
            </span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-wider mb-1">
              Percentual Líquido
            </span>
            <span className="text-sm font-bold text-emerald-500">
              {percentuais.liquido.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* LISTA DE NCs */}
        {comissao.ncs && comissao.ncs.length > 0 && (
          <div className="space-y-2">
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-wider block">
              NCs do Período ({comissao.ncs.length})
            </span>
            
            {comissao.ncs.map((nc) => (
              <div 
                key={nc.id}
                className="flex items-center justify-between bg-zinc-900/30 rounded-lg px-3 py-2 border border-zinc-800/50"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[10px] font-mono text-zinc-600">#{nc.id}</span>
                  <p className="text-xs text-zinc-400 truncate max-w-[300px]">{nc.descricao}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                    nc.status === 'Deferido' 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {nc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Se não há NCs */}
        {(!comissao.ncs || comissao.ncs.length === 0) && (
          <div className="text-center py-4">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
              Nenhuma NC neste período
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Array com nomes dos meses (para exibição)
const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];