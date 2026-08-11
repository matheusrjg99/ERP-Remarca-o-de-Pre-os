"""
Rotas de Precificação (Remarcação de Preços)
Módulo responsável por consultas de produtos, recálculos de preços e operações de precificação.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional

from database import executar_query
from security import requer_permissao

router = APIRouter(prefix="/precificacao", tags=["Precificação"])

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

class RecalculoRequest(BaseModel):
    codigos: List[str]
    tipo: str  # 'markup', 'margem', 'preco_sugerido'
    valor_base: float
    ambiente: str

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
    
    query = """
        SELECT 
            p.codpro,
            cp.descricaolonga as descricao,
            p.custo,
            p.preco_venda,
            p.markup,
            p.margem,
            c.descr as classificacao,
            f.nome as fornecedor
        FROM PRODUTOCAD p
        LEFT JOIN complementoproduto cp ON p.codpro = cp.codpro
        LEFT JOIN CLASSIFCAD c ON p.clasprod = c.clasprod
        LEFT JOIN FORNECECAD f ON p.codfor = f.oid
        WHERE 1=1
    """
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


@router.post("/recalcular", dependencies=[Depends(requer_permissao("precificacao:recalcular"))])
async def recalcular_precos(dados: RecalculoRequest):
    """Recalcula preços de múltiplos produtos baseado em markup, margem ou preço sugerido."""
    db_name = "Bdenter" if dados.ambiente == "producao" else f"bd{dados.ambiente}"
    
    codigos_formatados = ",".join(f"'{c}'" for c in dados.codigos)
    
    if dados.tipo == "markup":
        query = f"""
            UPDATE PRODUTOCAD 
            SET preco_venda = custo * (1 + {dados.valor_base}/100),
                markup = {dados.valor_base}
            WHERE codpro IN ({codigos_formatados})
        """
    elif dados.tipo == "margem":
        query = f"""
            UPDATE PRODUTOCAD 
            SET preco_venda = custo / (1 - {dados.valor_base}/100),
                margem = {dados.valor_base}
            WHERE codpro IN ({codigos_formatados})
        """
    else:
        raise HTTPException(status_code=400, detail="Tipo de recálculo inválido")
    
    sucesso = await executar_query(
        banco=db_name,
        query=query,
        params=(),
        usuario="SISTEMA",
        endpoint="/precificacao/recalcular",
        is_select=False
    )
    
    if sucesso is True:
        return {"status": "sucesso", "mensagem": f"{len(dados.codigos)} produtos recalculados"}
    
    raise HTTPException(status_code=500, detail=f"Erro no recálculo: {sucesso}")


@router.put("/atualizar-preco/{codigo}", dependencies=[Depends(requer_permissao("precificacao:editar"))])
async def atualizar_preco(
    codigo: str,
    novo_preco: float,
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"])
):
    """Atualiza o preço de venda de um produto específico."""
    db_name = "Bdenter" if ambiente == "producao" else f"bd{ambiente}"
    
    query = "UPDATE PRODUTOCAD SET preco_venda = ? WHERE codpro = ?"
    
    sucesso = await executar_query(
        banco=db_name,
        query=query,
        params=(novo_preco, codigo),
        usuario="SISTEMA",
        endpoint=f"/precificacao/atualizar-preco/{codigo}",
        is_select=False
    )
    
    if sucesso is True:
        return {"status": "sucesso", "mensagem": f"Preço atualizado para R$ {novo_preco}"}
    
    raise HTTPException(status_code=500, detail=f"Erro ao atualizar preço: {sucesso}")


@router.put("/atualizar-custo/{codigo}", dependencies=[Depends(requer_permissao("precificacao:editar_custo"))])
async def atualizar_custo_produto(
    codigo: str,
    novo_custo: float,
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"])
):
    """Atualiza o custo de um produto."""
    db_name = "Bdenter" if ambiente == "producao" else f"bd{ambiente}"
    
    query = "UPDATE PRODUTOCAD SET custo = ? WHERE codpro = ?"
    
    sucesso = await executar_query(
        banco=db_name,
        query=query,
        params=(novo_custo, codigo),
        usuario="SISTEMA",
        endpoint=f"/precificacao/atualizar-custo/{codigo}",
        is_select=False
    )
    
    if sucesso is True:
        return {"status": "sucesso", "mensagem": f"Custo atualizado para R$ {novo_custo}"}
    
    raise HTTPException(status_code=500, detail=f"Erro ao atualizar custo: {sucesso}")


@router.get("/exportar", dependencies=[Depends(requer_permissao("precificacao:exportar"))])
async def exportar_precificacao(
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    formato: str = Query("csv", enum=["csv", "xlsx"])
):
    """Exporta dados de precificação em CSV ou Excel."""
    db_name = "Bdenter" if ambiente == "producao" else f"bd{ambiente}"
    
    query = """
        SELECT 
            p.codpro as Codigo,
            cp.descricaolonga as Descricao,
            p.custo as Custo,
            p.preco_venda as PrecoVenda,
            p.markup as Markup,
            p.margem as Margem
        FROM PRODUTOCAD p
        LEFT JOIN complementoproduto cp ON p.codpro = cp.codpro
        ORDER BY p.codpro
    """
    
    resultado = await executar_query(
        banco=db_name,
        query=query,
        params=(),
        usuario="SISTEMA",
        endpoint="/precificacao/exportar"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return {"dados": resultado, "formato": formato}
