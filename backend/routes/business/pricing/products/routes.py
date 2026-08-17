"""Routes para o módulo de Precificação de Produtos.

Apenas definição de endpoints, injeção de dependências e retorno de respostas HTTP.
Nenhuma regra de negócio ou SQL deve residir aqui.
"""

from fastapi import APIRouter, Depends, Query, Request
from typing import Optional, List
from backend.auth.seguranca import get_usuario_atual, requer_permissao
from .schemas import ProdutoPrecificacao, RecalculoRequest, ExportacaoRequest
from .services import ProdutoService

router = APIRouter(prefix="/pricing/products", tags=["Precificação - Produtos"])


def get_produto_service() -> ProdutoService:
    """Injeção de dependência do Service."""
    return ProdutoService()


@router.get("", response_model=List[ProdutoPrecificacao])
@requer_permissao("precificacao:consultar")
async def listar_produtos(
    request: Request,
    service: ProdutoService = Depends(get_produto_service),
    produto_id: Optional[int] = Query(None),
    descricao: Optional[str] = Query(None),
    grupo: Optional[str] = Query(None),
    subgrupo: Optional[str] = Query(None),
    marca: Optional[str] = Query(None),
    fornecedor_id: Optional[int] = Query(None),
    ativo: Optional[bool] = Query(None)
):
    """
    Lista produtos com precificação.
    Permissão necessária: precificacao:consultar
    """
    # Coleta filtros dinâmicos
    filtros = {
        "produto_id": produto_id,
        "descricao": descricao,
        "grupo": grupo,
        "subgrupo": subgrupo,
        "marca": marca,
        "fornecedor_id": fornecedor_id,
        "ativo": ativo
    }
    # Remove None values para não sujar a query
    filtros = {k: v for k, v in filtros.items() if v is not None}
    
    return await service.listar_produtos(filtros=filtros)


@router.get("/{produto_id}", response_model=ProdutoPrecificacao)
@requer_permissao("precificacao:consultar")
async def obter_produto(
    produto_id: int,
    service: ProdutoService = Depends(get_produto_service)
):
    """
    Obtém detalhes de um produto específico.
    Permissão necessária: precificacao:consultar
    """
    return await service.obter_produto_detalhe(produto_id=produto_id)


@router.post("/recalcular")
@requer_permissao("precificacao:editar")
async def recalcular_precificacao(
    payload: RecalculoRequest,
    request: Request,
    service: ProdutoService = Depends(get_produto_service),
    usuario: dict = Depends(get_usuario_atual)
):
    """
    Recalcula a precificação de produtos (em lote ou individual).
    Permissão necessária: precificacao:editar (herda consultar implicitamente)
    """
    usuario_id = usuario.get("usuario_id")
    
    resultado = await service.recalcular_precificacao(
        produto_ids=payload.produto_ids,
        novo_custo=payload.novo_custo,
        nova_margem=payload.nova_margem,
        justifica=payload.justifica,
        usuario_id=usuario_id
    )
    
    return resultado


@router.post("/exportar")
@requer_permissao("precificacao:consultar")
async def exportar_produtos(
    payload: ExportacaoRequest,
    request: Request,
    service: ProdutoService = Depends(get_produto_service)
):
    """
    Exporta lista de produtos para arquivo (CSV/JSON).
    Permissão necessária: precificacao:consultar
    """
    dados_binarios = await service.exportar_produtos(
        formato=payload.formato,
        filtros=payload.filtros
    )
    
    # Definir headers adequados para download
    media_type = "text/csv" if payload.formato.upper() != "JSON" else "application/json"
    
    from fastapi.responses import Response
    return Response(
        content=dados_binarios,
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename=produtos_export.{payload.formato.lower()}"
        }
    )
