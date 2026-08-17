"""Services para o módulo de Precificação de Produtos.

Contém toda a regra de negócio, construção de queries SQL e tratamento de erros lógicos.
Nenhuma lógica de HTTP ou FastAPI deve residir aqui.
"""

from typing import List, Optional, Dict, Any
from fastapi import HTTPException

from backend.database import executar_query
from sql_repo import Scripts


class ProdutoService:
    """Lógica de negócio para precificação de produtos."""

    async def listar_produtos(
        self,
        ambiente: str,
        classificacao: Optional[str] = None,
        fornecedor: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Lista produtos para precificação com custos, preços e markups."""
        
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
            params=tuple(params) if params else None,
            usuario="SISTEMA",
            endpoint="/pricing/products/produtos"
        )
        
        if isinstance(resultado, dict) and "erro" in resultado:
            raise HTTPException(status_code=500, detail=resultado["erro"])
        
        return resultado if resultado else []
