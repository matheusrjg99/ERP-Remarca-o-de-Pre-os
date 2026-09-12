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

    # ==================== LEITURA ====================

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

    async def buscar_usuario(self, login: str) -> Optional[Dict[str, Any]]:
        """
        Busca um usuário específico pelo login.
        Retorna dict com dados do usuário ou None se não encontrado.
        """
        query = """
            SELECT u.login, u.nome, u.cargo_id, c.nome as cargo_nome, u.ativo
            FROM API_USUARIOS u
            LEFT JOIN dbo.cargos c ON u.cargo_id = c.id AND c.ativo = 1
            WHERE u.login = ?
        """
        resultado = await executar_query(
            banco="Bddemo",
            query=query,
            params=(login.lower().strip(),),
            usuario=self.usuario_logado,
            endpoint="/api/usuarios"
        )

        if not resultado or isinstance(resultado, dict) or len(resultado) == 0:
            return None

        return resultado[0]

    # ==================== CRIAÇÃO ====================

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
        
        NOTA: A auditoria de criação de usuário foi desativada em 
        database.py para evitar bug do driver ODBC legado {SQL Server}.
        """
        import logging
        
        # Normaliza
        login_normalizado = str(login).lower().strip()
        nome_normalizado = str(nome).upper().strip()
        cargo_id_int = int(cargo_id) if cargo_id is not None else None
        
        # Valida cargo_id
        if cargo_id_int is None:
            raise Exception("cargo_id é obrigatório")
        
        query = """
            INSERT INTO API_USUARIOS (login, senha_hash, nome, cargo_id, ativo)
            VALUES (?, ?, ?, ?, 1)
        """
        params = (login_normalizado, senha_hash, nome_normalizado, cargo_id_int)
        
        logging.debug(
            f"[DEBUG criar_usuario] INSERT parametrizado: "
            f"login={login_normalizado!r}, nome={nome_normalizado!r}, "
            f"cargo_id={cargo_id_int!r}, hash_len={len(senha_hash) if senha_hash else 0}"
        )
        
        sucesso = await executar_query(
            banco="Bddemo",
            query=query,
            params=params,
            is_select=False,
            usuario=self.usuario_logado,
            endpoint="/api/usuarios/cadastro"
        )
        
        logging.debug(f"[DEBUG criar_usuario] Retorno: {sucesso!r}")
        
        if isinstance(sucesso, dict) and "erro" in sucesso:
            raise Exception(sucesso["erro"])
        
        return sucesso is True

    # ==================== ATUALIZAÇÃO ====================

    async def atualizar_usuario(
        self,
        login: str,
        nome: Optional[str] = None,
        senha_hash: Optional[str] = None,
        cargo_id: Optional[int] = None
    ) -> bool:
        """
        Atualiza PARCIALMENTE os dados de um usuário.
        
        Regra: apenas os campos enviados (não-None) são atualizados.
        Campos None permanecem inalterados.
        
        Args:
            login: Login do usuário (chave - não editável)
            nome: Novo nome (opcional)
            senha_hash: Novo hash de senha já processado (opcional)
            cargo_id: Novo ID de cargo (opcional)
        
        Returns:
            True se sucesso, False caso contrário
        """
        updates = []
        params = []

        if nome is not None:
            updates.append("nome = ?")
            params.append(nome.upper().strip())

        if senha_hash is not None:
            updates.append("senha_hash = ?")
            params.append(senha_hash)

        if cargo_id is not None:
            updates.append("cargo_id = ?")
            params.append(cargo_id)

        # Se nenhum campo foi fornecido, não faz nada
        if not updates:
            return False

        # Adiciona o login como último parâmetro (WHERE)
        params.append(login.lower().strip())

        query = f"""
            UPDATE API_USUARIOS
            SET {', '.join(updates)}
            WHERE login = ?
        """

        sucesso = await executar_query(
            banco="Bddemo",
            query=query,
            params=tuple(params),
            is_select=False,
            usuario=self.usuario_logado,
            endpoint="/api/usuarios/atualizar"
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

    # ==================== EXCLUSÃO ====================

    async def excluir_usuario(self, login: str) -> bool:
        """
        Exclui (soft delete) um usuário pelo login.
        Na prática, apenas desativa o usuário (ativo = 0).
        
        Validações de segurança devem ser feitas na rota:
        - Não pode excluir a si mesmo
        - Não pode excluir o último admin ativo
        
        Returns:
            True se sucesso, False caso contrário
        """
        return await self.alternar_status(login, ativo=0)

    # ==================== VALIDAÇÕES AUXILIARES ====================

    async def contar_admins_ativos(self, cargo_admin_id: int = 1) -> int:
        """
        Conta quantos usuários ativos têm o cargo de Administrador.
        Usado para impedir que o último admin seja desativado.
        
        Args:
            cargo_admin_id: ID do cargo de Administrador (padrão: 1)
        
        Returns:
            Total de admins ativos
        """
        query = """
            SELECT COUNT(*) as total
            FROM API_USUARIOS
            WHERE cargo_id = ? AND ativo = 1
        """
        resultado = await executar_query(
            banco="Bddemo",
            query=query,
            params=(cargo_admin_id,),
            usuario=self.usuario_logado,
            endpoint="/api/usuarios/validacao"
        )

        if not resultado or isinstance(resultado, dict):
            return 0

        return resultado[0].get("total", 0) if resultado else 0

    async def usuario_existe(self, login: str) -> bool:
        """Verifica se um usuário existe pelo login"""
        resultado = await self.buscar_usuario(login)
        return resultado is not None

    async def obter_cargo_do_usuario(self, login: str) -> Optional[int]:
        """Retorna o cargo_id atual de um usuário"""
        usuario = await self.buscar_usuario(login)
        return usuario.get("cargo_id") if usuario else None