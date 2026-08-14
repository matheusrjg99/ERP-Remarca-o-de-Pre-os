class Scripts:
    query = {

        'consulta_codigo': """  
        WITH 
        -- 1. FILTRO INICIAL (mais restritivo primeiro)
        produtos_base AS (
            SELECT 
                PC.codpro,
                CP.DescricaoLonga,
                PC.Unid1,
                PC.DtUltComp,
                PC.Dtultrea,
                PC.PrecoComp,
                PC.PrecoVen,
                PC.MargemLuc,
                PC.faconv
            FROM ProdutoCad PC
            INNER JOIN ComplementoProduto CP ON CP.CodPro = PC.CodPro
            WHERE PC.CodPro IN ({codigos})
        ),

        -- 2. Cálculos (uma vez só)
        produtos_calculados AS (
            SELECT 
                *,
                -- QUANT (busca direta)
                ISNULL((SELECT SUM(QUANT) FROM ITEMFILEST WHERE codpro = produtos_base.codpro), 0) AS QUANT,
                -- P_LISTA
                ISNULL((
                    SELECT TOP 1 ValorFornecedor 
                    FROM Pesquisa 
                    WHERE CodigoExterno = produtos_base.codpro 
                    ORDER BY Oid DESC
                ), 0) AS P_LISTA,
                -- MKP
                CASE 
                    WHEN MargemLuc = 0 THEN 0
                    WHEN (MargemLuc/(100 - MargemLuc)) * 100 > 99999.9 THEN 99999.9
                    ELSE (MargemLuc/(100 - MargemLuc)) * 100
                END AS MKP,
                -- MKP_REAL
                CASE 
                    WHEN PrecoComp = 0 THEN 0
                    WHEN ((PrecoVen - PrecoComp) / PrecoComp) * 100 > 99999.9 THEN 99999.9
                    ELSE ((PrecoVen - PrecoComp) / PrecoComp) * 100
                END AS MKP_REAL
            FROM produtos_base
        ),

        -- 3. NOTA MAIS RECENTE (usando CROSS APPLY - mais rápido)
        NotaMaisRecente AS (
            SELECT 
                r.codpro,
                i.NUMORD, 
                i.valsubstri / NULLIF(i.quant, 0) AS valor_calculado,
                nf.despincl AS DESPESAS,
                i.valoripi
            FROM produtos_calculados r
            CROSS APPLY (
                SELECT TOP 1 *
                FROM ITNFENTCAD i 
                WHERE i.codpro = r.codpro 
                AND i.serie NOT LIKE '%dv%'
                ORDER BY i.dtcheg DESC
            ) i
            INNER JOIN NFENTRACAD nf ON i.numord = nf.numord
        ),

        -- 4. ICMS MAIS RECENTE
        ICMSMaisRecente AS (
            SELECT 
                r.codpro,
                CR.VALOR AS icms_valor,
                NMR.NUMORD
            FROM produtos_calculados r
            CROSS APPLY (
                SELECT TOP 1 *
                FROM PESQUISA_R 
                WHERE CODIGOEXTERNO = r.codpro
                ORDER BY criadoem DESC
            ) PR
            INNER JOIN COMPOSICAO_R CR ON PR.oid = CR.RPESQUISA
            INNER JOIN NotaMaisRecente NMR ON r.codpro = NMR.codpro
            WHERE CR.RTIPOPESQUISA = '3035525'
        ),

        -- 5. FRETE MAIS RECENTE
        FreteMaisRecente AS (
            SELECT 
                r.codpro,
                CR.VALOR AS frete_valor,
                NMR.NUMORD
            FROM produtos_calculados r
            CROSS APPLY (
                SELECT TOP 1 *
                FROM PESQUISA_R 
                WHERE CODIGOEXTERNO = r.codpro
                ORDER BY criadoem DESC
            ) PR
            INNER JOIN COMPOSICAO_R CR ON PR.oid = CR.RPESQUISA
            INNER JOIN NotaMaisRecente NMR ON r.codpro = NMR.codpro
            WHERE CR.RTIPOPESQUISA IN ('2796133', '2796136')
        )

        -- SELECT FINAL
        SELECT 
            CONVERT(varchar, r.DtUltComp, 23) AS ENT,
            CONVERT(varchar, r.Dtultrea, 23) AS REM,
            r.codpro AS COD,
            r.DescricaoLonga AS DESCRICAO,
            CAST(ISNULL(r.QUANT, 0) AS DECIMAL(18,2)) AS QUAN,
            r.Unid1 AS UND,
            CAST(ISNULL(r.P_LISTA, 0) AS DECIMAL(18,2)) AS P_LISTA,
            
            -- ICMS (prioriza pesquisa, fallback para nota)
            CAST(COALESCE(icms.icms_valor, nr.valor_calculado, 0) AS DECIMAL(18,2)) AS ICMS,
            
            -- FRETE
            CAST(ISNULL(fr.frete_valor, 0) AS DECIMAL(18,2)) AS FRETE,
            
            -- OUTROS (despesas da nota)
            nr.valoripi,
            
            -- VALORES
            CAST(r.PrecoComp AS DECIMAL(18,4)) AS P_CUSTO,
            CAST(r.PrecoComp * (1 + (r.MKP / 100)) AS DECIMAL(18,4)) AS P_SUGER,
            CAST(r.PrecoVen AS DECIMAL(18,4)) AS P_ATUAL,
            CAST(r.MKP_REAL AS DECIMAL(18,4)) AS MKP_REAL,
            CAST(r.MKP AS DECIMAL(18,4)) AS MKP,
            CAST(r.MKP_REAL - r.MKP AS DECIMAL(18,4)) AS DIF_MKP,
            CAST(r.faconv AS DECIMAL(18,2)) AS CONVER

        FROM produtos_calculados r
        LEFT JOIN NotaMaisRecente nr ON r.codpro = nr.codpro
        LEFT JOIN ICMSMaisRecente icms ON r.codpro = icms.codpro AND icms.NUMORD = nr.NUMORD
        LEFT JOIN FreteMaisRecente fr ON r.codpro = fr.codpro AND fr.NUMORD = nr.NUMORD;
        """,

        'consulta_nota': """
        SELECT 
            CONVERT(varchar, b.Dtultrea, 23) AS REM,
            CONVERT(varchar, b.DtUltComp, 23) AS ENT,
            a.codpro AS COD,
            c.descricaolonga AS DESCRICAO,
            CAST(a.quant AS DECIMAL(18,2)) AS QUAN,
            a.unidade AS UND,
            CAST(a.preco AS DECIMAL(18,2)) AS RS_LISTA,
            
            -- ICMS: tenta da pesquisa, senão usa da nota
            CAST(
                ISNULL(
                    (SELECT TOP 1 CR.VALOR 
                    FROM PESQUISA_R PR
                    INNER JOIN COMPOSICAO_R CR ON PR.oid = CR.RPESQUISA
                    WHERE PR.CODIGOEXTERNO = a.codpro
                    AND CR.RTIPOPESQUISA = '3035525'
                    AND PR.numord = a.numord
                    ORDER BY PR.criadoem DESC),
                    a.valsubstri / NULLIF(a.quant, 0)
                ) AS DECIMAL(18,2)
            ) AS ICMS,
            
            -- FRETE
            CAST(
                ISNULL(
                    (SELECT TOP 1 CR.VALOR 
                    FROM PESQUISA_R PR
                    INNER JOIN COMPOSICAO_R CR ON PR.oid = CR.RPESQUISA
                    WHERE PR.CODIGOEXTERNO = a.codpro
                    AND CR.RTIPOPESQUISA IN ('2796133', '2796136')
                    AND PR.numord = a.numord
                    ORDER BY PR.criadoem DESC),
                    0
                ) AS DECIMAL(18,2)
            ) AS FRETE,
            
            -- ipi
            a.valoripi as valoripi,
            
            -- Custos e preços
            CAST(b.precocomp AS DECIMAL(18,4)) AS RS_CUSTO,
            CAST(b.precoven AS DECIMAL(18,4)) AS RS_VEN_REAL,
            
            -- Markups
            CAST(CASE WHEN b.margemluc = 0 THEN 0 ELSE (b.margemluc/(100-b.margemluc))*100 END AS DECIMAL(18,2)) AS MKP,
            CAST(CASE WHEN b.precocomp = 0 THEN 0 ELSE ((b.precoven-b.precocomp)/b.precocomp)*100 END AS DECIMAL(18,2)) AS MKP_REAL,
            
            -- Diferença MKP
            CAST(
                (CASE WHEN b.precocomp = 0 THEN 0 ELSE ((b.precoven-b.precocomp)/b.precocomp)*100 END) -
                (CASE WHEN b.margemluc = 0 THEN 0 ELSE (b.margemluc/(100-b.margemluc))*100 END)
                AS DECIMAL(18,2)
            ) AS DIF_MKP,
            
            -- Preço sugerido
            CAST(b.precocomp * (1 + (CASE WHEN b.margemluc = 0 THEN 0 ELSE (b.margemluc/(100-b.margemluc))*100 END / 100)) AS DECIMAL(18,4)) AS RS_VENDA_SUG,
            
            -- Conversão
            CAST(a.faconv AS DECIMAL(18,2)) AS CONVER
            
        FROM ITNFENTCAD a
        INNER JOIN produtocad b ON a.codpro = b.codpro
        INNER JOIN complementoproduto c ON b.codpro = c.codpro
        INNER JOIN NFENTRACAD nf ON a.numord = nf.numord
        WHERE a.numord = ?
        ORDER BY b.precocomp;
        """,

        'buscar_notas_por_numero': """
            SELECT 
                nf.numord, 
                nf.numnota, 
                CONVERT(varchar, nf.dtcheg, 23) AS data_chegada, 
                f.NOME AS fornecedor
            FROM NFENTRACAD nf 
            LEFT JOIN FORNECECAD f ON nf.codfor = f.oid 
            WHERE nf.numnota = ?
        """,

        'buscar_notas_produto': """
            SELECT DISTINCT numord FROM ITNFENTCAD WHERE codpro = ? ORDER BY dtcheg DESC
        """,

        'remarcação': """                     
            UPDATE produtocad
            SET precoven = ?, 
                Dtultrea = GETDATE()
            WHERE codpro = ? 
        """,

        'atualiza_mkp': """
            UPDATE Produtocad 
            SET MargemLuc = (100 * CAST(? AS FLOAT)) / (100 + CAST(? AS FLOAT)) 
            WHERE codpro = ? 
        """,

        'atualiza_custo': """
            UPDATE PRODUTOCAD
            SET precocomp = ?
            WHERE codpro = ?
        """,
        'pesquisar_produto': """
            SELECT
                p.codpro AS CODPRO,
                cp.descricaolonga AS DESCRICAOLONGA,
                f.NOME AS RAZSOC,
                c.descr AS CLASSIFICACAO,
                i.NOME AS STATUS_DISP
            FROM PRODUTOCAD p
            LEFT JOIN complementoproduto cp ON p.codpro = cp.codpro
            LEFT JOIN FORNECECAD f ON p.codfor = f.oid
            LEFT JOIN item i ON p.Disponibilidade = i.OID
            LEFT JOIN CLASSIFCAD c ON p.clasprod = c.clasprod
        """, 

        'listar_fornecedores': """
            SELECT OID, nome 
            FROM FORNECECAD 
            WHERE 1=1
            ORDER BY nome
        """,

        'listar_classificacoes': """
            SELECT DISTINCT 
                SUBSTRING(p.clasprod, 1, 6) AS codigo, 
                c.descr
            FROM PRODUTOCAD p 
            INNER JOIN CLASSIFCAD c ON p.clasprod = c.clasprod
            WHERE p.clasprod IS NOT NULL
            ORDER BY c.descr
        """,

        'Selecionar_Nota': """
            SELECT 
                numord, 
                numnota, 
                CONVERT(varchar, nf.dtcheg, 103) AS data
            FROM nfentracad nf 
            WHERE 1=1
            ORDER BY nf.dtcheg DESC
        """,

    'divergencia_markup': """  
    WITH 
    remarcacao AS (  
        SELECT 
            PC.codpro COD,
            CP.DescricaoLonga DESCRICAO,
            PC.Unid1 UND,
            PC.DtUltComp ENT,
            PC.Dtultrea REM,
            (SELECT SUM(IT.QUANT) FROM ITEMFILEST IT WHERE PC.codpro = IT.codpro) QUANT,
            CAST(PC.PrecoComp AS decimal(18,4)) AS [P_CUSTO],
            CASE 
                WHEN PC.MargemLuc = 0 THEN 0
                WHEN (PC.MargemLuc/(100 - PC.MargemLuc)) * 100 > 99999.9 THEN 99999.9
                ELSE (PC.MargemLuc/(100 - PC.MargemLuc)) * 100
            END AS MKP,
            CAST(PC.PrecoVen AS decimal(18,4)) AS [P_ATUAL],
            (SELECT TOP 1 ValorFornecedor 
            FROM Pesquisa PQ 
            WHERE PQ.CodigoExterno = PC.CodPro 
            ORDER BY PQ.Oid DESC) AS [P_LISTA],
            CASE 
                WHEN PC.precocomp = 0 THEN 0  
                WHEN ((PC.PrecoVen - PC.PrecoComp) / PC.PrecoComp) * 100 > 99999.9 THEN 99999.9
                ELSE ((PC.PrecoVen - PC.PrecoComp) / PC.PrecoComp) * 100
            END AS MKP_REAL,
            PC.faconv CONV
        FROM ComplementoProduto CP
        JOIN ProdutoCad PC ON CP.CodPro = PC.CodPro
        WHERE PC.Disponibilidade = 21073
        AND PC.PrecoComp > 0.83
        AND PC.codpro NOT IN (30750, 23405, 28728)
    ),

    produtos_com_divergencia AS (
        SELECT * FROM remarcacao 
        WHERE ABS(MKP_REAL - MKP) > 1.1
    ),

    NotaMaisRecente AS (
        SELECT 
            r.COD AS codpro,
            i.NUMORD, 
            nf.numnota,
            i.valsubstri / NULLIF(i.quant, 0) AS valor_calculado,
            nf.despincl AS DESPESAS,
            i.valoripi
        FROM produtos_com_divergencia r
        CROSS APPLY (
            SELECT TOP 1 *
            FROM ITNFENTCAD i 
            WHERE i.codpro = r.COD 
            AND i.serie NOT LIKE '%dv%'
            ORDER BY i.dtcheg DESC
        ) i
        INNER JOIN NFENTRACAD nf ON i.numord = nf.numord
    ),

    ICMSMaisRecente AS (
        SELECT 
            r.COD,
            COMPOSICAO_R.VALOR AS icms_valor,
            NMR.NUMORD
        FROM produtos_com_divergencia r
        CROSS APPLY (
            SELECT TOP 1 *
            FROM PESQUISA_R 
            WHERE CODIGOEXTERNO = r.COD
            ORDER BY criadoem DESC
        ) PR
        INNER JOIN COMPOSICAO_R ON PR.oid = COMPOSICAO_R.RPESQUISA
        INNER JOIN NotaMaisRecente NMR ON r.COD = NMR.codpro
        WHERE COMPOSICAO_R.RTIPOPESQUISA = '3035525'
    )

    SELECT 
        CONVERT(varchar, r.ENT, 23) AS ENT,
        CONVERT(varchar, r.REM, 23) AS REM,
        r.COD,
        r.DESCRICAO,
        CAST(ISNULL(r.QUANT, 0) AS DECIMAL(18,2)) AS QUAN,
        r.UND,
        CAST(ISNULL(r.P_LISTA, 0) AS DECIMAL(18,2)) AS P_LISTA,
        CAST(ISNULL(icms.icms_valor, NMR.valor_calculado) AS DECIMAL(18,2)) AS ICMS,
        CAST(ISNULL((
            SELECT TOP 1 CR.VALOR 
            FROM PESQUISA_R PR
            INNER JOIN COMPOSICAO_R CR ON PR.oid = CR.RPESQUISA
            WHERE PR.CODIGOEXTERNO = r.COD
            AND CR.RTIPOPESQUISA IN ('2796133', '2796136')
            AND PR.oid = NMR.NUMORD  -- CORRIGIDO: RPESQUISA -> oid
            ORDER BY PR.oid DESC
        ), 0) AS DECIMAL(18,2)) AS FRETE,
        nmr.valoripi,
        CAST(r.P_CUSTO AS DECIMAL(18,4)) AS P_CUSTO,
        CAST(r.P_CUSTO * (1 + (r.MKP / 100)) AS DECIMAL(18,4)) AS P_SUGER,
        CAST(r.P_ATUAL AS DECIMAL(18,4)) AS P_ATUAL,
        CAST(r.MKP_REAL AS DECIMAL(18,4)) AS MKP_REAL,
        CAST(r.MKP AS DECIMAL(18,4)) AS MKP,
        CAST(r.MKP_REAL - r.MKP AS DECIMAL(18,4)) AS DIF_MKP,
        CAST(r.CONV AS DECIMAL(18,2)) AS CONVER
    FROM produtos_com_divergencia r
    LEFT JOIN NotaMaisRecente NMR ON r.COD = NMR.codpro
    LEFT JOIN ICMSMaisRecente icms ON r.COD = icms.COD AND icms.NUMORD = NMR.NUMORD
    ORDER BY DIF_MKP DESC;
    """,
    }