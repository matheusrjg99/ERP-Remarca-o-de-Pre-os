"""
Services para módulo de Contestações
Contém toda a regra de negócio e queries SQL
"""
from typing import List, Dict, Any, Union
from database import executar_query


class ContestacaoService:
    """Serviço de Contestações - encapsula lógica de negócio e acesso ao banco"""

    @staticmethod
    async def listar_por_nc(nao_conformidade_id: int) -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Lista todas as mensagens de uma NC específica"""
        query = """
            SELECT id, nao_conformidade_id, mensagem, usuario, data_hora 
            FROM contestacoes_v2 
            WHERE nao_conformidade_id = ? 
            ORDER BY data_hora ASC
        """
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(nao_conformidade_id,),
            usuario="SISTEMA",
            endpoint="/contestacoes"
        )

    @staticmethod
    async def criar(
        nao_conformidade_id: int,
        mensagem: str,
        usuario: str
    ) -> Union[bool, Dict[str, str]]:
        """Adiciona mensagem ao chat da NC"""
        query = """
            INSERT INTO contestacoes_v2 (nao_conformidade_id, mensagem, usuario, data_hora) 
            VALUES (?, ?, ?, GETDATE())
        """
        params = (nao_conformidade_id, mensagem, usuario)
        
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=params,
            usuario="SISTEMA",
            endpoint="/contestacoes",
            is_select=False
        )

    @staticmethod
    async def buscar_ultima_mensagem(nao_conformidade_id: int) -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Retorna a última mensagem criada para uma NC"""
        query = """
            SELECT id, nao_conformidade_id, mensagem, usuario, data_hora 
            FROM contestacoes_v2 
            WHERE nao_conformidade_id = ? 
            ORDER BY data_hora DESC
        """
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(nao_conformidade_id,),
            usuario="SISTEMA",
            endpoint="/contestacoes"
        )
