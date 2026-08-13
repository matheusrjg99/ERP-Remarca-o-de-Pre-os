import { toFloat, round1 } from './calculations';

// Este é o ÚNICO lugar do sistema inteiro que precisa saber os nomes das colunas do banco de dados.
export const adaptarProdutoDeEntrada = (p) => {
  const produto = {
    id: p.COD || p.CODPROD || p.codpro || '-',
    entrada: p.ENT || '-',
    remarcacao: p.REM || '-',
    descricao: p.DESCRICAO || '-',
    quantidade: toFloat(p.QUAN || p.QUANT),
    unidade: p.UND || '-',
    lista: toFloat(p.P_LISTA || p.RS_LISTA),
    icms: toFloat(p.ICMS),
    valoripi: toFloat(p.valoripi || p.VALORIPI),
    frete: toFloat(p.FRETE),
    custo: toFloat(p.P_CUSTO || p.RS_CUSTO),
    sugerido: toFloat(p.P_SUGER || p.RS_VENDA_SUG),
    atual: toFloat(p.P_ATUAL || p.RS_VEN_REAL),
    markupReal: round1(toFloat(p.MKP_REAL)),
    markup: round1(toFloat(p.MKP)),
    difMarkup: round1(toFloat(p.DIF_MKP)),
    conversao: toFloat(p.CONVER || p.CONV),
    // Flags de controle do sistema - todas iniciam como false pois são dados do banco
    precoEditado: false,
    custoEditado: false,
    markupEditado: false
  };
  
  console.log('📥 [adaptarProdutoDeEntrada] Produto adaptado:', {
    id: produto.id,
    custo: produto.custo,
    markup: produto.markup,
    sugerido: produto.sugerido,
    atual: produto.atual,
    flags: {
      custoEditado: produto.custoEditado,
      markupEditado: produto.markupEditado,
      precoEditado: produto.precoEditado
    }
  });
  
  return produto;
};