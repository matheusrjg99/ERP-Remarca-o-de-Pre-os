"""
Rotas de Operações - Atualizações de Preço, Custo e Markup
Módulo Business/Operations: Responsável por operações de escrita e atualização de dados.
"""
from fastapi import APIRouter, Depends, HTTPException, Query

from database import executar_query
from security import requer_permissao

router = APIRouter(prefix="/operations", tags=["Operações"])

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
    query = "UPDATE PRODUTOCAD SET preco_venda = ? WHERE codpro = ?"
    sucesso = await executar_query(
        banco=db_name, 
        query=query, 
        params=(novo_preco, codigo), 
        usuario="SISTEMA", 
        endpoint="/api/remarcar",
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
    
    query = "UPDATE PRODUTOCAD SET custo = ? WHERE codpro = ?"
    sucesso = await executar_query(
        banco=db_name, 
        query=query, 
        params=(novo_custo, codigo),
        usuario="SISTEMA", 
        endpoint="/api/atualizar-custo",
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
    
    query = "UPDATE PRODUTOCAD SET markup = ?, margem = ? WHERE codpro = ?"
    sucesso = await executar_query(
        banco=db_name, 
        query=query, 
        params=(novo_mkp, novo_mkp, codigo), 
        usuario="SISTEMA", 
        endpoint="/api/atualizar-mkp",
        is_select=False
    )
    
    if sucesso is True:
        return {"status": "sucesso", "mensagem": f"Markup do produto {codigo} ajustado para {novo_mkp}%"}
    raise HTTPException(status_code=500, detail=f"Erro: {sucesso}")
