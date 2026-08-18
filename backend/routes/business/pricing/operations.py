"""
Rotas de Operações - Módulo de Precificação (Remarcação de Preços)
Atualizações de Preço, Custo e Markup.
"""
from fastapi import APIRouter, Depends, HTTPException, Query

from auth.seguranca import requer_permissao
from .operations.services import OperationsService
from sql_repo import Scripts

router = APIRouter(prefix="/precificacao", tags=["Precificação - Operações"])

AMBIENTES = {
    "producao": "Bdenter",
    "demo": "bddemo",
    "treina": "bdtreina"
}

@router.put("/remarcar", dependencies=[Depends(requer_permissao("precificacao:editar"))])
async def remarcar_preco(
    codigo: str, 
    novo_preco: float, 
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: dict = Depends(requer_permissao("precificacao:editar"))
):
    """Atualiza o preço de venda de um produto."""
    db_name = AMBIENTES[ambiente]
    
    sucesso = await OperationsService.remarcar_preco(
        db_name=db_name,
        codigo=codigo,
        novo_preco=novo_preco,
        usuario_login=usuario.get("user_login", "SISTEMA")
    )
    
    if sucesso is True:
        return {"status": "sucesso", "mensagem": f"Preço atualizado para R$ {novo_preco}"}
    raise HTTPException(status_code=500, detail=f"Erro: {sucesso}")


@router.put("/atualizar-custo", dependencies=[Depends(requer_permissao("precificacao:editar_custo"))])
async def atualizar_custo(
    codigo: str, 
    novo_custo: float, 
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: dict = Depends(requer_permissao("precificacao:editar_custo"))
):
    """Atualiza o custo de um produto."""
    db_name = AMBIENTES[ambiente]
    
    sucesso = await OperationsService.atualizar_custo(
        db_name=db_name,
        codigo=codigo,
        novo_custo=novo_custo,
        usuario_login=usuario.get("user_login", "SISTEMA")
    )
    
    if sucesso:
        return {"message": f"Custo do produto {codigo} atualizado com sucesso!"}
    else:
        raise HTTPException(status_code=500, detail=f"Falha ao atualizar o custo do produto {codigo}")


@router.put("/atualizar-mkp", dependencies=[Depends(requer_permissao("precificacao:editar"))])
async def atualizar_markup(
    codigo: str, 
    novo_mkp: float,
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: dict = Depends(requer_permissao("precificacao:editar"))
):
    """Atualiza o markup de um produto."""
    db_name = AMBIENTES[ambiente]
    
    sucesso = await OperationsService.atualizar_markup(
        db_name=db_name,
        codigo=codigo,
        novo_mkp=novo_mkp,
        usuario_login=usuario.get("user_login", "SISTEMA")
    )
    
    if sucesso is True:
        return {"status": "sucesso", "mensagem": f"Markup do produto {codigo} ajustado para {novo_mkp}%"}
    raise HTTPException(status_code=500, detail=f"Erro: {sucesso}")
