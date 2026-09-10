"""
Serviços de Negócio para Gestão RBAC
Responsável por toda a lógica de negócios e consultas ao banco de dados

IMPORTANTE: Permissões NÃO são criadas via API. Devem ser inseridas via
SQL/migration/seed para evitar permissões órfãs sem rota protegida.
"""

from typing import List, Optional, Dict, Any
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from database import executar_query


class RBACService:
    """Serviço centralizado para operações de RBAC"""

    def __init__(self, usuario_logado: str):
        self.usuario_logado = usuario_logado
        self.banco = "Bddemo"

    # ==================== PERMISSÕES ====================
    # Permissões são READ-ONLY via API. Criar/editar via SQL/seed.
    # Apenas listagem e consulta são expostas.

    async def listar_permissoes(
        self,
        modulo: Optional[str] = None,
        ativo: bool = True,
        agrupar_por_modulo: bool = False
    ) -> List[Dict]:
        """
        Lista todas as permissões com filtros opcionais.

        Args:
            modulo: Filtra por módulo específico
            ativo: Filtra apenas ativas
            agrupar_por_modulo: Se True, retorna agrupado por módulo

        Returns:
            Lista de permissões
        """
        query = """
            SELECT id, codigo, descricao, modulo, ativo, criado_em
            FROM dbo.permissoes
            WHERE ativo = ?
        """
        params = [ativo]

        if modulo:
            query += " AND modulo = ?"
            params.append(modulo)

        query += " ORDER BY modulo, codigo"

        resultado = await executar_query(
            banco=self.banco,
            query=query,
            params=tuple(params),
            usuario=self.usuario_logado,
            endpoint="/rbac/permissoes"
        )

        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])

        resultado = resultado or []

        # Agrupa por módulo se solicitado
        if agrupar_por_modulo:
            agrupado = {}
            for perm in resultado:
                mod = perm.get("modulo", "outros")
                if mod not in agrupado:
                    agrupado[mod] = []
                agrupado[mod].append(perm)
            return agrupado

        return resultado

    async def obter_permissao_por_id(self, permissao_id: int) -> Optional[Dict]:
        """Obtém uma permissão específica pelo ID"""
        query = """
            SELECT id, codigo, descricao, modulo, ativo, criado_em
            FROM dbo.permissoes
            WHERE id = ?
        """
        resultado = await executar_query(
            banco=self.banco,
            query=query,
            params=(permissao_id,),
            usuario=self.usuario_logado,
            endpoint="/rbac/permissoes"
        )

        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])

        return resultado[0] if resultado else None

    async def obter_permissao_por_codigo(self, codigo: str) -> Optional[Dict]:
        """Obtém uma permissão específica pelo código (ex: 'nc:criar')"""
        query = """
            SELECT id, codigo, descricao, modulo, ativo, criado_em
            FROM dbo.permissoes
            WHERE codigo = ?
        """
        resultado = await executar_query(
            banco=self.banco,
            query=query,
            params=(codigo,),
            usuario=self.usuario_logado,
            endpoint="/rbac/permissoes"
        )

        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])

        return resultado[0] if resultado else None

    # ==================== CARGOS ====================

    async def listar_cargos(
        self,
        ativo: bool = True,
        incluir_permissoes: bool = True,
        incluir_usuarios_count: bool = False
    ) -> List[Dict]:
        """
        Lista todos os cargos com suas permissões.

        Args:
            ativo: Filtra apenas cargos ativos
            incluir_permissoes: Se True, inclui lista de permissões de cada cargo
            incluir_usuarios_count: Se True, inclui contagem de usuários por cargo

        Returns:
            Lista de cargos
        """
        query = """
            SELECT c.id, c.nome, c.descricao, c.ativo, c.criado_em, c.atualizado_em
            FROM dbo.cargos c
            WHERE c.ativo = ?
            ORDER BY c.nome
        """

        resultado = await executar_query(
            banco=self.banco,
            query=query,
            params=(ativo,),
            usuario=self.usuario_logado,
            endpoint="/rbac/cargos"
        )

        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])

        resultado = resultado or []

        # Busca permissões de cada cargo
        if incluir_permissoes:
            for cargo in resultado:
                cargo["permissoes"] = await self.obter_permissoes_do_cargo(cargo["id"])

        # Busca contagem de usuários por cargo
        if incluir_usuarios_count:
            for cargo in resultado:
                count_query = """
                    SELECT COUNT(*) as total 
                    FROM dbo.API_USUARIOS 
                    WHERE cargo_id = ? AND ativo = 1
                """
                count_result = await executar_query(
                    banco=self.banco,
                    query=count_query,
                    params=(cargo["id"],),
                    usuario=self.usuario_logado,
                    endpoint="/rbac/cargos"
                )
                cargo["total_usuarios"] = count_result[0]["total"] if count_result else 0

        return resultado

    async def listar_cargos_simples(self, ativo: bool = True) -> List[Dict]:
        """
        Lista cargos sem permissões (mais leve).
        Útil para selects/dropdowns no frontend.
        """
        query = """
            SELECT id, nome, descricao, ativo
            FROM dbo.cargos
            WHERE ativo = ?
            ORDER BY nome
        """

        resultado = await executar_query(
            banco=self.banco,
            query=query,
            params=(ativo,),
            usuario=self.usuario_logado,
            endpoint="/rbac/cargos"
        )

        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])

        return resultado or []

    async def obter_cargo_por_id(self, cargo_id: int) -> Optional[Dict]:
        """Obtém detalhes de um cargo específico com suas permissões"""
        cargo_query = """
            SELECT id, nome, descricao, ativo, criado_em, atualizado_em
            FROM dbo.cargos WHERE id = ?
        """
        cargo_result = await executar_query(
            banco=self.banco,
            query=cargo_query,
            params=(cargo_id,),
            usuario=self.usuario_logado,
            endpoint="/rbac/cargos"
        )

        if not cargo_result or len(cargo_result) == 0:
            return None

        if isinstance(cargo_result, dict) and "erro" in cargo_result:
            raise Exception(cargo_result["erro"])

        cargo = cargo_result[0]
        cargo["permissoes"] = await self.obter_permissoes_do_cargo(cargo_id)

        return cargo

    async def obter_cargo_por_nome(self, nome: str) -> Optional[Dict]:
        """Obtém cargo pelo nome"""
        query = """
            SELECT id, nome, descricao, ativo, criado_em, atualizado_em
            FROM dbo.cargos WHERE nome = ?
        """
        resultado = await executar_query(
            banco=self.banco,
            query=query,
            params=(nome,),
            usuario=self.usuario_logado,
            endpoint="/rbac/cargos"
        )

        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])

        if not resultado or len(resultado) == 0:
            return None

        cargo = resultado[0]
        cargo["permissoes"] = await self.obter_permissoes_do_cargo(cargo["id"])

        return cargo

    async def obter_permissoes_do_cargo(self, cargo_id: int) -> List[Dict]:
        """Busca permissões de um cargo"""
        perm_query = """
            SELECT p.id, p.codigo, p.descricao, p.modulo, p.ativo, p.criado_em
            FROM dbo.permissoes p
            INNER JOIN dbo.cargo_permissoes cp ON p.id = cp.permissao_id
            WHERE cp.cargo_id = ?
            ORDER BY p.modulo, p.codigo
        """
        perms = await executar_query(
            banco=self.banco,
            query=perm_query,
            params=(cargo_id,),
            usuario=self.usuario_logado,
            endpoint="/rbac/cargos"
        )

        if isinstance(perms, dict) and "erro" in perms:
            return []

        return perms or []

    async def criar_cargo(
        self,
        nome: str,
        descricao: Optional[str] = None,
        ativo: bool = True,
        permissoes_ids: Optional[List[int]] = None
    ) -> Dict:
        """
        Cria um novo cargo, opcionalmente já com permissões.

        Args:
            nome: Nome único do cargo
            descricao: Descrição opcional
            ativo: Se o cargo está ativo
            permissoes_ids: Lista opcional de IDs de permissões a atribuir

        Returns:
            Cargo criado com permissões
        """
        # Verifica se nome já existe
        check_query = "SELECT id FROM dbo.cargos WHERE nome = ?"
        check_result = await executar_query(
            banco=self.banco,
            query=check_query,
            params=(nome,),
            usuario=self.usuario_logado,
            endpoint="/rbac/cargos"
        )

        if check_result and len(check_result) > 0:
            raise Exception("Nome do cargo já existe")

        insert_query = """
            INSERT INTO dbo.cargos (nome, descricao, ativo, criado_em, atualizado_em)
            VALUES (?, ?, ?, GETDATE(), NULL)
            SELECT SCOPE_IDENTITY() as id
        """
        params = (nome, descricao, ativo)

        resultado = await executar_query(
            banco=self.banco,
            query=insert_query,
            params=params,
            usuario=self.usuario_logado,
            endpoint="/rbac/cargos",
            is_select=False
        )

        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])

        # Extrai o ID do cargo criado
        try:
            if isinstance(resultado, list) and len(resultado) > 0:
                novo_cargo_id = int(resultado[0]["id"])
            elif isinstance(resultado, dict) and "id" in resultado:
                novo_cargo_id = int(resultado["id"])
            else:
                raise Exception("Não foi possível obter ID do cargo criado")
        except (KeyError, IndexError, TypeError) as e:
            raise Exception(f"Erro ao obter ID do cargo criado: {str(e)}")

        # Atribui permissões iniciais se fornecidas
        if permissoes_ids:
            # Remove duplicatas
            permissoes_unicas = list(set(permissoes_ids))
            await self._inserir_permissoes_cargo(novo_cargo_id, permissoes_unicas)

        # Retorna cargo criado com permissões
        novo_cargo = await self.obter_cargo_por_id(novo_cargo_id)

        if not novo_cargo:
            raise Exception("Cargo criado mas não encontrado")

        return novo_cargo

    async def atualizar_cargo(
        self,
        cargo_id: int,
        nome: Optional[str] = None,
        descricao: Optional[str] = None,
        ativo: Optional[bool] = None,
        permissoes_ids: Optional[List[int]] = None
    ) -> Dict:
        """
        Atualiza um cargo e opcionalmente suas permissões.

        Se permissoes_ids for None, as permissões NÃO são alteradas.
        Se permissoes_ids for lista (mesmo vazia), as permissões são substituídas.
        """
        # Verifica se cargo existe
        cargo_existente = await self.obter_cargo_por_id(cargo_id)
        if not cargo_existente:
            raise Exception("Cargo não encontrado")

        # Verifica duplicata de nome (se alterando o nome)
        if nome is not None and nome != cargo_existente["nome"]:
            check_query = "SELECT id FROM dbo.cargos WHERE nome = ? AND id != ?"
            check_result = await executar_query(
                banco=self.banco,
                query=check_query,
                params=(nome, cargo_id),
                usuario=self.usuario_logado,
                endpoint="/rbac/cargos"
            )

            if check_result and len(check_result) > 0:
                raise Exception("Já existe outro cargo com este nome")

        # Atualiza dados do cargo
        updates = []
        params = []

        if nome is not None:
            updates.append("nome = ?")
            params.append(nome)
        if descricao is not None:
            updates.append("descricao = ?")
            params.append(descricao)
        if ativo is not None:
            updates.append("ativo = ?")
            params.append(ativo)

        if updates:
            updates.append("atualizado_em = GETDATE()")
            update_query = f"UPDATE dbo.cargos SET {', '.join(updates)} WHERE id = ?"
            params.append(cargo_id)

            resultado = await executar_query(
                banco=self.banco,
                query=update_query,
                params=tuple(params),
                usuario=self.usuario_logado,
                endpoint="/rbac/cargos",
                is_select=False
            )

            if isinstance(resultado, dict) and "erro" in resultado:
                raise Exception(resultado["erro"])

        # Atualiza permissões se fornecidas
        if permissoes_ids is not None:
            await self._substituir_permissoes_cargo(cargo_id, permissoes_ids)

        # Retorna cargo atualizado
        cargo_atualizado = await self.obter_cargo_por_id(cargo_id)

        if not cargo_atualizado:
            raise Exception("Cargo não encontrado após atualização")

        return cargo_atualizado

    async def atribuir_permissoes_ao_cargo(
        self,
        cargo_id: int,
        permissoes_ids: List[int]
    ) -> Dict:
        """
        Substitui APENAS as permissões de um cargo, sem alterar outros dados.
        Método dedicado para gestão de permissões.

        Args:
            cargo_id: ID do cargo
            permissoes_ids: Lista de IDs de permissões (substitui todas as existentes)

        Returns:
            Cargo atualizado
        """
        # Verifica se cargo existe
        cargo_existente = await self.obter_cargo_por_id(cargo_id)
        if not cargo_existente:
            raise Exception("Cargo não encontrado")

        # Substitui permissões
        await self._substituir_permissoes_cargo(cargo_id, permissoes_ids)

        # Retorna cargo atualizado
        return await self.obter_cargo_por_id(cargo_id)

    async def excluir_cargo(self, cargo_id: int) -> Dict:
        """Exclui um cargo (apenas se não estiver em uso por usuários)"""
        # Verifica se há usuários com este cargo
        check_query = """
            SELECT COUNT(*) as total 
            FROM dbo.API_USUARIOS 
            WHERE cargo_id = ? AND ativo = 1
        """
        check_result = await executar_query(
            banco=self.banco,
            query=check_query,
            params=(cargo_id,),
            usuario=self.usuario_logado,
            endpoint="/rbac/cargos"
        )

        if check_result and check_result[0]["total"] > 0:
            raise Exception(f"Cargo está em uso por {check_result[0]['total']} usuário(s) ativo(s)")

        # Remove permissões associadas primeiro
        delete_perms_query = "DELETE FROM dbo.cargo_permissoes WHERE cargo_id = ?"
        resultado_perms = await executar_query(
            banco=self.banco,
            query=delete_perms_query,
            params=(cargo_id,),
            usuario=self.usuario_logado,
            endpoint="/rbac/cargos",
            is_select=False
        )

        if isinstance(resultado_perms, dict) and "erro" in resultado_perms:
            raise Exception(resultado_perms["erro"])

        # Exclui o cargo
        delete_query = "DELETE FROM dbo.cargos WHERE id = ?"
        resultado = await executar_query(
            banco=self.banco,
            query=delete_query,
            params=(cargo_id,),
            usuario=self.usuario_logado,
            endpoint="/rbac/cargos",
            is_select=False
        )

        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])

        return {"mensagem": "Cargo excluído com sucesso"}

    async def obter_usuarios_do_cargo(self, cargo_id: int) -> List[Dict]:
        """
        Lista todos os usuários ativos com um determinado cargo.

        Args:
            cargo_id: ID do cargo

        Returns:
            Lista de usuários (id, login, nome, email, ativo)
        """
        query = """
            SELECT id, login, nome, email, ativo, cargo_id
            FROM dbo.API_USUARIOS
            WHERE cargo_id = ? AND ativo = 1
            ORDER BY nome
        """

        resultado = await executar_query(
            banco=self.banco,
            query=query,
            params=(cargo_id,),
            usuario=self.usuario_logado,
            endpoint="/rbac/cargos"
        )

        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])

        return resultado or []

    # ==================== USUÁRIO-CARGO ====================

    async def atribuir_cargo_usuario(
        self,
        usuario_id: int,
        cargo_id: Optional[int]
    ) -> Dict:
        """
        Atribui ou remove cargo de um usuário PELO ID.

        Args:
            usuario_id: ID do usuário
            cargo_id: ID do cargo ou None para remover

        Returns:
            Mensagem de confirmação
        """
        # Verifica se o usuário existe
        user_check = await executar_query(
            banco=self.banco,
            query="SELECT id, login, nome FROM dbo.API_USUARIOS WHERE id = ?",
            params=(usuario_id,),
            usuario=self.usuario_logado,
            endpoint="/rbac/usuarios"
        )

        if not user_check or len(user_check) == 0:
            raise Exception("Usuário não encontrado")

        # Se cargo_id foi fornecido, verifica se existe
        if cargo_id is not None:
            cargo_check = await executar_query(
                banco=self.banco,
                query="SELECT id FROM dbo.cargos WHERE id = ? AND ativo = 1",
                params=(cargo_id,),
                usuario=self.usuario_logado,
                endpoint="/rbac/cargos"
            )

            if not cargo_check or len(cargo_check) == 0:
                raise Exception("Cargo não encontrado ou inativo")

        update_query = """
            UPDATE dbo.API_USUARIOS
            SET cargo_id = ?
            WHERE id = ?
        """

        resultado = await executar_query(
            banco=self.banco,
            query=update_query,
            params=(cargo_id, usuario_id),
            usuario=self.usuario_logado,
            endpoint="/rbac/usuarios",
            is_select=False
        )

        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])

        acao = "atribuído" if cargo_id is not None else "removido"
        return {
            "mensagem": f"Cargo {acao} com sucesso. O usuário precisa fazer logout e login novamente para aplicar as novas permissões."
        }

    async def atribuir_cargo_usuario_por_login(
        self,
        usuario_login: str,
        cargo_id: Optional[int]
    ) -> Dict:
        """
        Atribui ou remove cargo de um usuário PELO LOGIN.
        Necessário porque a API /users expõe apenas o login como identificador.

        Args:
            usuario_login: Login do usuário (ex: 'matheus gomes')
            cargo_id: ID do cargo ou None para remover

        Returns:
            Mensagem de confirmação
        """
        # Verifica se o usuário existe pelo login
        user_check = await executar_query(
            banco=self.banco,
            query="SELECT id, login, nome FROM dbo.API_USUARIOS WHERE login = ?",
            params=(usuario_login,),
            usuario=self.usuario_logado,
            endpoint="/rbac/usuarios"
        )

        if not user_check or len(user_check) == 0:
            raise Exception("Usuário não encontrado")

        usuario_id = user_check[0]["id"]

        # Se cargo_id foi fornecido, verifica se existe
        if cargo_id is not None:
            cargo_check = await executar_query(
                banco=self.banco,
                query="SELECT id FROM dbo.cargos WHERE id = ? AND ativo = 1",
                params=(cargo_id,),
                usuario=self.usuario_logado,
                endpoint="/rbac/cargos"
            )

            if not cargo_check or len(cargo_check) == 0:
                raise Exception("Cargo não encontrado ou inativo")

        # Atualiza o cargo
        update_query = """
            UPDATE dbo.API_USUARIOS
            SET cargo_id = ?
            WHERE id = ?
        """

        resultado = await executar_query(
            banco=self.banco,
            query=update_query,
            params=(cargo_id, usuario_id),
            usuario=self.usuario_logado,
            endpoint="/rbac/usuarios",
            is_select=False
        )

        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])

        acao = "atribuído" if cargo_id is not None else "removido"
        return {
            "mensagem": f"Cargo {acao} com sucesso. O usuário precisa fazer logout e login novamente para aplicar as novas permissões."
        }

    async def remover_cargo_do_usuario(self, usuario_id: int) -> Dict:
        """Remove o cargo de um usuário pelo ID (define cargo_id como NULL)"""
        return await self.atribuir_cargo_usuario(usuario_id, None)

    async def remover_cargo_do_usuario_por_login(self, usuario_login: str) -> Dict:
        """Remove o cargo de um usuário pelo LOGIN (define cargo_id como NULL)"""
        return await self.atribuir_cargo_usuario_por_login(usuario_login, None)

    # ==================== PERMISSÕES DO USUÁRIO ====================

    async def listar_permissoes_usuario(self, usuario_id: int) -> List[Dict]:
        """Lista todas as permissões de um usuário baseado no seu cargo"""
        query = """
            SELECT DISTINCT p.id, p.codigo, p.descricao, p.modulo, p.ativo
            FROM dbo.permissoes p
            INNER JOIN dbo.cargo_permissoes cp ON p.id = cp.permissao_id
            INNER JOIN dbo.cargos c ON cp.cargo_id = c.id
            INNER JOIN dbo.API_USUARIOS u ON c.id = u.cargo_id
            WHERE u.id = ? AND p.ativo = 1 AND c.ativo = 1 AND u.ativo = 1
            ORDER BY p.modulo, p.codigo
        """

        resultado = await executar_query(
            banco=self.banco,
            query=query,
            params=(usuario_id,),
            usuario=self.usuario_logado,
            endpoint="/rbac/usuarios"
        )

        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])

        return resultado or []

    async def listar_codigos_permissoes_usuario(self, usuario_id: int) -> List[str]:
        """
        Lista apenas os códigos das permissões de um usuário.
        Útil para incluir no payload do JWT.

        Returns:
            Lista de strings (ex: ['nc:criar', 'nc:visualizar', ...])
        """
        permissoes = await self.listar_permissoes_usuario(usuario_id)
        return [p["codigo"] for p in permissoes if p.get("codigo")]

    async def verificar_permissao_usuario(
        self,
        usuario_id: int,
        permissao_codigo: str
    ) -> Dict:
        """Verifica se um usuário possui uma permissão específica"""
        query = """
            SELECT COUNT(*) as tem_permissao
            FROM dbo.permissoes p
            INNER JOIN dbo.cargo_permissoes cp ON p.id = cp.permissao_id
            INNER JOIN dbo.cargos c ON cp.cargo_id = c.id
            INNER JOIN dbo.API_USUARIOS u ON c.id = u.cargo_id
            WHERE u.id = ? AND p.codigo = ? 
              AND p.ativo = 1 AND c.ativo = 1 AND u.ativo = 1
        """

        resultado = await executar_query(
            banco=self.banco,
            query=query,
            params=(usuario_id, permissao_codigo),
            usuario=self.usuario_logado,
            endpoint="/rbac/usuarios"
        )

        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])

        tem_permissao = resultado[0]["tem_permissao"] > 0 if resultado else False

        return {
            "usuario_id": usuario_id,
            "permissao": permissao_codigo,
            "autorizado": tem_permissao
        }

    # ==================== MÉTODOS AUXILIARES PRIVADOS ====================

    async def _substituir_permissoes_cargo(
        self,
        cargo_id: int,
        permissoes_ids: List[int]
    ) -> None:
        """
        Substitui todas as permissões de um cargo.
        Remove as existentes e insere as novas.
        """
        # Remove duplicatas por segurança
        permissoes_unicas = list(set(permissoes_ids)) if permissoes_ids else []

        # Remove permissões existentes
        delete_query = "DELETE FROM dbo.cargo_permissoes WHERE cargo_id = ?"
        resultado_delete = await executar_query(
            banco=self.banco,
            query=delete_query,
            params=(cargo_id,),
            usuario=self.usuario_logado,
            endpoint="/rbac/cargos",
            is_select=False
        )

        if isinstance(resultado_delete, dict) and "erro" in resultado_delete:
            raise Exception(resultado_delete["erro"])

        # Insere novas permissões
        if permissoes_unicas:
            await self._inserir_permissoes_cargo(cargo_id, permissoes_unicas)

    async def _inserir_permissoes_cargo(
        self,
        cargo_id: int,
        permissoes_ids: List[int]
    ) -> None:
        """Insere permissões em um cargo (assume que já foram removidas)"""
        insert_query = """
            INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id, criado_em)
            VALUES (?, ?, GETDATE())
        """

        for perm_id in permissoes_ids:
            resultado_insert = await executar_query(
                banco=self.banco,
                query=insert_query,
                params=(cargo_id, perm_id),
                usuario=self.usuario_logado,
                endpoint="/rbac/cargos",
                is_select=False
            )

            if isinstance(resultado_insert, dict) and "erro" in resultado_insert:
                raise Exception(resultado_insert["erro"])