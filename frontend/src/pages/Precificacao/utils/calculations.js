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

// NOVA FUNÇÃO - Arredonda para múltiplos de 0,05
export const roundTo05 = (num) => Math.round(num * 20) / 20;

// FUNÇÃO AUXILIAR - Verifica se o valor realmente mudou
const valorRealmenteMudou = (valorNovo, valorAntigo, tolerancia = 0.001) => {
  // Se ambos são zero ou null, considera que não mudou
  if ((!valorNovo || valorNovo === 0) && (!valorAntigo || valorAntigo === 0)) {
    return false;
  }
  
  // Comparação com tolerância para floats
  return Math.abs(valorNovo - valorAntigo) > tolerancia;
};

// FUNÇÃO AUXILIAR - Normaliza o valor para comparação
const normalizarValor = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'string') {
    // Remove caracteres não numéricos exceto vírgula e ponto
    const cleaned = val.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return typeof val === 'number' ? val : 0;
};

// FUNÇÃO PRINCIPAL REFATORADA
export const recalcularProduto = (produtoOriginal, campoEditado, valorDigitado, options = {}) => {
  const {
    forcarEdicao = false,        // Força a marcação como editado mesmo sem mudança
    ignorarFlags = false,         // Ignora as flags de edição
    tolerancia = 0.001,           // Tolerância para comparação de floats
  } = options;

  // Cria cópia profunda do produto
  const p = JSON.parse(JSON.stringify(produtoOriginal));
  
  // Normaliza os valores para comparação
  const valorFloat = normalizarValor(valorDigitado);
  const valorOriginal = normalizarValor(p[campoEditado]);
  
  // VERIFICA SE O VALOR REALMENTE MUDOU
  const valorMudou = valorRealmenteMudou(valorFloat, valorOriginal, tolerancia);
  
  // LOG detalhado para debug
  console.log('✏️ [recalcularProduto] Detalhes:', { 
    produto: p.id,
    campo: campoEditado,
    valorDigitado,
    valorFloat,
    valorOriginal,
    valorMudou,
    forcarEdicao,
    tolerancia,
    flags: {
      custoEditado: p.custoEditado,
      markupEditado: p.markupEditado,
      precoAtualEditado: p.precoAtualEditado,
      precoSugeridoEditado: p.precoSugeridoEditado,
    }
  });

  // SE NÃO MUDOU E NÃO ESTÁ FORÇANDO, RETORNA O ORIGINAL
  if (!valorMudou && !forcarEdicao) {
    console.log('⏭️ [recalcularProduto] Valor não mudou, ignorando edição');
    return produtoOriginal; // Retorna o original intacto
  }

  // ATUALIZA O CAMPO COM O NOVO VALOR
  p[campoEditado] = valorFloat;

  // ============================================
  // LÓGICA DE EDIÇÃO POR CAMPO
  // ============================================
  
  if (campoEditado === 'custo') {
    // Só marca como editado se realmente mudou ou se forçado
    if (valorMudou || forcarEdicao) {
      p.custoEditado = true;
    }
    
    // Recalcula sugerido baseado no markup atual
    p.sugerido = round2(p.custo * (1 + (p.markup / 100)));
    
    // Se o custo mudou, reseta as flags de preço sugerido e atual
    if (valorMudou) {
      // Não reseta automaticamente, mantém as flags do usuário
      console.log('🔄 Custo alterado, recalculando valores dependentes');
    }
  } 
  
  else if (campoEditado === 'sugerido') {
    // Só marca como editado se realmente mudou ou se forçado
    if (valorMudou || forcarEdicao) {
      p.precoSugeridoEditado = true;
    }
    
    // Recalcula markup baseado no sugerido
    if (p.custo > 0) {
      p.markup = round1(((p.sugerido - p.custo) / p.custo) * 100);
    } else {
      p.markup = 0;
    }
  } 
  
  else if (campoEditado === 'markup') {
    // Só marca como editado se realmente mudou ou se forçado
    if (valorMudou || forcarEdicao) {
      p.markupEditado = true;
    }
    
    // Recalcula sugerido baseado no markup
    p.sugerido = round2(p.custo * (1 + (p.markup / 100)));
  } 
  
  else if (campoEditado === 'atual') {
    // ⭐ CRÍTICO: Só marca como editado se realmente mudou
    if (valorMudou) {
      p.precoAtualEditado = true;
      console.log('✅ Preço atual marcado como editado (valor mudou)');
    } else if (forcarEdicao) {
      p.precoAtualEditado = true;
      console.log('⚠️ Preço atual marcado como editado (forçado)');
    } else {
      // Garante que não marca como editado se não mudou
      p.precoAtualEditado = false;
      console.log('⏭️ Preço atual NÃO marcado como editado (valor não mudou)');
    }
  }

  // ============================================
  // RECÁLCULOS FINAIS
  // ============================================
  
  // Markup Real (baseado no preço atual)
  p.markupReal = p.custo > 0 ? round1(((p.atual - p.custo) / p.custo) * 100) : 0;
  
  // Diferença entre markup real e markup sugerido
  p.difMarkup = round1(p.markupReal - p.markup);

  // LOG FINAL
  console.log('✅ [recalcularProduto] Resultado:', {
    produto: p.id,
    campo: campoEditado,
    novoValor: p[campoEditado],
    flags: {
      custoEditado: p.custoEditado,
      markupEditado: p.markupEditado,
      precoAtualEditado: p.precoAtualEditado,
      precoSugeridoEditado: p.precoSugeridoEditado,
    },
    valores: {
      custo: p.custo,
      markup: p.markup,
      sugerido: p.sugerido,
      atual: p.atual,
      markupReal: p.markupReal,
      difMarkup: p.difMarkup,
    }
  });

  return p;
};

// ============================================
// FUNÇÕES ADICIONAIS PARA USO EM COMPONENTES
// ============================================

// Para usar em eventos de input (onChange)
export const handleInputChange = (produto, campo, valor, callback) => {
  const valorNormalizado = normalizarValor(valor);
  const valorOriginal = normalizarValor(produto[campo]);
  
  // Se o valor não mudou, não faz nada
  if (!valorRealmenteMudou(valorNormalizado, valorOriginal)) {
    return produto;
  }
  
  const resultado = recalcularProduto(produto, campo, valor);
  
  if (callback && typeof callback === 'function') {
    callback(resultado);
  }
  
  return resultado;
};

// Para usar em eventos de blur (onBlur)
export const handleBlur = (produto, campo, valor, callback) => {
  const valorNormalizado = normalizarValor(valor);
  const valorOriginal = normalizarValor(produto[campo]);
  
  // Se o valor não mudou, NÃO marca como editado
  if (!valorRealmenteMudou(valorNormalizado, valorOriginal)) {
    console.log('🔵 [handleBlur] Blur sem alteração, ignorando');
    return produto;
  }
  
  // Se mudou, processa a edição
  const resultado = recalcularProduto(produto, campo, valor);
  
  if (callback && typeof callback === 'function') {
    callback(resultado);
  }
  
  return resultado;
};

// Função para resetar flags (útil para limpar estado)
export const resetarFlagsEdicao = (produto) => {
  const p = { ...produto };
  p.custoEditado = false;
  p.markupEditado = false;
  p.precoAtualEditado = false;
  p.precoSugeridoEditado = false;
  return p;
};