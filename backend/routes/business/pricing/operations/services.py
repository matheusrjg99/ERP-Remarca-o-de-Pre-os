"""
Services para o módulo de Operações - Precificação.
Contém toda a lógica de negócio e execução de queries SQL para operações de atualização.
"""
from typing import Dict, Any, Optional
from database import executar_query
from sql_repo import Scripts


class OperationsService:
    """Serviços relacionados a operações de precificação (atualizações)."""
    
    @staticmethod
    async def remarcar_preco(
        db_name: str,
        codigo: str,
        novo_preco: float,
        usuario_login: str
    ) -> Any:
        """
        Atualiza o preço de venda de um produto.
        
        Args:
            db_name: Nome do banco de dados
            codigo: Código do produto
            novo_preco: Novo preço de venda
            usuario_login: Login do usuário que está executando a operação
            
        Returns:
            True se sucesso, erro caso contrário
        """
        query = Scripts.query['remarcação']
        
        return await executar_query(
            banco=db_name,
            query=query,
            params=(novo_preco, codigo),
            usuario=usuario_login,
            endpoint="/precificacao/remarcar",
            is_select=False
        )
    
    @staticmethod
    async def atualizar_custo(
        db_name: str,
        codigo: str,
        novo_custo: float,
        usuario_login: str
    ) -> bool:
        """
        Atualiza o custo de um produto.
        
        Args:
            db_name: Nome do banco de dados
            codigo: Código do produto
            novo_custo: Novo custo do produto
            usuario_login: Login do usuário que está executando a operação
            
        Returns:
            True se sucesso, False caso contrário
        """
        query = Scripts.query['atualiza_custo']
        
        sucesso = await executar_query(
            banco=db_name,
            query=query,
            params=(novo_custo, codigo),
            usuario=usuario_login,
            endpoint="/precificacao/atualizar-custo",
            is_select=False
        )
        
        return bool(sucesso)
    
    @staticmethod
    async def atualizar_markup(
        db_name: str,
        codigo: str,
        novo_mkp: float,
        usuario_login: str
    ) -> Any:
        """
        Atualiza o markup de um produto.
        
        Args:
            db_name: Nome do banco de dados
            codigo: Código do produto
            novo_mkp: Novo markup em porcentagem
            usuario_login: Login do usuário que está executando a operação
            
        Returns:
            True se sucesso, erro caso contrário
        """
        query = Scripts.query['atualiza_mkp']
        
        return await executar_query(
            banco=db_name,
            query=query,
            params=(novo_mkp, novo_mkp, codigo),
            usuario=usuario_login,
            endpoint="/precificacao/atualizar-mkp",
            is_select=False
        )
