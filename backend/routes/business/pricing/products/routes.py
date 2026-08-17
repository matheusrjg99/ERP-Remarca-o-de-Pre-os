"""Routes para o módulo de Precificação de Produtos.

Apenas definição de endpoints, injeção de dependências e retorno de respostas HTTP.
Nenhuma regra de negócio ou SQL deve residir aqui.
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional, List

from backend.auth.seguranca import requer_permissao
from .schemas import ProdutoPrecificacao, ProdutoAvancado
from .services import ProdutoService

router = APIRouter(tags=["Precificação - Produtos"])


def get_produto_service() -> ProdutoService:
    """Injeção de dependência do Service."""
    return ProdutoService()


@router.get(
    "/precificacao/produtos",
    response_model=List[ProdutoPrecificacao],
    dependencies=[Depends(requer_permissao("precificacao:consultar"))]
)
async def listar_produtos_precificacao(
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    classificacao: Optional[str] = None,
    fornecedor: Optional[str] = None,
    service: ProdutoService = Depends(get_produto_service),
    # O decorador acima já valida o token e as permissões (hierarquia: editar inclui consultar)
    usuario: str = Depends(requer_permissao("precificacao:consultar"))
):
    """
    Lista produtos para precificação com custos, preços e markups.
    Permissão necessária: precificacao:consultar (ou superior, como precificacao:editar).
    """
    return await service.listar_produtos(
        ambiente=ambiente,
        classificacao=classificacao,
        fornecedor=fornecedor
    )


@router.get(
    "/precificacao/produtos/pesquisar",
    response_model=List[ProdutoAvancado],
    dependencies=[Depends(requer_permissao("precificacao:consultar"))]
)
async def pesquisar_produtos_avancado(
    termo: Optional[str] = "",
    codigo: Optional[str] = "",
    fornecedor: Optional[str] = "",
    classificacao: Optional[str] = "",
    disponibilidade: Optional[str] = "",
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    service: ProdutoService = Depends(get_produto_service),
    usuario: str = Depends(requer_permissao("precificacao:consultar"))
):
    """
    Pesquisa avançada de produtos com múltiplos filtros dinâmicos.
    Permite buscar por termo, código, fornecedor, classificação e disponibilidade.
    Permissão necessária: precificacao:consultar.
    """
    return await service.pesquisar_produto_avancado(
        termo=termo,
        codigo=codigo,
        fornecedor=fornecedor,
        classificacao=classificacao,
        disponibilidade=disponibilidade,
        ambiente=ambiente,
        usuario=usuario
    )
