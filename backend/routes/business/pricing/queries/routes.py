"""
Rotas para o módulo de Consultas de Precificação.
Define os endpoints da API e delega a lógica para os serviços.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Dict, Any

from security import requer_permissao
from .schemas import LoteRequisicao, ProdutoSearchRequest
from .services import QueriesService


router = APIRouter(prefix="/precificacao", tags=["Precificação - Consultas"])


@router.get("/divergencias-markup")
async def buscar_divergencias_markup(
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(requer_permissao("precificacao:consultar"))
):
    """Busca divergências de markup nos produtos."""
    return await QueriesService.buscar_divergencias_markup(ambiente)


@router.get("/produto/{registro}")
async def buscar_registro_inteligente(
    registro: str, 
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    is_numord: bool = Query(False),
    usuario: str = Depends(requer_permissao("precificacao:consultar"))
):
    """Busca inteligente de produtos por código ou nota fiscal."""
    resultado = await QueriesService.buscar_registro_inteligente(registro, ambiente, is_numord)
    
    # Mantém compatibilidade com o formato de resposta original
    if resultado.get("action") == "select_note":
        return resultado
    elif resultado.get("action") == "found":
        return resultado["data"]
    
    return resultado


@router.post("/produtos-lote")
async def buscar_produtos_em_lote(
    lote: LoteRequisicao,
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(requer_permissao("precificacao:consultar"))
):
    """Busca múltiplos produtos em lote."""
    return await QueriesService.buscar_produtos_em_lote(lote.codigos, ambiente)


@router.get("/classificacoes")
async def listar_classificacoes(
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(requer_permissao("precificacao:consultar"))
):
    """Lista todas as classificações de produtos."""
    return await QueriesService.listar_classificacoes(ambiente)


@router.get("/fornecedores")
async def listar_fornecedores(
    termo: str = "", 
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(requer_permissao("precificacao:consultar"))
):
    """Lista fornecedores com filtro por nome."""
    return await QueriesService.listar_fornecedores(termo, ambiente)


@router.get("/pesquisar")
async def pesquisar_produto_avancado(
    termo: str = "", 
    codigo: str = "",
    fornecedor: str = "",
    classificacao: str = "",
    disponibilidade: str = "",
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(requer_permissao("precificacao:consultar"))
):
    """Pesquisa avançada de produtos com múltiplos filtros."""
    return await QueriesService.pesquisar_produto_avancado(
        termo=termo,
        codigo=codigo,
        fornecedor=fornecedor,
        classificacao=classificacao,
        disponibilidade=disponibilidade,
        ambiente=ambiente
    )
