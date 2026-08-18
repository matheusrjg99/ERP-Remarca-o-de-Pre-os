"""
Services para o módulo de Produtos - Precificação.
Contém toda a lógica de negócio e construção de queries SQL.
"""
from typing import List, Optional, Dict, Any
from database import executar_query
from sql_repo import Scripts


class ProductsService:
    """Serviços relacionados a produtos de precificação."""
    
    @staticmethod
    async def listar_produtos_precificacao(
        db_name: str,
        classificacao: Optional[str] = None,
        fornecedor: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Lista produtos para precificação com custos, preços e markups.
        
        Args:
            db_name: Nome do banco de dados (ex: Bdenter, bdtreina)
            classificacao: Filtro por classificação do produto
            fornecedor: Filtro por nome do fornecedor
            
        Returns:
            Lista de produtos com dados de precificação
        """
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
        
        return resultado if resultado else []
