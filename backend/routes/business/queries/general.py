"""
Rotas de Consultas Gerais - Produtos, Notas, Classificações, Fornecedores
Módulo Business/Queries: Responsável por consultas e leitura de dados do sistema.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from database import executar_query
from security import requer_permissao
from sql_repo import Scripts

router = APIRouter(prefix="/queries", tags=["Consultas Gerais"])

AMBIENTES = {
    "producao": "Bdenter",
    "demo": "bddemo",
    "treina": "bdtreina"
}

class LoteRequisicao(BaseModel):
    codigos: list[str]

# Queries SQL são importadas de sql_repo.py
QUERIES = Scripts.query

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
