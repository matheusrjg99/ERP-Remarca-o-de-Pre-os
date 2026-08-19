"""
Services para módulo de Não Conformidades
Contém toda a regra de negócio e queries SQL
"""
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from database import executar_query


class NaoConformidadeService:
    """Serviço de Não Conformidades - encapsula lógica de negócio e acesso ao banco"""

    @staticmethod
    async def listar_todos(
        colaborador_id: Optional[int] = None,
        status: Optional[str] = None,
        mes: Optional[int] = None,
        ano: Optional[int] = None
    ) -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Lista NCs com dados do colaborador (JOIN) com filtros opcionais"""
        query = """
            SELECT 
                nc.id, nc.descricao, nc.data_ocorrencia, nc.status,
                nc.colaborador_id, c.nome as nome_colaborador,
                nc.criado_em, nc.atualizado_em
            FROM nao_conformidades_v2 nc
            INNER JOIN colaboradores c ON nc.colaborador_id = c.id
            WHERE 1=1
        """
        params = []

        if colaborador_id:
            query += " AND nc.colaborador_id = ?"
            params.append(colaborador_id)
        
        if status:
            query += " AND nc.status = ?"
            params.append(status)
        
        # Filtro por mês e ano
        if mes and ano:
            query += " AND MONTH(nc.data_ocorrencia) = ? AND YEAR(nc.data_ocorrencia) = ?"
            params.extend([mes, ano])
        elif mes:
            query += " AND MONTH(nc.data_ocorrencia) = ?"
            params.append(mes)
        elif ano:
            query += " AND YEAR(nc.data_ocorrencia) = ?"
            params.append(ano)

        query += " ORDER BY nc.data_ocorrencia DESC"

        return await executar_query(
            banco="Bddemo",
            query=query,
            params=tuple(params),
            usuario="SISTEMA",
            endpoint="/nao-conformidades"
        )

    @staticmethod
    async def validar_colaborador(colaborador_id: int) -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Valida se o colaborador existe"""
        query = "SELECT id FROM colaboradores WHERE id = ?"
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(colaborador_id,),
            usuario="SISTEMA",
            endpoint="/nao-conformidades"
        )

    @staticmethod
    async def criar(
        colaborador_id: int,
        descricao: str,
        data_ocorrencia: datetime,
        status: str
    ) -> Union[bool, Dict[str, str]]:
        """Cria nova Não Conformidade"""
        query = """
            INSERT INTO nao_conformidades_v2 
            (colaborador_id, descricao, data_ocorrencia, status) 
            VALUES (?, ?, ?, ?)
        """
        params = (colaborador_id, descricao, data_ocorrencia, status)
        
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=params,
            usuario="SISTEMA",
            endpoint="/nao-conformidades",
            is_select=False
        )

    @staticmethod
    async def buscar_por_id(nc_id: int) -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Busca NC por ID com dados do colaborador"""
        query = """
            SELECT nc.id, nc.descricao, nc.data_ocorrencia, nc.status,
                   nc.colaborador_id, c.nome as nome_colaborador,
                   nc.criado_em, nc.atualizado_em
            FROM nao_conformidades_v2 nc
            JOIN colaboradores c ON nc.colaborador_id = c.id
            WHERE nc.id = ?
        """
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(nc_id,),
            usuario="SISTEMA",
            endpoint=f"/nao-conformidades/{nc_id}"
        )

    @staticmethod
    async def buscar_ultima() -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Busca a última NC criada (usado após insert)"""
        query = """
            SELECT nc.id, nc.descricao, nc.data_ocorrencia, nc.status,
                   nc.colaborador_id, c.nome as nome_colaborador,
                   nc.criado_em, nc.atualizado_em
            FROM nao_conformidades_v2 nc
            JOIN colaboradores c ON nc.colaborador_id = c.id
            WHERE nc.id = (SELECT TOP 1 id FROM nao_conformidades_v2 ORDER BY ID DESC)
        """
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(),
            usuario="SISTEMA",
            endpoint="/nao-conformidades"
        )

    @staticmethod
    async def atualizar(
        nc_id: int,
        descricao: Optional[str] = None,
        data_ocorrencia: Optional[datetime] = None,
        status: Optional[str] = None,
        colaborador_id: Optional[int] = None
    ) -> Union[bool, Dict[str, str]]:
        """Atualiza campos de uma NC (apenas os fornecidos)"""
        updates = []
        params = []
        
        if descricao is not None:
            updates.append("descricao = ?")
            params.append(descricao)
        
        if data_ocorrencia is not None:
            updates.append("data_ocorrencia = ?")
            params.append(data_ocorrencia)
        
        if status is not None:
            updates.append("status = ?")
            params.append(status)
        
        if colaborador_id is not None:
            updates.append("colaborador_id = ?")
            params.append(colaborador_id)
        
        if not updates:
            raise ValueError("Nenhum campo para atualizar")
        
        updates.append("atualizado_em = GETDATE()")
        params.append(nc_id)
        
        query = f"""
            UPDATE nao_conformidades_v2 
            SET {', '.join(updates)}
            WHERE id = ?
        """
        
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=tuple(params),
            usuario="SISTEMA",
            endpoint=f"/nao-conformidades/{nc_id}",
            is_select=False
        )

    @staticmethod
    async def atualizar_status(nc_id: int, novo_status: str) -> Union[bool, Dict[str, str]]:
        """Atualiza apenas o status de uma NC"""
        query = """
            UPDATE nao_conformidades_v2 
            SET status = ?, atualizado_em = GETDATE()
            WHERE id = ?
        """
        params = (novo_status, nc_id)
        
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=params,
            usuario="SISTEMA",
            endpoint=f"/nao-conformidades/{nc_id}",
            is_select=False
        )

    @staticmethod
    async def excluir(nc_id: int) -> Union[bool, Dict[str, str]]:
        """Exclui uma NC (e suas contestações em cascade)"""
        query = "DELETE FROM nao_conformidades_v2 WHERE id = ?"
        
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(nc_id,),
            usuario="SISTEMA",
            endpoint=f"/nao-conformidades/{nc_id}",
            is_select=False
        )
