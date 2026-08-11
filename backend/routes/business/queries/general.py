"""
Rotas de Consultas Gerais - Produtos, Notas, Classificações, Fornecedores
Módulo Business/Queries: Responsável por consultas e leitura de dados do sistema.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from database import executar_query
from security import requer_permissao

router = APIRouter(prefix="/queries", tags=["Consultas Gerais"])

AMBIENTES = {
    "producao": "Bdenter",
    "demo": "bddemo",
    "treina": "bdtreina"
}

class LoteRequisicao(BaseModel):
    codigos: list[str]

# Queries SQL otimizadas
QUERIES = {
    'consulta_codigo': """  
        WITH 
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
        produtos_calculados AS (
            SELECT 
                *,
                ISNULL((SELECT SUM(QUANT) FROM ITEMFILEST WHERE codpro = produtos_base.codpro), 0) AS QUANT,
                ISNULL((
                    SELECT TOP 1 ValorFornecedor 
                    FROM Pesquisa 
                    WHERE CodigoExterno = produtos_base.codpro 
                    ORDER BY Oid DESC
                ), 0) AS P_LISTA,
                CASE 
                    WHEN MargemLuc = 0 THEN 0
                    WHEN (MargemLuc/(100 - MargemLuc)) * 100 > 99999.9 THEN 99999.9
                    ELSE (MargemLuc/(100 - MargemLuc)) * 100
                END AS MKP,
                CASE 
                    WHEN PrecoComp = 0 THEN 0
                    WHEN ((PrecoVen - PrecoComp) / PrecoComp) * 100 > 99999.9 THEN 99999.9
                    ELSE ((PrecoVen - PrecoComp) / PrecoComp) * 100
                END AS MKP_REAL
            FROM produtos_base
        ),
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
        SELECT 
            CONVERT(varchar, r.DtUltComp, 23) AS ENT,
            CONVERT(varchar, r.Dtultrea, 23) AS REM,
            r.codpro AS COD,
            r.DescricaoLonga AS DESCRICAO,
            CAST(ISNULL(r.QUANT, 0) AS DECIMAL(18,2)) AS QUAN,
            r.Unid1 AS UND,
            CAST(ISNULL(r.P_LISTA, 0) AS DECIMAL(18,2)) AS P_LISTA,
            CAST(COALESCE(icms.icms_valor, nr.valor_calculado, 0) AS DECIMAL(18,2)) AS ICMS,
            CAST(ISNULL(fr.frete_valor, 0) AS DECIMAL(18,2)) AS FRETE,
            nr.valoripi,
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
            a.valoripi as valoripi,
            CAST(b.precocomp AS DECIMAL(18,4)) AS RS_CUSTO,
            CAST(b.precoven AS DECIMAL(18,4)) AS RS_VEN_REAL,
            CAST(CASE WHEN b.margemluc = 0 THEN 0 ELSE (b.margemluc/(100-b.margemluc))*100 END AS DECIMAL(18,2)) AS MKP,
            CAST(CASE WHEN b.precocomp = 0 THEN 0 ELSE ((b.precoven-b.precocomp)/b.precocomp)*100 END AS DECIMAL(18,2)) AS MKP_REAL,
            CAST(
                (CASE WHEN b.precocomp = 0 THEN 0 ELSE ((b.precoven-b.precocomp)/b.precocomp)*100 END) -
                (CASE WHEN b.margemluc = 0 THEN 0 ELSE (b.margemluc/(100-b.margemluc))*100 END)
                AS DECIMAL(18,2)
            ) AS DIF_MKP,
            CAST(b.precocomp * (1 + (CASE WHEN b.margemluc = 0 THEN 0 ELSE (b.margemluc/(100-b.margemluc))*100 END / 100)) AS DECIMAL(18,4)) AS RS_VENDA_SUG,
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
    """
}

@router.get("/divergencias-markup", dependencies=[Depends(requer_permissao("precificacao:visualizar"))])
async def buscar_divergencias_markup(
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(requer_permissao("precificacao:visualizar"))
):
    """Busca divergências de markup nos produtos."""
    db_name = AMBIENTES[ambiente]
    query = """
        SELECT codpro, custo, preco_venda, markup, 
               (custo * 1.5) as preco_sugerido  -- Exemplo: markup sugerido 50%
        FROM PRODUTOCAD
        WHERE preco_venda < custo * 1.3  -- Divergência: markup abaixo de 30%
        ORDER BY codpro
    """
    
    dados = await executar_query(
        banco=db_name, 
        query=query, 
        params=(), 
        usuario="SISTEMA", 
        endpoint="/api/divergencias-markup"
    )
    return dados

@router.get("/produto/{registro}", dependencies=[Depends(requer_permissao("precificacao:visualizar"))])
async def buscar_registro_inteligente(
    registro: str, 
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(requer_permissao("precificacao:visualizar"))
):
    """Busca inteligente de produtos por código ou nota fiscal."""
    db_name = AMBIENTES[ambiente]
    
    # Tenta buscar como código de produto primeiro
    registro_formatado = str(registro).zfill(5)
    
    # Verifica se é um código de produto válido (apenas números)
    if registro.isdigit():
        # Busca notas fiscais deste produto para obter o numord mais recente
        query_notas = QUERIES['buscar_notas_produto']
        notas_encontradas = await executar_query(
            banco=db_name, 
            query=query_notas, 
            params=(registro_formatado,), 
            usuario="SISTEMA", 
            endpoint="/api/notas-produto"
        )
        
        # Se encontrou notas, usa a query completa de produto
        if notas_encontradas and len(notas_encontradas) > 0:
            query = QUERIES['consulta_codigo'].format(codigos=f"'{registro_formatado}'")
            dados = await executar_query(
                banco=db_name, 
                query=query, 
                params=(), 
                usuario="SISTEMA", 
                endpoint=f"/api/produto/{registro}"
            )
            return dados if dados else []
    
    # Se não encontrou como código, tenta como número de nota
    query_nota = QUERIES['consulta_nota']
    dados_nota = await executar_query(
        banco=db_name, 
        query=query_nota, 
        params=(registro,), 
        usuario="SISTEMA", 
        endpoint=f"/api/nota/{registro}"
    )
    
    if dados_nota:
        return dados_nota
    
    raise HTTPException(status_code=404, detail="Nenhum registro encontrado para esta busca.")

@router.post("/produtos-lote", dependencies=[Depends(requer_permissao("precificacao:visualizar"))])
async def buscar_produtos_em_lote(
    lote: LoteRequisicao,
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(requer_permissao("precificacao:visualizar"))
):
    """Busca múltiplos produtos em lote."""
    if not lote.codigos:
        return []

    db_name = AMBIENTES[ambiente]
    codigos_formatados = ",".join(f"'{str(c).strip()}'" for c in lote.codigos)
    
    query = f"""
        SELECT p.codpro, p.preco_venda, p.custo, p.markup, cp.descricaolonga
        FROM PRODUTOCAD p
        LEFT JOIN complementoproduto cp ON p.codpro = cp.codpro
        WHERE p.codpro IN ({codigos_formatados})
    """
        
    dados = await executar_query(
        banco=db_name, 
        query=query, 
        params=(), 
        usuario="SISTEMA", 
        endpoint="/api/produtos-lote"
    )
    
    if not dados:
        return []
        
    return dados

@router.get("/classificacoes", dependencies=[Depends(requer_permissao("precificacao:visualizar"))])
async def listar_classificacoes(
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(requer_permissao("precificacao:visualizar"))
):
    """Lista todas as classificações de produtos."""
    db_name = AMBIENTES[ambiente]
    query = "SELECT clasprod as codigo, descr FROM CLASSIFCAD ORDER BY clasprod"
    dados = await executar_query(
        banco=db_name, 
        query=query, 
        params=(), 
        usuario="SISTEMA", 
        endpoint="/api/classificacoes"
    )
    return dados if dados else []

@router.get("/fornecedores", dependencies=[Depends(requer_permissao("precificacao:visualizar"))])
async def listar_fornecedores(
    termo: str = "", 
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(requer_permissao("precificacao:visualizar"))
):
    """Lista fornecedores com filtro por nome."""
    db_name = AMBIENTES[ambiente]
    query = "SELECT OID, NOME FROM FORNECECAD WHERE NOME LIKE ? ORDER BY NOME"
    dados = await executar_query(
        banco=db_name, 
        query=query, 
        params=(f"%{termo}%",), 
        usuario="SISTEMA", 
        endpoint="/api/fornecedores"
    )
    return dados if dados else []

@router.get("/pesquisar", dependencies=[Depends(requer_permissao("precificacao:visualizar"))])
async def pesquisar_produto_avancado(
    termo: str = "", 
    codigo: str = "",
    fornecedor: str = "",
    classificacao: str = "",
    disponibilidade: str = "",
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(requer_permissao("precificacao:visualizar"))
):
    """Pesquisa avançada de produtos com múltiplos filtros."""
    db_name = AMBIENTES[ambiente]
    
    query = """
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
    """
    
    conditions = []
    params = []
    
    if termo:
        conditions.append("cp.descricaolonga LIKE ?")
        params.append(f"%{termo}%")
        
    if codigo:
        conditions.append("p.codpro LIKE ?")
        params.append(f"%{codigo}%")
        
    if fornecedor:
        conditions.append("f.NOME LIKE ?")
        params.append(f"%{fornecedor}%")
            
    if classificacao:
        if " - " in classificacao:
            clasprod = classificacao.split(" - ")[0].strip().replace(".", "")
            conditions.append("p.clasprod LIKE ?")
            params.append(f"{clasprod}%")
        else:
            class_limpa = classificacao.replace(".", "").strip()
            if class_limpa.isdigit():
                conditions.append("p.clasprod LIKE ?")
                params.append(f"{class_limpa}%")
            else:
                conditions.append("c.descr LIKE ?")
                params.append(f"%{classificacao}%")

    if disponibilidade:
        status_list = disponibilidade.split(',')
        placeholders = ",".join(["?"] * len(status_list))
        conditions.append(f"i.NOME IN ({placeholders})")
        params.extend(status_list)
    
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    
    query += " ORDER BY p.codpro"
    
    dados = await executar_query(
        banco=db_name, 
        query=query, 
        params=tuple(params), 
        usuario="SISTEMA", 
        endpoint="/api/pesquisar"
    )
    return dados if dados else []
