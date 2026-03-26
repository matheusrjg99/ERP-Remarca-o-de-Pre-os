// Formata números para o padrão brasileiro
export const formatNum = (val, digits = 2) => 
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(val || 0);

// Converte string (BR) para float
export const toFloat = (val) => {
  if (val === null || val === undefined || val === '') return 0.0;
  if (typeof val === 'number') return val;
  const cleanStr = String(val).trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0.0 : num;
};

// Formata Data ISO para DD/MM/AA
export const formatData = (dataIso) => {
  if (!dataIso) return '-';
  const partes = dataIso.split('-');
  if (partes.length !== 3) return dataIso;
  return `${partes[2]}/${partes[1]}/${partes[0].substring(2)}`;
};

export const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
export const round1 = (num) => Math.round((num + Number.EPSILON) * 10) / 10;

export const recalcularProduto = (produtoOriginal, campoEditado, valorDigitado) => {
  const p = { ...produtoOriginal };
  const valorFloat = toFloat(valorDigitado);
  
  // Atualiza o campo com o valor puro
  p[campoEditado] = valorFloat;

  // IMPORTANTE: Agora usamos as chaves limpas do Adapter!
  if (campoEditado === 'custo') {
    p.precoEditado = false;
    p.sugerido = round2(p.custo * (1 + (p.markup / 100)));
  } 
  else if (campoEditado === 'sugerido') {
    p.precoEditado = false;
    p.markup = p.custo > 0 ? round1(((p.sugerido - p.custo) / p.custo) * 100) : 0;
  } 
  else if (campoEditado === 'markup') {
    p.precoEditado = false;
    p.sugerido = round2(p.custo * (1 + (p.markup / 100)));
  } 
  else if (campoEditado === 'atual') {
    p.precoEditado = true;
  }

  // Recálculos de Markup Real e Diferença
  p.markupReal = p.custo > 0 ? round1(((p.atual - p.custo) / p.custo) * 100) : 0;
  p.difMarkup = round1(p.markupReal - p.markup);

  return p;
};