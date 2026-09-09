/**
 * Funções utilitárias para exportação de dados
 * Módulo puro - sem dependências de React ou serviços externos
 */

/**
 * Exporta os dados do relatório para CSV com separação fiscal/dinheiro
 * @param {Array} dados - Array de objetos com os dados do relatório
 * @param {number} mes - Mês de referência (1-12)
 * @param {number} ano - Ano de referência
 * @param {object} percentuais - Objeto com percentualFiscal e percentualDinheiro
 */
export const exportarParaCSV = (dados, mes, ano, percentuais = { percentualFiscal: 100, percentualDinheiro: 0 }) => {
  if (!dados || dados.length === 0) {
    console.warn('Nenhum dado para exportar');
    return;
  }

  const mesesNomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Cabeçalho do CSV com colunas separadas para fiscal e dinheiro (apenas valores, sem percentuais repetidos)
  const cabecalho = [
    'Colaborador',
    'Salário Base',
    'Total NCs',
    'Valor Desconto',
    'Salário Final',
    'Valor Fiscal',
    'Valor Dinheiro'
  ];

  // Linhas de dados com separação fiscal/dinheiro
  const linhas = dados.map(item => {
    const salarioFinal = item.salario_final || 0;
    const valorFiscal = salarioFinal * ((percentuais?.percentualFiscal || 100) / 100);
    const valorDinheiro = salarioFinal * ((percentuais?.percentualDinheiro || 0) / 100);

    return [
      `"${item.nome_colaborador}"`,
      (item.salario_base || 0).toFixed(2).replace('.', ','),
      item.total_ncs || 0,
      (item.valor_total_desconto || 0).toFixed(2).replace('.', ','),
      salarioFinal.toFixed(2).replace('.', ','),
      valorFiscal.toFixed(2).replace('.', ','),
      valorDinheiro.toFixed(2).replace('.', ',')
    ];
  });

  // Monta o conteúdo CSV
  const conteudoCSV = [
    cabecalho.join(';'),
    ...linhas.map(linha => linha.join(';'))
  ].join('\n');

  // Adiciona BOM para UTF-8
  const blob = new Blob(['\ufeff' + conteudoCSV], { 
    type: 'text/csv;charset=utf-8;' 
  });

  // Cria link para download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio_comissoes_${mesesNomes[mes - 1].toLowerCase()}_${ano}.csv`;
  link.click();

  // Limpa URL
  URL.revokeObjectURL(url);

  console.log('✅ CSV exportado com sucesso');
};

/**
 * Exporta os dados do relatório para PDF (usando window.print como fallback)
 * com separação fiscal/dinheiro POR COLABORADOR
 * Design otimizado para impressão econômica (baixo consumo de tinta)
 * @param {Array} dados - Array de objetos com os dados do relatório
 * @param {number} mes - Mês de referência (1-12)
 * @param {number} ano - Ano de referência
 * @param {Function} formatarMoeda - Função para formatar valores monetários
 * @param {object} percentuais - Objeto com percentualFiscal e percentualDinheiro
 */
