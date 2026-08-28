import React, { useState } from 'react';
import { formatNum } from '../utils/calculations';

// EditableCell sem usePermissions
export default function EditableCell({ value, onChange, className, isPercentage = false, decimals = 2 }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState('');

  const handleFocus = (e) => {
    setIsEditing(true);
    const valorParaEdicao = Number(value).toFixed(decimals).replace('.', ',');
    setLocalValue(valorParaEdicao);
    setTimeout(() => e.target.select(), 10);
  };

  const handleBlur = () => {
    console.log('💾 [EditableCell] Salvando valor:', { localValue, valorAntes: value });
    setIsEditing(false);
    onChange(localValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
  };

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