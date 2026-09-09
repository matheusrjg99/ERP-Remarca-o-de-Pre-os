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

  // Cabeçalho do CSV com colunas separadas para fiscal e dinheiro
  const cabecalho = [
    'ID',
    'Colaborador',
    'Salário Base',
    'Total NCs',
    'Valor Desconto',
    'Salário Final',
    'Percentual Fiscal (%)',
    'Valor Fiscal',
    'Percentual Dinheiro (%)',
    'Valor Dinheiro'
  ];

  // Linhas de dados com separação fiscal/dinheiro
  const linhas = dados.map(item => {
    const salarioFinal = item.salario_final || 0;
    const valorFiscal = salarioFinal * ((percentuais?.percentualFiscal || 100) / 100);
    const valorDinheiro = salarioFinal * ((percentuais?.percentualDinheiro || 0) / 100);

    return [
      item.colaborador_id,
      `"${item.nome_colaborador}"`,
      (item.salario_base || 0).toFixed(2).replace('.', ','),
      item.total_ncs || 0,
      (item.valor_total_desconto || 0).toFixed(2).replace('.', ','),
      salarioFinal.toFixed(2).replace('.', ','),
      (percentuais?.percentualFiscal || 100).toFixed(2).replace('.', ','),
      valorFiscal.toFixed(2).replace('.', ','),
      (percentuais?.percentualDinheiro || 0).toFixed(2).replace('.', ','),
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
 * com separação fiscal/dinheiro
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

  // Gera HTML para impressão
  const htmlConteudo = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório de Comissões - ${mesesNomes[mes - 1]} ${ano}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          color: #333;
        }
        h1 {
          color: #1a1a1a;
          font-size: 24px;
          margin-bottom: 10px;
        }
        .periodo {
          color: #666;
          font-size: 14px;
          margin-bottom: 30px;
        }
        .resumo {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .resumo-item {
          background: #f5f5f5;
          padding: 15px 20px;
          border-radius: 8px;
          min-width: 150px;
        }
        .resumo-label {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          font-weight: bold;
        }
        .resumo-valor {
          font-size: 18px;
          font-weight: bold;
          color: #1a1a1a;
          margin-top: 5px;
        }
        .resumo-destaque {
          color: #10b981;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #1a1a1a;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 13px;
        }
        tr:nth-child(even) {
          background: #f9f9f9;
        }
        .texto-direita {
          text-align: right;
        }
        .texto-centro {
          text-align: center;
        }
        .total-geral {
          margin-top: 20px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 8px;
          text-align: right;
          font-weight: bold;
        }
        .separacao-fiscal-dinheiro {
          margin-top: 20px;
          padding: 15px;
          background: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 8px;
        }
        .separacao-fiscal-dinheiro h3 {
          font-size: 14px;
          color: #166534;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .separacao-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .separacao-item {
          background: white;
          padding: 12px;
          border-radius: 6px;
          border-left: 4px solid #10b981;
        }
        .separacao-item.fiscal {
          border-left-color: #3B8ED0;
        }
        .separacao-label {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .separacao-valor {
          font-size: 16px;
          font-weight: bold;
          color: #1a1a1a;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>Relatório de Comissões</h1>
      <p class="periodo">${mesesNomes[mes - 1]} de ${ano}</p>
      
      <div class="resumo">
        <div class="resumo-item">
          <div class="resumo-label">Total a Pagar</div>
          <div class="resumo-valor">${formatarMoeda(totalGeral)}</div>
        </div>
        <div class="resumo-item">
          <div class="resumo-label">Colaboradores</div>
          <div class="resumo-valor">${dados.length}</div>
        </div>
        <div class="resumo-item">
          <div class="resumo-label">Descontos</div>
          <div class="resumo-valor">${formatarMoeda(totalDescontos)}</div>
        </div>
        <div class="resumo-item">
          <div class="resumo-label">Total NCs</div>
          <div class="resumo-valor">${totalNCs}</div>
        </div>
      </div>

      <!-- Seção de Separação Fiscal/Dinheiro -->
      <div class="separacao-fiscal-dinheiro">
        <h3>📊 Distribuição da Comissão</h3>
        <div class="separacao-grid">
          <div class="separacao-item fiscal">
            <div class="separacao-label">Valor Fiscal (${(percentuais?.percentualFiscal || 100).toFixed(2)}%)</div>
            <div class="separacao-valor resumo-destaque">${formatarMoeda(totalFiscal)}</div>
          </div>
          <div class="separacao-item">
            <div class="separacao-label">Valor em Dinheiro (${(percentuais?.percentualDinheiro || 0).toFixed(2)}%)</div>
            <div class="separacao-valor resumo-destaque">${formatarMoeda(totalDinheiro)}</div>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Colaborador</th>
            <th class="texto-direita">Salário Base</th>
            <th class="texto-centro">NCs</th>
            <th class="texto-direita">Desconto</th>
            <th class="texto-direita">Salário Final</th>
          </tr>
        </thead>
        <tbody>
          ${dados.map(item => `
            <tr>
              <td>#${item.colaborador_id}</td>
              <td>${item.nome_colaborador}</td>
              <td class="texto-direita">${formatarMoeda(item.salario_base)}</td>
              <td class="texto-centro">${item.total_ncs || 0}</td>
              <td class="texto-direita">${formatarMoeda(item.valor_total_desconto)}</td>
              <td class="texto-direita">${formatarMoeda(item.salario_final)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-geral">
        Total: ${formatarMoeda(totalGeral)} | 
        Fiscal: ${formatarMoeda(totalFiscal)} | 
        Dinheiro: ${formatarMoeda(totalDinheiro)}
      </div>

      <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
        Imprimir / Salvar como PDF
      </button>
    </body>
    </html>
  `;

  // Abre janela de impressão
  const novaJanela = window.open('', '_blank');
  novaJanela.document.write(htmlConteudo);
  novaJanela.document.close();

  console.log('✅ PDF pronto para impressão');
};
