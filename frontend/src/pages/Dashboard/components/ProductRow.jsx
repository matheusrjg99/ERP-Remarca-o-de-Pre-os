import React, { memo } from 'react';
import EditableCell from './EditableCell';
import { formatNum, formatData } from '../utils/calculations';

// 1. Envolvemos a função em React.memo()
const ProductRow = memo(function ProductRow({ produto, colunas, isSelected, onToggleCheck, onCellEdit, index, preferencias }) {
  const inputEstilo = "bg-transparent w-full outline-none hover:bg-zinc-800/50 focus:bg-zinc-700 focus:ring-1 focus:ring-blue-500 rounded px-1 transition-colors tabular-nums cursor-text border border-transparent hover:border-zinc-500 overflow-hidden text-ellipsis";

  return (
    <tr className={`group transition-colors ${isSelected ? 'bg-blue-900/10' : 'hover:bg-[#202024]'}`}>
      {colunas.map((col) => {
        const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
        const baseCellClass = `py-2 px-2 overflow-hidden text-ellipsis ${alignClass}`;
        const val = produto[col.key];

        const pref = preferencias[col.key] || {};
        let activeBg = pref.bg;
        let activeText = pref.text;
        let activeSize = pref.size;

        if (pref.regras && pref.regras.length > 0) {
          for (let regra of pref.regras) {
            const targetKey = regra.colunaAlvo || col.key;
            const targetValue = Number(produto[targetKey]); 
            const ruleValue = Number(regra.valor);
            let match = false;

            if (regra.operador === '>') match = targetValue > ruleValue;
            else if (regra.operador === '<') match = targetValue < ruleValue;
            else if (regra.operador === '>=') match = targetValue >= ruleValue;
            else if (regra.operador === '<=') match = targetValue <= ruleValue;
            else if (regra.operador === '=') match = targetValue === ruleValue;

            if (match) {
              if (regra.bg) activeBg = regra.bg;
              if (regra.text) activeText = regra.text;
              if (regra.size) activeSize = regra.size; // Adicionado suporte para fonte condicional!
              break; 
            }
          }
        }

        const customStyle = {
          backgroundColor: activeBg || undefined,
          color: activeText || undefined,
          fontSize: activeSize ? `${activeSize}px` : undefined,
        };

        switch (col.type) {
          case 'checkbox': return <td key={col.key} style={customStyle} className={baseCellClass}><input type="checkbox" checked={isSelected} onChange={() => onToggleCheck(produto.id)} className="w-3.5 h-3.5 rounded-sm border-zinc-700 bg-zinc-900 accent-blue-600 cursor-pointer" /></td>;
          case 'date': return <td key={col.key} style={customStyle} className={`${baseCellClass} ${!activeText && 'text-zinc-500'}`}>{formatData(val)}</td>;
          case 'text': return <td key={col.key} style={customStyle} className={`${baseCellClass} ${!activeText && (col.key === 'id' ? 'font-mono text-zinc-400' : 'text-zinc-200 truncate')}`} title={col.key === 'descricao' ? val : ''}>{val}</td>;
          case 'number':
          case 'currency': return <td key={col.key} style={customStyle} className={`${baseCellClass} tabular-nums ${!activeText && 'text-zinc-400'}`}>{formatNum(val)}</td>;
          case 'percent':
          case 'percent-1': return <td key={col.key} style={customStyle} className={`${baseCellClass} tabular-nums ${!activeText && 'text-zinc-400'}`}>{formatNum(val, 1)}%</td>;
          case 'editable-currency': return <td key={col.key} style={customStyle} className={`py-1 px-1 text-right ${!activeText && 'text-zinc-300'}`}><EditableCell className={`${inputEstilo} text-right`} value={val} onChange={(newVal) => onCellEdit(index, col.key, newVal)} /></td>;
          case 'editable-currency-highlight': return <td key={col.key} style={customStyle} className={`py-1 px-1 text-right font-medium ${!activeText && 'text-blue-400'}`}><EditableCell className={`${inputEstilo} text-right text-blue-400`} value={val} onChange={(newVal) => onCellEdit(index, col.key, newVal)} /></td>;
          case 'editable-percent-1': return <td key={col.key} style={customStyle} className={`py-1 px-1 text-right ${!activeText && 'text-zinc-400'}`}><EditableCell className={`${inputEstilo} text-right`} value={val} isPercentage={true} decimals={1} onChange={(newVal) => onCellEdit(index, col.key, newVal)} /></td>;
          case 'tag': return <td key={col.key} style={customStyle} className={`${baseCellClass} tabular-nums`}><span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${val < 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{val > 0 ? '+' : ''}{formatNum(val, 1)}%</span></td>;
          default: return <td key={col.key} style={customStyle} className={baseCellClass}>{val}</td>;
        }
      })}
    </tr>
  );
});

export default ProductRow; // 2. Exportamos a versão com memo()