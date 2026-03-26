// Formata valores numéricos para o padrão de moeda brasileiro (R$ 1.234,56)
export const formatCur = (val) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
};

// Se precisar de mais formatações no futuro (como datas), você adiciona aqui!