export const exportarParaPDF = (dados, mes, ano, formatarMoeda, percentuais = { percentualFiscal: 100, percentualDinheiro: 0 }) => {
  if (!dados || dados.length === 0) {
    console.warn('Nenhum dado para exportar');
    return;
  }

  const mesesNomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Calcula totais
  const totalGeral = dados.reduce((acc, item) => acc + (item.salario_final || 0), 0);
  const totalDescontos = dados.reduce((acc, item) => acc + (item.valor_total_desconto || 0), 0);
  const totalNCs = dados.reduce((acc, item) => acc + (item.total_ncs || 0), 0);
  
  // Calcula totais fiscal e dinheiro
  const totalFiscal = totalGeral * ((percentuais?.percentualFiscal || 100) / 100);
  const totalDinheiro = totalGeral * ((percentuais?.percentualDinheiro || 0) / 100);

  // Gera HTML para impressão com design dashboard econômico
  const htmlConteudo = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório de Comissões - ${mesesNomes[mes - 1]} ${ano}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          padding: 30px;
          color: #1a1a1a;
          background: #fff;
          line-height: 1.5;
        }
        
        /* Cabeçalho */
        .header {
          border-bottom: 2px solid #1a1a1a;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        h1 {
          color: #1a1a1a;
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        
        .periodo {
          color: #666;
          font-size: 14px;
          font-weight: 500;
        }
        
        /* Cards de resumo - estilo dashboard */
        .resumo-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .resumo-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        
        .resumo-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }
        
        .resumo-valor {
          font-size: 26px;
          font-weight: 700;
          color: #1a1a1a;
        }
        
        .resumo-destaque {
          color: #059669;
        }
        
        /* Seção de distribuição fiscal/dinheiro */
        .distribuicao-section {
          background: #fff;
          border: 2px solid #1a1a1a;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 30px;
        }
        
        .distribuicao-titulo {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .distribuicao-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        
        .distribuicao-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        
        .distribuicao-card.fiscal {
          border-top: 4px solid #2563eb;
        }
        
        .distribuicao-card.dinheiro {
          border-top: 4px solid #059669;
        }
        
        .distribuicao-label {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
        
        .distribuicao-valor {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a1a;
        }
        
        /* Tabela */
        .tabela-container {
          margin-bottom: 30px;
          overflow-x: auto;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        
        thead {
          background: #f9fafb;
        }
        
        th {
          padding: 14px 16px;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #1a1a1a;
        }
        
        td {
          padding: 14px 16px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 12px;
          color: #1a1a1a;
        }
        
        tbody tr:hover {
          background: #f9fafb;
        }
        
        .texto-direita {
          text-align: right;
        }
        
        .texto-centro {
          text-align: center;
        }
        
        /* Colunas fiscais/dinheiro na tabela */
        .col-fiscal {
          color: #1a1a1a;
          font-weight: 600;
        }
        
        .col-dinheiro {
          color: #1a1a1a;
          font-weight: 600;
        }
        
        /* Rodapé de totais */
        .totais-footer {
          background: #fff;
          border-top: 2px solid #1a1a1a;
          border-radius: 0;
          padding: 20px 0 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .totais-info {
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }
        
        .totais-valores {
          display: flex;
          gap: 32px;
          flex-wrap: wrap;
        }
        
        .total-item {
          text-align: right;
        }
        
        .total-label {
          font-size: 10px;
          color: #999;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .total-valor {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
        }
        
        .total-geral-destaque {
          font-size: 22px;
          color: #059669;
        }
        
        /* Botão de impressão - escondido na impressão */
        .btn-imprimir {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 24px;
          background: #1a1a1a;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .btn-imprimir:hover {
          background: #333;
        }
        
        /* Otimização para impressão econômica */
        @media print {
          body { 
            padding: 15px;
            background: #fff;
          }
          
          .no-print { 
            display: none !important;
          }
          
          /* Remove fundos coloridos para economizar tinta */
          .resumo-card,
          .distribuicao-card,
          .distribuicao-section,
          thead {
            background: #fff !important;
          }

          /* Bordas sutis em cinza */
          .resumo-card,
          .distribuicao-card,
          .distribuicao-section {
            border: 1px solid #ccc !important;
          }

          /* Mantém borda superior preta na seção de distribuição e footer */
          .distribuicao-section,
          .totais-footer {
            border-top: 2px solid #000 !important;
            border-bottom: none !important;
          }

          /* Texto sempre preto puro */
          * {
            color: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      </style>
    </head>
    <body>
      <!-- Cabeçalho -->
      <div class="header">
        <h1>Relatório de Comissões</h1>
        <p class="periodo">${mesesNomes[mes - 1]} de ${ano}</p>
      </div>
      
      <!-- Resumo Dashboard -->
      <div class="resumo-grid">
        <div class="resumo-card">
          <div class="resumo-label">Total a Pagar</div>
          <div class="resumo-valor resumo-destaque">${formatarMoeda(totalGeral)}</div>
        </div>
        <div class="resumo-card">
          <div class="resumo-label">Colaboradores</div>
          <div class="resumo-valor">${dados.length}</div>
        </div>
        <div class="resumo-card">
          <div class="resumo-label">Descontos</div>
          <div class="resumo-valor">${formatarMoeda(totalDescontos)}</div>
        </div>
        <div class="resumo-card">
          <div class="resumo-label">Total NCs</div>
          <div class="resumo-valor">${totalNCs}</div>
        </div>
      </div>

      <!-- Distribuição Fiscal/Dinheiro -->
      <div class="distribuicao-section">
        <div class="distribuicao-titulo">
          <span>📊</span>
          Distribuição da Comissão por Tipo
        </div>
        <div class="distribuicao-grid">
          <div class="distribuicao-card fiscal">
            <div class="distribuicao-label">Valor Fiscal</div>
            <div class="distribuicao-valor">${formatarMoeda(totalFiscal)}</div>
          </div>
          <div class="distribuicao-card dinheiro">
            <div class="distribuicao-label">Valor em Dinheiro</div>
            <div class="distribuicao-valor">${formatarMoeda(totalDinheiro)}</div>
          </div>
        </div>
      </div>

      <!-- Tabela Detalhada -->
      <div class="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Colaborador</th>
              <th class="texto-direita">Salário Base</th>
              <th class="texto-centro">NCs</th>
              <th class="texto-direita">Desconto</th>
              <th class="texto-direita">Salário Final</th>
              <th class="texto-direita col-fiscal">Valor Fiscal</th>
              <th class="texto-direita col-dinheiro">Valor Dinheiro</th>
            </tr>
          </thead>
          <tbody>
            ${dados.map(item => {
              const salarioFinal = item.salario_final || 0;
              const valorFiscal = salarioFinal * ((percentuais?.percentualFiscal || 100) / 100);
              const valorDinheiro = salarioFinal * ((percentuais?.percentualDinheiro || 0) / 100);
              
              return `
              <tr>
                <td>${item.nome_colaborador}</td>
                <td class="texto-direita">${formatarMoeda(item.salario_base)}</td>
                <td class="texto-centro">${item.total_ncs || 0}</td>
                <td class="texto-direita">${formatarMoeda(item.valor_total_desconto)}</td>
                <td class="texto-direita"><strong>${formatarMoeda(item.salario_final)}</strong></td>
                <td class="texto-direita col-fiscal">${formatarMoeda(valorFiscal)}</td>
                <td class="texto-direita col-dinheiro">${formatarMoeda(valorDinheiro)}</td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totais Footer -->
      <div class="totais-footer">
        <div class="totais-info">
          Total de colaboradores: <strong>${dados.length}</strong>
        </div>
        <div class="totais-valores">
          <div class="total-item">
            <div class="total-label">Total Geral</div>
            <div class="total-valor total-geral-destaque">${formatarMoeda(totalGeral)}</div>
          </div>
          <div class="total-item">
            <div class="total-label">Total Fiscal</div>
            <div class="total-valor col-fiscal">${formatarMoeda(totalFiscal)}</div>
          </div>
          <div class="total-item">
            <div class="total-label">Total Dinheiro</div>
            <div class="total-valor col-dinheiro">${formatarMoeda(totalDinheiro)}</div>
          </div>
        </div>
      </div>

      <!-- Botão de Impressão -->
      <button class="no-print btn-imprimir" onclick="window.print()">
        🖨️ Imprimir / Salvar como PDF
      </button>
    </body>
    </html>
  `;

  // Abre janela de impressão
  const novaJanela = window.open('', '_blank');
  novaJanela.document.write(htmlConteudo);
  novaJanela.document.close();

  console.log('✅ PDF pronto para impressão (design econômico)');
};
