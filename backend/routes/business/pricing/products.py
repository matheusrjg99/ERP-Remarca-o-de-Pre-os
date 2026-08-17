"""
Rotas de Produtos - Módulo de Precificação (Remarcação de Preços)
Listagem, recálculo e exportação de produtos para precificação.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional

from database import executar_query
from security import requer_permissao

from sql_repo import Scripts

router = APIRouter(prefix="/precificacao", tags=["Precificação - Produtos"])

# --- Schemas Pydantic ---

class ProdutoPrecificacao(BaseModel):
    codpro: str
    descricao: str
    custo: float
    preco_venda: float
    markup: float
    margem: Optional[float] = None
    classificacao: Optional[str] = None
    fornecedor: Optional[str] = None

# --- Rotas ---

@router.get("/produtos", response_model=List[ProdutoPrecificacao], dependencies=[Depends(requer_permissao("precificacao:visualizar"))])
async def listar_produtos_precificacao(
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    classificacao: Optional[str] = None,
    fornecedor: Optional[str] = None,
    usuario: str = Depends(requer_permissao("precificacao:visualizar"))
):
    """Lista produtos para precificação com custos, preços e markups."""
    from auth.seguranca import get_current_user_permissions
    # Extrai o usuário do token via decorator
    db_name = "Bdenter" if ambiente == "producao" else f"bd{ambiente}"
    
    query = Scripts.query['pesquisar_produto']
    params = []
    
    if classificacao:
        query += " AND p.clasprod LIKE ?"
        params.append(f"{classificacao}%")
    
    if fornecedor:
        query += " AND f.nome LIKE ?"
        params.append(f"%{fornecedor}%")
    
    query += " ORDER BY p.codpro"
    
    resultado = await executar_query(
        banco=db_name,
        query=query,
        params=tuple(params),
        usuario="SISTEMA",
        endpoint="/precificacao/produtos"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado if resultado else []

