"""
Rotas de Operações - Módulo de Precificação (Remarcação de Preços)
Atualizações de Preço, Custo e Markup.
"""
from fastapi import APIRouter, Depends, HTTPException, Query

from database import executar_query
from security import requer_permissao
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
    usuario: str = Depends(requer_permissao("precificacao:editar"))
):
    """Atualiza o preço de venda de um produto."""
    db_name = AMBIENTES[ambiente]
    query = Scripts.query['remarcação']
    sucesso = await executar_query(
        banco=db_name, 
        query=query, 
        params=(novo_preco, codigo), 
        usuario=usuario, 
        endpoint="/precificacao/remarcar",
        is_select=False
    )
    
    if sucesso is True:
        return {"status": "sucesso", "mensagem": f"Preço atualizado para R$ {novo_preco}"}
    raise HTTPException(status_code=500, detail=f"Erro: {sucesso}")

@router.put("/atualizar-custo", dependencies=[Depends(requer_permissao("precificacao:editar_custo"))])
async def atualizar_custo(
    codigo: str, 
    novo_custo: float, 
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(requer_permissao("precificacao:editar_custo"))
):
    """Atualiza o custo de um produto."""
    db_name = AMBIENTES[ambiente]
    
    query = Scripts.query['atualiza_custo']
    sucesso = await executar_query(
        banco=db_name, 
        query=query, 
        params=(novo_custo, codigo),
        usuario=usuario, 
        endpoint="/precificacao/atualizar-custo",
        is_select=False
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
    usuario: str = Depends(requer_permissao("precificacao:editar"))
):
    """Atualiza o markup de um produto."""
    db_name = AMBIENTES[ambiente]
    
    query = Scripts.query['atualiza_mkp']
    sucesso = await executar_query(
        banco=db_name, 
        query=query, 
        params=(novo_mkp, novo_mkp, codigo), 
        usuario=usuario, 
        endpoint="/precificacao/atualizar-mkp",
        is_select=False
    )
    
    if sucesso is True:
        return {"status": "sucesso", "mensagem": f"Markup do produto {codigo} ajustado para {novo_mkp}%"}
    raise HTTPException(status_code=500, detail=f"Erro: {sucesso}")
