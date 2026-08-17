"""
Serviços de Negócio para Gestão RBAC
Responsável por toda a lógica de negócios e consultas ao banco de dados
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
    
    async def listar_permissoes(self, modulo: Optional[str] = None, ativo: bool = True) -> List[Dict]:
        """Lista todas as permissões com filtros opcionais"""
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
        
        return resultado or []
    
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
    
    async def criar_permissao(self, codigo: str, descricao: str, modulo: str, ativo: bool = True) -> Dict:
        """Cria uma nova permissão"""
        # Verifica se código já existe
        check_query = "SELECT id FROM dbo.permissoes WHERE codigo = ?"
        check_result = await executar_query(
            banco=self.banco,
            query=check_query,
            params=(codigo,),
            usuario=self.usuario_logado,
            endpoint="/rbac"
        )
        
        if check_result and len(check_result) > 0:
            raise Exception("Código de permissão já existe")
        
        insert_query = """
            INSERT INTO dbo.permissoes (codigo, descricao, modulo, ativo, criado_em)
            VALUES (?, ?, ?, ?, GETDATE())
            SELECT SCOPE_IDENTITY() as id
        """
        params = (codigo, descricao, modulo, ativo)
        
        resultado = await executar_query(
            banco=self.banco,
            query=insert_query,
            params=params,
            usuario=self.usuario_logado,
            endpoint="/rbac",
            is_select=False
        )
        
        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])
        
        # Busca a permissão criada
        nova_query = "SELECT * FROM dbo.permissoes WHERE id = ?"
        nova_permissao = await executar_query(
            banco=self.banco,
            query=nova_query,
            params=(int(resultado[0]["id"]),),
            usuario=self.usuario_logado,
            endpoint="/rbac"
        )
        
        return nova_permissao[0]
    
    async def atualizar_permissao(self, permissao_id: int, **kwargs) -> Dict:
        """Atualiza uma permissão existente"""
        updates = []
        params = []
        
        campo_map = {
            "codigo": "codigo",
            "descricao": "descricao",
            "modulo": "modulo",
            "ativo": "ativo"
        }
        
        for campo, valor in kwargs.items():
            if campo in campo_map and valor is not None:
                updates.append(f"{campo_map[campo]} = ?")
                params.append(valor)
        
        if not updates:
            raise Exception("Nenhum campo para atualizar")
        
        params.append(permissao_id)
        
        update_query = f"""
            UPDATE dbo.permissoes
            SET {', '.join(updates)}
            WHERE id = ?
        """
        
        resultado_update = await executar_query(
            banco=self.banco,
            query=update_query,
            params=tuple(params),
            usuario=self.usuario_logado,
            endpoint="/rbac",
            is_select=False
        )
        
        if isinstance(resultado_update, dict) and "erro" in resultado_update:
            raise Exception(resultado_update["erro"])
        
        # Busca a permissão atualizada
        permissao_atualizada = await self.obter_permissao_por_id(permissao_id)
        
        if not permissao_atualizada:
            raise Exception("Permissão não encontrada após atualização")
        
        return permissao_atualizada
    
    async def excluir_permissao(self, permissao_id: int) -> Dict:
        """Exclui uma permissão (apenas se não estiver em uso)"""
        # Verifica se está em uso
        check_query = """
            SELECT COUNT(*) as total FROM dbo.cargo_permissoes WHERE permissao_id = ?
        """
        check_result = await executar_query(
            banco=self.banco,
            query=check_query,
            params=(permissao_id,),
            usuario=self.usuario_logado,
            endpoint="/rbac"
        )
        
        if check_result and check_result[0]["total"] > 0:
            raise Exception(f"Permissão está em uso por {check_result[0]['total']} cargo(s)")
        
        delete_query = "DELETE FROM dbo.permissoes WHERE id = ?"
        resultado = await executar_query(
            banco=self.banco,
            query=delete_query,
            params=(permissao_id,),
            usuario=self.usuario_logado,
            endpoint="/rbac",
            is_select=False
        )
        
        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])
        
        return {"mensagem": "Permissão excluída com sucesso"}
    
    # ==================== CARGOS ====================
    
    async def listar_cargos(self, ativo: bool = True, incluir_permissoes: bool = True) -> List[Dict]:
        """Lista todos os cargos com suas permissões"""
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
            endpoint="/rbac"
        )
        
        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])
        
        # Busca permissões de cada cargo se solicitado
        if incluir_permissoes:
            for cargo in resultado:
                cargo["permissoes"] = await self.obter_permissoes_do_cargo(cargo["id"])
        
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
            endpoint="/rbac"
        )
        
        if not cargo_result or len(cargo_result) == 0:
            return None
        
        if isinstance(cargo_result, dict) and "erro" in cargo_result:
            raise Exception(cargo_result["erro"])
        
        cargo = cargo_result[0]
        cargo["permissoes"] = await self.obter_permissoes_do_cargo(cargo_id)
        
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
            endpoint="/rbac"
        )
        
        return perms if perms and not (isinstance(perms, dict) and "erro" in perms) else []
    
    async def criar_cargo(self, nome: str, descricao: Optional[str] = None, ativo: bool = True) -> Dict:
        """Cria um novo cargo"""
        # Verifica se nome já existe
        check_query = "SELECT id FROM dbo.cargos WHERE nome = ?"
        check_result = await executar_query(
            banco=self.banco,
            query=check_query,
            params=(nome,),
            usuario=self.usuario_logado,
            endpoint="/rbac"
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
            endpoint="/rbac",
            is_select=False
        )
        
        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])
        
        # Busca o cargo criado
        novo_cargo = await self.obter_cargo_por_id(int(resultado[0]["id"]))
        
        if not novo_cargo:
            raise Exception("Cargo criado mas não encontrado")
        
        return novo_cargo
    
    async def atualizar_cargo(self, cargo_id: int, 
                               nome: Optional[str] = None,
                               descricao: Optional[str] = None,
                               ativo: Optional[bool] = None,
                               permissoes_ids: Optional[List[int]] = None) -> Dict:
        """Atualiza um cargo e suas permissões"""
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
                endpoint="/rbac",
                is_select=False
            )
            
            if isinstance(resultado, dict) and "erro" in resultado:
                raise Exception(resultado["erro"])
        
        # Atualiza permissões se fornecidas
        if permissoes_ids is not None:
            # Remove permissões existentes
            delete_query = "DELETE FROM dbo.cargo_permissoes WHERE cargo_id = ?"
            resultado_delete = await executar_query(
                banco=self.banco,
                query=delete_query,
                params=(cargo_id,),
                usuario=self.usuario_logado,
                endpoint="/rbac",
                is_select=False
            )
            
            if isinstance(resultado_delete, dict) and "erro" in resultado_delete:
                raise Exception(resultado_delete["erro"])
            
            # Insere novas permissões
            if permissoes_ids:
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
                        endpoint="/rbac",
                        is_select=False
                    )
                    
                    if isinstance(resultado_insert, dict) and "erro" in resultado_insert:
                        raise Exception(resultado_insert["erro"])
        
        # Retorna cargo atualizado
        cargo_atualizado = await self.obter_cargo_por_id(cargo_id)
        
        if not cargo_atualizado:
            raise Exception("Cargo não encontrado após atualização")
        
        return cargo_atualizado
    
    async def excluir_cargo(self, cargo_id: int) -> Dict:
        """Exclui um cargo (apenas se não estiver em uso por usuários)"""
        # Verifica se há usuários com este cargo
        check_query = """
            SELECT COUNT(*) as total FROM dbo.API_USUARIOS WHERE cargo_id = ? AND ativo = 1
        """
        check_result = await executar_query(
            banco=self.banco,
            query=check_query,
            params=(cargo_id,),
            usuario=self.usuario_logado,
            endpoint="/rbac"
        )
        
        if check_result and check_result[0]["total"] > 0:
            raise Exception(f"Cargo está em uso por {check_result[0]['total']} usuário(s) ativo(s)")
        
        delete_query = "DELETE FROM dbo.cargos WHERE id = ?"
        resultado = await executar_query(
            banco=self.banco,
            query=delete_query,
            params=(cargo_id,),
            usuario=self.usuario_logado,
            endpoint="/rbac",
            is_select=False
        )
        
        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])
        
        return {"mensagem": "Cargo excluído com sucesso"}
    
    # ==================== USUÁRIO-CARGO ====================
    
    async def atribuir_cargo_usuario(self, usuario_id: int, cargo_id: Optional[int]) -> Dict:
        """Atribui ou remove cargo de um usuário"""
        # Verifica se o usuário existe
        user_check = await executar_query(
            banco=self.banco,
            query="SELECT id FROM dbo.API_USUARIOS WHERE id = ?",
            params=(usuario_id,),
            usuario=self.usuario_logado,
            endpoint="/rbac"
        )
        
        if not user_check or len(user_check) == 0:
            raise Exception("Usuário não encontrado")
        
        update_query = """
            UPDATE dbo.API_USUARIOS
            SET cargo_id = ?
            WHERE id = ?
        """
        
        cargo_id_valor = cargo_id if cargo_id is not None else None
        resultado = await executar_query(
            banco=self.banco,
            query=update_query,
            params=(cargo_id_valor, usuario_id),
            usuario=self.usuario_logado,
            endpoint="/rbac",
            is_select=False
        )
        
        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])
        
        return {
            "mensagem": "Cargo atualizado com sucesso. O usuário precisa fazer logout e login novamente para aplicar as novas permissões."
        }
    
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
            endpoint="/rbac"
        )
        
        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])
        
        return resultado or []
    
    async def verificar_permissao_usuario(self, usuario_id: int, permissao_codigo: str) -> Dict:
        """Verifica se um usuário possui uma permissão específica"""
        query = """
            SELECT COUNT(*) as tem_permissao
            FROM dbo.permissoes p
            INNER JOIN dbo.cargo_permissoes cp ON p.id = cp.permissao_id
            INNER JOIN dbo.cargos c ON cp.cargo_id = c.id
            INNER JOIN dbo.API_USUARIOS u ON c.id = u.cargo_id
            WHERE u.id = ? AND p.codigo = ? AND p.ativo = 1 AND c.ativo = 1 AND u.ativo = 1
        """
        
        resultado = await executar_query(
            banco=self.banco,
            query=query,
            params=(usuario_id, permissao_codigo),
            usuario=self.usuario_logado,
            endpoint="/rbac"
        )
        
        if isinstance(resultado, dict) and "erro" in resultado:
            raise Exception(resultado["erro"])
        
        tem_permissao = resultado[0]["tem_permissao"] > 0 if resultado else False
        
        return {
            "usuario_id": usuario_id,
            "permissao": permissao_codigo,
            "autorizado": tem_permissao
        }
