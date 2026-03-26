import React, { useState } from 'react';
import { formatNum } from '../utils/calculations';

// Adicionamos a propriedade "decimals" (o padrão é 2, mas podemos passar 1)
export default function EditableCell({ value, onChange, className, isPercentage = false, decimals = 2 }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState('');

  const handleFocus = (e) => {
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
      className={className}
      value={isEditing ? localValue : displayValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}