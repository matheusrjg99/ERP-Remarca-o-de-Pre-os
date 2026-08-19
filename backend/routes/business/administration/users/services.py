"""
Serviços para o módulo de Gestão de Usuários.
Contém toda a lógica de negócio e queries SQL relacionadas a usuários.
"""
from typing import List, Dict, Any, Optional
from database import executar_query


class UserService:
    """Classe de serviço para operações de usuários."""

    def __init__(self, usuario_logado: str):
        self.usuario_logado = usuario_logado

    async def listar_todos(self) -> List[Dict[str, Any]]:
        """
        Lista todos os usuários do sistema.
        Retorna lista de dicionários com dados dos usuários e cargos.
        """
        query = """
            SELECT u.login, u.nome, u.cargo_id, c.nome as cargo_nome, u.ativo 
            FROM API_USUARIOS u
            LEFT JOIN dbo.cargos c ON u.cargo_id = c.id AND c.ativo = 1
            ORDER BY u.nome
        """
        resultado = await executar_query(
            banco="Bddemo",
            query=query,
            params=(),
            usuario=self.usuario_logado,
            endpoint="/api/usuarios"
        )
        return resultado if resultado else []

    async def criar_usuario(
        self, 
        login: str, 
        senha_hash: str, 
        nome: str, 
        cargo_id: int
    ) -> bool:
        """
        Cria um novo usuário no sistema.
        Retorna True se sucesso, False caso contrário.
        """
        query = """
            INSERT INTO API_USUARIOS (login, senha_hash, nome, cargo_id, ativo)
            VALUES (?, ?, ?, ?, 1)
        """
        params = (login.lower().strip(), senha_hash, nome.upper(), cargo_id)
        
        sucesso = await executar_query(
            banco="Bddemo",
            query=query,
            params=params,
            is_select=False,
            usuario=self.usuario_logado,
            endpoint="/api/usuarios/cadastro"
        )
        return sucesso is True

    async def alternar_status(self, login_user: str, ativo: int) -> bool:
        """
        Ativa ou desativa um usuário pelo login.
        Retorna True se sucesso, False caso contrário.
        """
        query = "UPDATE API_USUARIOS SET ativo = ? WHERE login = ?"
        params = (ativo, login_user)
        
        sucesso = await executar_query(
            banco="Bddemo",
            query=query,
            params=params,
            is_select=False,
            usuario=self.usuario_logado,
            endpoint="/api/usuarios/status"
        )
        return sucesso is True
