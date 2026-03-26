class Scripts:
    query = {

        'consulta_codigo' : """  
        WITH remarcacao AS (  
            SELECT 
                PC.codpro COD,
                CP.DescricaoLonga DESCRICAO,
                PC.Unid1 UND,
                PC.DtUltComp ENT,
                PC.Dtultrea REM,
                CP.CodProFabricante CodFab,
                (SELECT SUM(IT.QUANT) FROM ITEMFILEST IT WHERE PC.codpro = IT.codpro GROUP BY IT.CODPRO) QUANT,
                CAST(PC.PrecoComp AS decimal(18,4)) AS [P_CUSTO],
                CASE 
                    WHEN (PC.MargemLuc/(100 - PC.MargemLuc)) * 100 > 99999.9 THEN CAST(99999.9 AS decimal(18,4))
                    ELSE CAST((PC.MargemLuc/(100 - PC.MargemLuc)) * 100 AS DECIMAL(18,4))
                END AS MKP,
                CAST(PC.PrecoVen AS decimal(18,4)) AS [P_ATUAL],
                (SELECT TOP 1 ValorFornecedor 
                 FROM Pesquisa PQ 
                 WHERE PQ.CodigoExterno = PC.CodPro 
                 ORDER BY PQ.Oid DESC) AS [P_LISTA],
                CASE 
                    WHEN PC.precocomp = 0 THEN 0  
                    WHEN ((PC.PrecoVen - PC.PrecoComp) / PC.PrecoComp) * 100 > 99999.9 THEN CAST(99999.9 AS decimal(18,4))
                    ELSE CAST(((PC.PrecoVen - CAST(PC.PrecoComp AS decimal(18,4))) / CAST(PC.PrecoComp AS decimal(18,4))) * 100 AS decimal(18,4))
                END AS MKP_REAL,
                PC.faconv CONV
            FROM ComplementoProduto CP
            JOIN ProdutoCad PC ON CP.CodPro = PC.CodPro
            LEFT JOIN ClaFiscCad CF ON PC.CF = CF.CF
            WHERE PC.CodPro IN (?)
        ),

        NotaMaisRecente AS (
            SELECT 
                codpro,
                i.NUMORD, 
                nf.numnota,
                i.valsubstri / NULLIF(i.quant, 0) AS valor_calculado,
                ROW_NUMBER() OVER (PARTITION BY codpro ORDER BY I.dtcheg DESC) AS rn,
                nf.despincl DESPESAS
            FROM ITNFENTCAD i 
            INNER JOIN remarcacao r ON r.COD = i.codpro
            INNER JOIN NFENTRACAD NF ON i.numord = nf.numord
            WHERE i.serie NOT LIKE '%dv%'
        ),

        ICMSMaisRecente AS (
            SELECT 
                PC.codpro,
                COMPOSICAO_r.VALOR AS icms_valor,
                NMR.NUMORD, 
                ROW_NUMBER() OVER (PARTITION BY PC.codpro ORDER BY PESQUISA_R.criadoem DESC) AS rn
            FROM PRODUTOCAD PC
            JOIN PESQUISA_R ON PC.codpro = PESQUISA_R.CODIGOEXTERNO
            JOIN COMPOSICAO_R ON PESQUISA_R.oid = COMPOSICAO_R.RPESQUISA
            JOIN NotaMaisRecente NMR ON PC.codpro = NMR.codpro 
            WHERE COMPOSICAO_R.RTIPOPESQUISA = '3035525' AND rn = 1
        )

        -- SELECT FINAL: Retornando números puros para cálculos no Frontend
        SELECT 
            -- Datas em formato ISO (YYYY-MM-DD) para compatibilidade com Javascript
            CONVERT(varchar, r.ENT, 23) AS ENT,
            CONVERT(varchar, r.REM, 23) AS REM,
            r.COD,
            r.DESCRICAO,
            CAST(ISNULL(r.QUANT, 0) AS DECIMAL(18,2)) AS QUAN,
            r.UND,
            CAST(ISNULL(r.[P_LISTA], 0) AS DECIMAL(18,2)) AS P_LISTA,
            CAST(CASE 
                WHEN icms.icms_valor IS NOT NULL THEN icms.icms_valor
                ELSE NMR.valor_calculado
            END AS DECIMAL(18,2)) AS ICMS,
            CAST(ISNULL((
                SELECT TOP 1 c.VALOR 
                FROM PESQUISA_R P 
                JOIN COMPOSICAO_R C ON p.oid = C.RPESQUISA 
                JOIN produtocad ON produtocad.codpro = P.CODIGOEXTERNO
                WHERE RTIPOPESQUISA IN ('2796133' , '2796136') 
                AND numord = nmr.numord 
                AND codpro = r.COD 
                ORDER BY RPESQUISA DESC
            ), 0) AS DECIMAL(18,2)) AS FRETE,
            CAST(ISNULL(NMR.DESPESAS, 0) AS DECIMAL(18,2)) AS OUTROS,
            
            -- VALORES CRÍTICOS COMO NÚMEROS (DECIMAL)
            CAST(r.[P_CUSTO] AS DECIMAL(18,4)) AS P_CUSTO,
            CAST(r.[P_CUSTO] * (1 + (r.MKP / 100)) AS DECIMAL(18,4)) AS P_SUGER,
            CAST(r.[P_ATUAL] AS DECIMAL(18,4)) AS P_ATUAL,
            CAST(r.MKP_REAL AS DECIMAL(18,4)) AS MKP_REAL,
            CAST(r.MKP AS DECIMAL(18,4)) AS MKP,
            CAST(r.MKP_REAL - r.MKP AS DECIMAL(18,4)) AS DIF_MKP,
            CAST(r.CONV AS DECIMAL(18,2)) AS CONVER

        FROM remarcacao r
        LEFT JOIN NotaMaisRecente NMR ON r.COD = NMR.codpro AND NMR.rn = 1
        LEFT JOIN ICMSMaisRecente icms ON r.COD = icms.codpro AND icms.rn = 1 AND icms.NUMORD = NMR.NUMORD;
        """,   

        'consulta_nota' : """
        WITH calculateddata AS (
            SELECT 
                CONVERT(varchar, b.Dtultrea, 23) AS REM,
                CONVERT(varchar, b.DtUltComp, 23) AS ENT,
                a.codpro COD,
                c.descricaolonga DESCRICAO,
                a.quant AS QUAN,
                a.unidade UND,
                a.preco AS RS_LISTA,
                b.precocomp AS CUSTO_RAW,
                b.precoven AS VENDA_RAW,
                CASE WHEN b.margemluc=0 THEN 0 ELSE CAST(((b.margemluc/(100-b.margemluc))*100) AS DECIMAL(18,2)) END AS MKP,
                CASE WHEN b.precocomp=0 THEN 0 ELSE CAST(((b.precoven-b.precocomp)/b.precocomp)*100 AS DECIMAL(18,2)) END AS MKP_REAL,
                CASE 
                    WHEN ISNULL((SELECT TOP 1 COMPOSICAO_r.VALOR FROM PRODUTOCAD JOIN PESQUISA_R ON produtocad.codpro = PESQUISA_R.CODIGOEXTERNO JOIN COMPOSICAO_R ON pesquisa_r.oid = COMPOSICAO_R.RPESQUISA WHERE a.codpro = produtocad.codpro AND RTIPOPESQUISA = '3035525' AND numord = a.numord), 0) = 0 
                    THEN (a.valsubstri)/NULLIF(a.quant, 0)
                    ELSE (SELECT TOP 1 COMPOSICAO_r.VALOR FROM PRODUTOCAD JOIN PESQUISA_R ON produtocad.codpro = PESQUISA_R.CODIGOEXTERNO JOIN COMPOSICAO_R ON pesquisa_r.oid = COMPOSICAO_R.RPESQUISA WHERE a.codpro = produtocad.codpro AND RTIPOPESQUISA = '3035525' AND numord = a.numord)
                END AS ICMS,
                isnull((select top 1 c.VALOR from PESQUISA_R P JOIN COMPOSICAO_R C ON p.oid = C.RPESQUISA JOIN produtocad ON produtocad.codpro = P.CODIGOEXTERNO where RTIPOPESQUISA in ('2796133' , '2796136') and numord = a.numord and codpro = b.codpro order by RPESQUISA desc), 0) AS FRETE,
                nf.despincl DESPESAS,
                a.faconv CONVER
            FROM ITNFENTCAD a, produtocad b, complementoproduto c, NFENTRACAD nf
            WHERE a.codpro = b.codpro AND b.codpro = c.codpro and nf.numord = a.numord AND a.numord = ?
        )
        SELECT 
            ENT, REM, COD, DESCRICAO, 
            CAST(QUAN AS DECIMAL(18,2)) AS QUAN, UND, 
            CAST(RS_LISTA AS DECIMAL(18,2)) AS RS_LISTA, ICMS, 
            CAST(FRETE AS DECIMAL(18,2)) AS FRETE, 
            CAST(DESPESAS AS DECIMAL(18,2)) AS OUTROS,
            CAST(CUSTO_RAW AS DECIMAL(18,4)) AS RS_CUSTO, 
            CAST(CUSTO_RAW * (1+(MKP/100)) AS DECIMAL(18,4)) AS RS_VENDA_SUG,
            CAST(VENDA_RAW AS DECIMAL(18,4)) AS RS_VEN_REAL, 
            CAST(MKP_REAL AS DECIMAL(18,4)) AS MKP_REAL, 
            CAST(MKP AS DECIMAL(18,4)) AS MKP, 
            CAST(MKP_REAL - MKP AS DECIMAL(18,4)) AS DIF_MKP,
            CAST(CONVER AS DECIMAL(18,2)) AS CONVER
        FROM calculateddata
        ORDER BY CUSTO_RAW
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

        'remarcação' : """                     
        UPDATE produtocad
        SET precoven = ?, Dtultrea = GETDATE()
        WHERE codpro = ? 
        """,
        
        'atualiza_mkp' : """
        UPDATE Produtocad 
        SET MargemLuc = (100 * CAST(? AS FLOAT)) / (100 + CAST(? AS FLOAT)) 
        WHERE codpro = ? 
        """,

        'atualiza_custo' : """
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
        LEFT JOIN complementoproduto cp on p.codpro = cp.codpro
        LEFT JOIN FORNECECAD f ON p.codfor = f.oid
        LEFT JOIN item i ON p.Disponibilidade = i.OID
        LEFT JOIN CLASSIFCAD c ON p.clasprod = c.clasprod
        WHERE 1=1
        """,

        'listar_fornecedores' : "SELECT OID, nome FROM FORNECECAD WHERE 1=1",

        'listar_classificacoes' : """
        SELECT * FROM (              
            SELECT DISTINCT substring(p.clasprod, 1,6) as codigo, c.descr
            FROM PRODUTOCAD p 
            INNER JOIN CLASSIFCAD c ON p.clasprod = c.clasprod
        ) classes
        WHERE 1=1 
        """,

        'Selecionar_Nota' : "SELECT numord, numnota, CONVERT(varchar, nf.dtcheg, 23) AS data FROM nfentracad nf WHERE 1=1"
    }