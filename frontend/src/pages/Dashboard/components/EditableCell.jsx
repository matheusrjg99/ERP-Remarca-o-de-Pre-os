import React, { useState } from 'react';
import { formatNum } from '../utils/calculations';
import { useDashboardPermissions } from '../../../hooks/useDashboardPermissions';

// Adicionamos a propriedade "decimals" (o padrão é 2, mas podemos passar 1)
export default function EditableCell({ value, onChange, className, isPercentage = false, decimals = 2, colunaKey }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState('');
  
  // Hook de permissões para verificar se pode editar esta célula
  const { podeEditarColuna, isLoading } = useDashboardPermissions();
  const podeEditar = colunaKey ? podeEditarColuna(colunaKey) : true;

  const handleFocus = (e) => {
    if (!podeEditar) return; // Bloqueia edição se não tiver permissão
    setIsEditing(true);
    // Usa a quantidade de decimais correta na hora de editar
    const valorParaEdicao = Number(value).toFixed(decimals).replace('.', ',');
    setLocalValue(valorParaEdicao);
    setTimeout(() => e.target.select(), 10);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(localValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
  };

  // Usa a quantidade de decimais correta na hora de exibir
  const displayValue = formatNum(value, decimals) + (isPercentage ? '%' : '');

  return (
    <input
      type="text"
      className={`${className} ${!podeEditar ? 'cursor-not-allowed text-zinc-500' : ''}`}
      value={isEditing ? localValue : displayValue}
      onChange={(e) => podeEditar && setLocalValue(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      readOnly={!podeEditar}
      title={!podeEditar ? 'Sem permissão para editar esta célula' : undefined}
    />
  );
}