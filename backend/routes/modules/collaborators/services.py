"""
Services para módulo de Colaboradores
Contém toda a regra de negócio e queries SQL
"""
from typing import List, Optional, Dict, Any, Union
from database import executar_query


class ColaboradorService:
    """Serviço de Colaboradores - encapsula lógica de negócio e acesso ao banco"""

    @staticmethod
    async def listar_todos() -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Lista todos os colaboradores ativos"""
        query = """
            SELECT 
                c.id, 
                c.nome, 
                c.cargo, 
                c.departamento, 
                c.ativo,
                c.usuario_id
            FROM colaboradores c 
            WHERE c.ativo = 1 OR c.ativo IS NULL
        """
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(),
            usuario="SISTEMA",
            endpoint="/colaboradores"
        )

    @staticmethod
    async def criar(
        nome: str,
        cargo: Optional[str],
        departamento: Optional[str],
        usuario_id: Optional[int]
    ) -> Union[bool, Dict[str, str]]:
        """Cria um novo colaborador"""
        query = """
            INSERT INTO colaboradores (nome, cargo, departamento, usuario_id, ativo) 
            VALUES (?, ?, ?, ?, 1)
        """
        params = (nome, cargo, departamento, usuario_id)
        
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=params,
            usuario="SISTEMA",
            endpoint="/colaboradores",
            is_select=False
        )

    @staticmethod
    async def buscar_por_nome(nome: str) -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Busca colaborador por nome (usado após criação)"""
        query = """
            SELECT TOP 1 id, nome, cargo, departamento, usuario_id, ativo 
            FROM colaboradores 
            WHERE nome = ? 
            ORDER BY id DESC
        """
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(nome,),
            usuario="SISTEMA",
            endpoint="/colaboradores"
        )

    @staticmethod
    async def buscar_por_id(colaborador_id: int) -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Busca colaborador por ID"""
        query = """
            SELECT id, nome, cargo, departamento, usuario_id, ativo 
            FROM colaboradores 
            WHERE id = ?
        """
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(colaborador_id,),
            usuario="SISTEMA",
            endpoint=f"/colaboradores/{colaborador_id}"
        )

    @staticmethod
    async def atualizar(
        colaborador_id: int,
        nome: Optional[str] = None,
        cargo: Optional[str] = None,
        departamento: Optional[str] = None,
        usuario_id: Optional[int] = None
    ) -> Union[bool, Dict[str, str]]:
        """Atualiza dados de um colaborador"""
        updates = []
        params = []
        
        if nome is not None:
            updates.append("nome = ?")
            params.append(nome)
        if cargo is not None:
            updates.append("cargo = ?")
            params.append(cargo)
        if departamento is not None:
            updates.append("departamento = ?")
            params.append(departamento)
        if usuario_id is not None:
            updates.append("usuario_id = ?")
            params.append(usuario_id)
        
        if not updates:
            raise ValueError("Nenhum campo para atualizar")
        
        params.append(colaborador_id)
        query = f"UPDATE colaboradores SET {', '.join(updates)}, atualizado_em = GETDATE() WHERE id = ?"
        
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=tuple(params),
            usuario="SISTEMA",
            endpoint=f"/colaboradores/{colaborador_id}",
            is_select=False
        )

    @staticmethod
    async def excluir(colaborador_id: int) -> Union[bool, Dict[str, str]]:
        """Exclui (desativa) um colaborador"""
        query = "UPDATE colaboradores SET ativo = 0, atualizado_em = GETDATE() WHERE id = ?"
        
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(colaborador_id,),
            usuario="SISTEMA",
            endpoint=f"/colaboradores/{colaborador_id}",
            is_select=False
        )
