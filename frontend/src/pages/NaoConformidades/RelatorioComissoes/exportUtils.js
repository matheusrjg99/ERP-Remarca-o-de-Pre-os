/**
 * Funções utilitárias para exportação de dados
 * Módulo puro - sem dependências de React ou serviços externos
 */

/**
 * Exporta os dados do relatório para PDF via window.print
 * Design editorial em preto e branco — profissional, limpo, otimizado para impressão.
 *
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

  const totalGeral = dados.reduce((acc, item) => acc + (item.salario_final || 0), 0);
  const totalDescontos = dados.reduce((acc, item) => acc + (item.valor_total_desconto || 0), 0);
  const totalNCs = dados.reduce((acc, item) => acc + (item.total_ncs || 0), 0);
  const totalFiscal = totalGeral * ((percentuais?.percentualFiscal || 100) / 100);
  const totalDinheiro = totalGeral * ((percentuais?.percentualDinheiro || 0) / 100);

  const dataEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
  const horaEmissao = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit'
  });

  const htmlConteudo = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>Relatório de Comissões — ${mesesNomes[mes - 1]} ${ano}</title>
      <style>
        /* ============================================================
           RESET E BASE
           ============================================================ */
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, 'Segoe UI', sans-serif;
          background: #e8e8e8;
          color: #000;
          line-height: 1.45;
          padding: 40px 20px;
          font-size: 12px;
          -webkit-font-smoothing: antialiased;
        }

        .page {
          max-width: 900px;
          margin: 0 auto;
          background: #fff;
          padding: 48px 56px;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        }

        /* ============================================================
           CABEÇALHO
           ============================================================ */
        .header {
          padding-bottom: 24px;
          border-bottom: 2px solid #000;
          margin-bottom: 32px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
        }

        .brand {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #000;
          margin-bottom: 14px;
        }

        .title {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.8px;
          line-height: 1.05;
          color: #000;
        }

        .subtitle {
          font-size: 13px;
          font-weight: 400;
          color: #444;
          margin-top: 8px;
          letter-spacing: 0.3px;
        }

        .meta {
          text-align: right;
          font-size: 10px;
          color: #666;
          line-height: 1.7;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .meta strong {
          color: #000;
          font-weight: 700;
        }

        /* ============================================================
           RESUMO EXECUTIVO (KPIs)
           ============================================================ */
        .section {
          margin-bottom: 32px;
        }

        .section-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #000;
          padding-bottom: 8px;
          border-bottom: 1px solid #000;
          margin-bottom: 18px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
        }

        .kpi {
          padding: 14px 18px 14px 0;
          border-right: 1px solid #d4d4d4;
        }

        .kpi:last-child {
          border-right: none;
          padding-right: 0;
        }

        .kpi:not(:first-child) {
          padding-left: 18px;
        }

        .kpi-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 8px;
        }

        .kpi-value {
          font-size: 20px;
          font-weight: 800;
          color: #000;
          letter-spacing: -0.4px;
          line-height: 1.1;
        }

        /* ============================================================
           DISTRIBUIÇÃO FISCAL / DINHEIRO
           ============================================================ */
        .split-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
        }

        .split-item {
          padding: 18px 0;
        }

        .split-item:first-child {
          padding-right: 24px;
          border-right: 1px solid #000;
        }

        .split-item:last-child {
          padding-left: 24px;
        }

        .split-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #000;
          margin-bottom: 6px;
        }

        .split-percent {
          font-size: 10px;
          color: #888;
          font-weight: 500;
          letter-spacing: 0.3px;
          margin-bottom: 10px;
        }

        .split-value {
          font-size: 22px;
          font-weight: 800;
          color: #000;
          letter-spacing: -0.5px;
          line-height: 1;
        }

        /* ============================================================
           TABELA
           ============================================================ */
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
        }

        thead {
          border-top: 2px solid #000;
          border-bottom: 1px solid #000;
        }

        th {
          padding: 11px 10px;
          text-align: left;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #000;
          white-space: nowrap;
        }

        th.right  { text-align: right; }
        th.center { text-align: center; }

        td {
          padding: 11px 10px;
          border-bottom: 1px solid #e5e5e5;
          color: #222;
          font-weight: 400;
          font-size: 11.5px;
          vertical-align: top;
        }

        td.nome {
          font-weight: 700;
          color: #000;
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }

        td.right  { text-align: right; font-variant-numeric: tabular-nums; }
        td.center { text-align: center; }

        td.mono {
          font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
          font-size: 11px;
          color: #444;
        }

        td.desconto {
          color: #000;
          font-weight: 600;
        }

        td.zero {
          color: #bbb;
        }

        td.final {
          font-weight: 800;
          color: #000;
          font-size: 12px;
        }

        tbody tr:last-child td {
          border-bottom: 1px solid #000;
        }

        /* Linha de TOTAL */
        tfoot td {
          padding-top: 14px;
          padding-bottom: 4px;
          font-weight: 800;
          color: #000;
          border-bottom: none;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
        }

        tfoot td.valor {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: none;
        }

        /* ============================================================
           RODAPÉ / ASSINATURA
           ============================================================ */
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #000;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          font-size: 9px;
          color: #666;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .footer-info {
          line-height: 1.8;
        }

        .footer-info strong {
          color: #000;
          font-weight: 700;
        }

        .footer-signature {
          text-align: right;
          line-height: 1.8;
        }

        .footer-signature .line {
          display: inline-block;
          width: 180px;
          border-top: 1px solid #666;
          padding-top: 4px;
          margin-top: 32px;
          text-align: center;
        }

        /* ============================================================
           IMPRESSÃO
           ============================================================ */
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            background: #fff;
            padding: 0;
            font-size: 11px;
          }

          .page {
            box-shadow: none;
            padding: 0;
            max-width: 100%;
          }

          .no-print { display: none !important; }

          .title { font-size: 24px; }
          .kpi-value { font-size: 16px; }
          .split-value { font-size: 17px; }

          th { padding: 7px 8px; font-size: 8.5px; }
          td { padding: 7px 8px; font-size: 10.5px; }

          /* Evita quebra de linha em branco */
          tr, .kpi, .split-item { page-break-inside: avoid; }

          /* Repete cabeçalho da tabela em cada página */
          thead { display: table-header-group; }

          /* Não imprime linhas "hover" */
          tbody tr:hover { background: transparent; }
        }

        /* ============================================================
           BOTÃO IMPRIMIR (visível só na tela)
           ============================================================ */
        .actions {
          max-width: 900px;
          margin: 24px auto 0;
          text-align: right;
        }

        .btn-imprimir {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 24px;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 2px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .btn-imprimir:hover { opacity: 0.85; }
      </style>
    </head>
    <body>
      <div class="page">

        <!-- CABEÇALHO -->
        <header class="header">
          <div>
            <div class="brand">Sophon · Não Conformidades</div>
            <h1 class="title">Relatório de Comissões</h1>
            <p class="subtitle">${mesesNomes[mes - 1]} de ${ano}</p>
          </div>
          <div class="meta">
            <div>Emitido em <strong>${dataEmissao}</strong></div>
            <div>às <strong>${horaEmissao}</strong></div>
          </div>
        </header>

        <!-- RESUMO EXECUTIVO -->
        <section class="section">
          <div class="section-label">Resumo do Período</div>
          <div class="kpi-grid">
            <div class="kpi">
              <div class="kpi-label">Total a Pagar</div>
              <div class="kpi-value">${formatarMoeda(totalGeral)}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Colaboradores</div>
              <div class="kpi-value">${dados.length}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Descontos</div>
              <div class="kpi-value">${formatarMoeda(totalDescontos)}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">NCs</div>
              <div class="kpi-value">${totalNCs}</div>
            </div>
          </div>
        </section>

        <!-- DISTRIBUIÇÃO -->
        <section class="section">
          <div class="section-label">Distribuição por Tipo de Pagamento</div>
          <div class="split-grid">
            <div class="split-item">
              <div class="split-label">Valor Fiscal</div>
              <div class="split-percent">${percentuais?.percentualFiscal || 100}% do total</div>
              <div class="split-value">${formatarMoeda(totalFiscal)}</div>
            </div>
            <div class="split-item">
              <div class="split-label">Valor em Dinheiro</div>
              <div class="split-percent">${percentuais?.percentualDinheiro || 0}% do total</div>
              <div class="split-value">${formatarMoeda(totalDinheiro)}</div>
            </div>
          </div>
        </section>

        <!-- TABELA -->
        <section class="section">
          <div class="section-label">Detalhamento por Colaborador</div>
          <table>
            <thead>
              <tr>
                <th>Colaborador</th>
                <th class="right">Salário Base</th>
                <th class="center">NCs</th>
                <th class="right">Desconto</th>
                <th class="right">Salário Final</th>
                <th class="right">Fiscal</th>
                <th class="right">Dinheiro</th>
              </tr>
            </thead>
            <tbody>
              ${dados.map(item => {
                const salarioFinal = item.salario_final || 0;
                const desconto = item.valor_total_desconto || 0;
                const temDesconto = desconto > 0;
                const valorFiscal = salarioFinal * ((percentuais?.percentualFiscal || 100) / 100);
                const valorDinheiro = salarioFinal * ((percentuais?.percentualDinheiro || 0) / 100);
                const ncsFormatado = (() => {
                  const p = item.total_ncs_proprias || 0;
                  const s = item.total_ncs_subordinados || 0;
                  if (s === 0) return `${p}`;
                  return `${p} + ${s} sub${s > 1 ? 's' : ''}`;
                })();

                return `
                  <tr>
                    <td class="nome">${item.nome_colaborador}</td>
                    <td class="right">${formatarMoeda(item.salario_base)}</td>
                    <td class="center mono">${ncsFormatado}</td>
                    <td class="right ${temDesconto ? 'desconto' : 'zero'}">${formatarMoeda(desconto)}</td>
                    <td class="right final">${formatarMoeda(salarioFinal)}</td>
                    <td class="right">${formatarMoeda(valorFiscal)}</td>
                    <td class="right">${formatarMoeda(valorDinheiro)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3">Total (${dados.length} colaboradores)</td>
                <td class="right valor">${formatarMoeda(totalDescontos)}</td>
                <td class="right valor">${formatarMoeda(totalGeral)}</td>
                <td class="right valor">${formatarMoeda(totalFiscal)}</td>
                <td class="right valor">${formatarMoeda(totalDinheiro)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <!-- RODAPÉ -->
        <footer class="footer">
          <div class="footer-info">
            <div><strong>Sophon · Não Conformidades</strong></div>
            <div>Relatório gerado automaticamente pelo sistema</div>
            <div>${dataEmissao} · ${horaEmissao}</div>
          </div>
          <div class="footer-signature">
            <div class="line">Responsável</div>
          </div>
        </footer>

      </div>

      <!-- BOTÃO IMPRIMIR -->
      <div class="actions no-print">
        <button class="btn-imprimir" onclick="window.print()">
          Imprimir / Salvar como PDF
        </button>
      </div>
    </body>
    </html>
  `;

  const novaJanela = window.open('', '_blank');
  novaJanela.document.write(htmlConteudo);
  novaJanela.document.close();

  console.log('✅ Relatório pronto para impressão (P&B editorial)');
};