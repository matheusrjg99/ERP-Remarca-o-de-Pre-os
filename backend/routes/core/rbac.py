"""
Módulo de Gestão RBAC (Role-Based Access Control)
Rotas para administração de cargos e permissões
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from database import executar_query
from security import get_current_user_permissions, requer_permissao

router = APIRouter(prefix="/rbac", tags=["RBAC - Controle de Acesso"])


# ==================== DEPENDÊNCIAS DE AUTENTICAÇÃO ====================

async def get_usuario_autenticado(request: Request) -> str:
    """
    Extrai o login do usuário autenticado a partir do token JWT.
    Retorna o login do usuário para ser usado na auditoria.
    """
    user_data = await get_current_user_permissions(request)
    return user_data["user_login"]


# ==================== MODELOS PYDANTIC ====================

class PermissaoBase(BaseModel):
    codigo: str
    descricao: str
    modulo: str
    ativo: bool = True

class PermissaoCreate(PermissaoBase):
    pass

class PermissaoUpdate(BaseModel):
    codigo: Optional[str] = None
    descricao: Optional[str] = None
    modulo: Optional[str] = None
    ativo: Optional[bool] = None

class PermissaoResponse(PermissaoBase):
    id: int
    criado_em: datetime
    
    class Config:
        from_attributes = True

class CargoBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    ativo: bool = True

class CargoCreate(CargoBase):
    pass

class CargoUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    ativo: Optional[bool] = None
    permissoes_ids: Optional[List[int]] = None  # IDs das permissões associadas

class CargoResponse(CargoBase):
    id: int
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    permissoes: List[PermissaoResponse] = []
    
    class Config:
        from_attributes = True

class UsuarioCargoUpdate(BaseModel):
    cargo_id: Optional[int] = None


# ==================== ROTAS DE PERMISSÕES ====================

@router.get("/permissoes", response_model=List[PermissaoResponse], dependencies=[Depends(requer_permissao("rbac:listar_permissoes"))])
async def listar_permissoes(request: Request, modulo: Optional[str] = None, ativo: bool = True):
    """Lista todas as permissões, opcionalmente filtradas por módulo"""
    usuario_logado = await get_usuario_autenticado(request)
    
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
        banco="Bddemo",
        query=query,
        params=tuple(params),
        usuario=usuario_logado,
        endpoint="/rbac/permissoes"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado


@router.post("/permissoes", response_model=PermissaoResponse, dependencies=[Depends(requer_permissao("rbac:criar_permissao"))])
async def criar_permissao(request: Request, permissao: PermissaoCreate):
    """Cria uma nova permissão"""
    usuario_logado = await get_usuario_autenticado(request)
    
    # Verifica se código já existe
    check_query = "SELECT id FROM dbo.permissoes WHERE codigo = ?"
    check_result = await executar_query(banco="Bddemo", query=check_query, params=(permissao.codigo,), usuario=usuario_logado, endpoint="/rbac")
    
    if check_result and len(check_result) > 0:
        raise HTTPException(status_code=400, detail="Código de permissão já existe")
    
    insert_query = """
        INSERT INTO dbo.permissoes (codigo, descricao, modulo, ativo, criado_em)
        VALUES (?, ?, ?, ?, GETDATE())
        SELECT SCOPE_IDENTITY() as id
    """
    params = (
        permissao.codigo,
        permissao.descricao,
        permissao.modulo,
        permissao.ativo
    )
    
    resultado = await executar_query(banco="Bddemo", query=insert_query, params=params, usuario=usuario_logado, endpoint="/rbac", is_select=False)
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    # Busca a permissão criada
    nova_query = "SELECT * FROM dbo.permissoes WHERE id = ?"
    nova_permissao = await executar_query(banco="Bddemo", query=nova_query, params=(int(resultado[0]["id"]),), usuario=usuario_logado, endpoint="/rbac")
    
    return nova_permissao[0]


@router.put("/permissoes/{permissao_id}", response_model=PermissaoResponse, dependencies=[Depends(requer_permissao("rbac:atualizar_permissao"))])
async def atualizar_permissao(request: Request, permissao_id: int, permissao: PermissaoUpdate):
    """Atualiza uma permissão existente"""
    usuario_logado = await get_usuario_autenticado(request)
    
    updates = []
    params = []
    
    if permissao.codigo is not None:
        updates.append("codigo = ?")
        params.append(permissao.codigo)
    if permissao.descricao is not None:
        updates.append("descricao = ?")
        params.append(permissao.descricao)
    if permissao.modulo is not None:
        updates.append("modulo = ?")
        params.append(permissao.modulo)
    if permissao.ativo is not None:
        updates.append("ativo = ?")
        params.append(permissao.ativo)
    
    if not updates:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    # Adiciona o ID na lista de parâmetros para o WHERE
    params.append(permissao_id)
    
    update_query = f"""
        UPDATE dbo.permissoes
        SET {', '.join(updates)}
        WHERE id = ?
    """
    
    # Executa o update
    resultado_update = await executar_query(banco="Bddemo", query=update_query, params=tuple(params), usuario=usuario_logado, endpoint="/rbac", is_select=False)
    
    if isinstance(resultado_update, dict) and "erro" in resultado_update:
        raise HTTPException(status_code=500, detail=resultado_update["erro"])
    
    # Busca a permissão atualizada
    select_query = "SELECT id, codigo, descricao, modulo, ativo, criado_em FROM dbo.permissoes WHERE id = ?"
    resultado = await executar_query(banco="Bddemo", query=select_query, params=(permissao_id,), usuario=usuario_logado, endpoint="/rbac")
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    if not resultado or len(resultado) == 0:
        raise HTTPException(status_code=404, detail="Permissão não encontrada")
    
    return resultado[0]


@router.delete("/permissoes/{permissao_id}", dependencies=[Depends(requer_permissao("rbac:excluir_permissao"))])
async def excluir_permissao(request: Request, permissao_id: int):
    """Exclui uma permissão (apenas se não estiver em uso)"""
    usuario_logado = await get_usuario_autenticado(request)
    
    # Verifica se está em uso
    check_query = """
        SELECT COUNT(*) as total FROM dbo.cargo_permissoes WHERE permissao_id = ?
    """
    check_result = await executar_query(banco="Bddemo", query=check_query, params=(permissao_id,), usuario=usuario_logado, endpoint="/rbac")
    
    if check_result and check_result[0]["total"] > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Permissão está em uso por {check_result[0]['total']} cargo(s)"
        )
    
    delete_query = "DELETE FROM dbo.permissoes WHERE id = ?"
    resultado = await executar_query(banco="Bddemo", query=delete_query, params=(permissao_id,), usuario=usuario_logado, endpoint="/rbac", is_select=False)
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return {"mensagem": "Permissão excluída com sucesso"}


# ==================== ROTAS DE CARGOS ====================

@router.get("/cargos", response_model=List[CargoResponse], dependencies=[Depends(requer_permissao("rbac:listar_cargos"))])
async def listar_cargos(request: Request, ativo: bool = True, incluir_permissoes: bool = True):
    """Lista todos os cargos com suas permissões"""
    usuario_logado = await get_usuario_autenticado(request)
    
    query = """
        SELECT c.id, c.nome, c.descricao, c.ativo, c.criado_em, c.atualizado_em
        FROM dbo.cargos c
        WHERE c.ativo = ?
        ORDER BY c.nome
    """
    
    resultado = await executar_query(banco="Bddemo", query=query, params=(ativo,), usuario=usuario_logado, endpoint="/rbac")
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    # Busca permissões de cada cargo se solicitado
    if incluir_permissoes:
        for cargo in resultado:
            perm_query = """
                SELECT p.id, p.codigo, p.descricao, p.modulo, p.ativo, p.criado_em
                FROM dbo.permissoes p
                INNER JOIN dbo.cargo_permissoes cp ON p.id = cp.permissao_id
                WHERE cp.cargo_id = ? AND p.ativo = 1
                ORDER BY p.modulo, p.codigo
            """
            perms = await executar_query(banco="Bddemo", query=perm_query, params=(cargo["id"],), usuario=usuario_logado, endpoint="/rbac")
            cargo["permissoes"] = perms if perms and not (isinstance(perms, dict) and "erro" in perms) else []
    
    return resultado


@router.get("/cargos/{cargo_id}", response_model=CargoResponse, dependencies=[Depends(requer_permissao("rbac:obter_cargo"))])
async def obter_cargo(request: Request, cargo_id: int):
    """Obtém detalhes de um cargo específico com suas permissões"""
    usuario_logado = await get_usuario_autenticado(request)
    
    cargo_query = """
        SELECT id, nome, descricao, ativo, criado_em, atualizado_em
        FROM dbo.cargos WHERE id = ?
    """
    cargo_result = await executar_query(banco="Bddemo", query=cargo_query, params=(cargo_id,), usuario=usuario_logado, endpoint="/rbac")
    
    if not cargo_result or len(cargo_result) == 0:
        raise HTTPException(status_code=404, detail="Cargo não encontrado")
    
    if isinstance(cargo_result, dict) and "erro" in cargo_result:
        raise HTTPException(status_code=500, detail=cargo_result["erro"])
    
    cargo = cargo_result[0]
    
    # Busca permissões do cargo
    perm_query = """
        SELECT p.id, p.codigo, p.descricao, p.modulo, p.ativo, p.criado_em
        FROM dbo.permissoes p
        INNER JOIN dbo.cargo_permissoes cp ON p.id = cp.permissao_id
        WHERE cp.cargo_id = ?
        ORDER BY p.modulo, p.codigo
    """
    perms = await executar_query(banco="Bddemo", query=perm_query, params=(cargo_id,), usuario=usuario_logado, endpoint="/rbac")
    cargo["permissoes"] = perms if perms and not (isinstance(perms, dict) and "erro" in perms) else []
    
    return cargo


@router.post("/cargos", response_model=CargoResponse, dependencies=[Depends(requer_permissao("rbac:criar_cargo"))])
async def criar_cargo(request: Request, cargo: CargoCreate):
    """Cria um novo cargo"""
    usuario_logado = await get_usuario_autenticado(request)
    
    # Verifica se nome já existe
    check_query = "SELECT id FROM dbo.cargos WHERE nome = ?"
    check_result = await executar_query(banco="Bddemo", query=check_query, params=(cargo.nome,), usuario=usuario_logado, endpoint="/rbac")
    
    if check_result and len(check_result) > 0:
        raise HTTPException(status_code=400, detail="Nome do cargo já existe")
    
    insert_query = """
        INSERT INTO dbo.cargos (nome, descricao, ativo, criado_em, atualizado_em)
        VALUES (?, ?, ?, GETDATE(), NULL)
        SELECT SCOPE_IDENTITY() as id
    """
    params = (cargo.nome, cargo.descricao, cargo.ativo)
    
    resultado = await executar_query(banco="Bddemo", query=insert_query, params=params, usuario=usuario_logado, endpoint="/rbac", is_select=False)
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    # Busca o cargo criado
    novo_cargo_query = "SELECT * FROM dbo.cargos WHERE id = ?"
    novo_cargo = await executar_query(banco="Bddemo", query=novo_cargo_query, params=(int(resultado[0]["id"]),), usuario=usuario_logado, endpoint="/rbac")
    
    cargo_response = novo_cargo[0]
    cargo_response["permissoes"] = []
    
    return cargo_response


@router.put("/cargos/{cargo_id}", response_model=CargoResponse, dependencies=[Depends(requer_permissao("rbac:atualizar_cargo"))])
async def atualizar_cargo(request: Request, cargo_id: int, cargo: CargoUpdate):
    """Atualiza um cargo e suas permissões"""
    usuario_logado = await get_usuario_autenticado(request)
    
    # Atualiza dados do cargo
    updates = []
    params = []
    
    if cargo.nome is not None:
        updates.append("nome = ?")
        params.append(cargo.nome)
    if cargo.descricao is not None:
        updates.append("descricao = ?")
        params.append(cargo.descricao)
    if cargo.ativo is not None:
        updates.append("ativo = ?")
        params.append(cargo.ativo)
    
    if updates:
        # Adiciona timestamp de atualização
        updates.append("atualizado_em = GETDATE()")
        
        # Constrói a query de update
        update_query = f"UPDATE dbo.cargos SET {', '.join(updates)} WHERE id = ?"
        params.append(cargo_id)
        
        resultado = await executar_query(banco="Bddemo", query=update_query, params=tuple(params), usuario=usuario_logado, endpoint="/rbac", is_select=False)
        
        if isinstance(resultado, dict) and "erro" in resultado:
            raise HTTPException(status_code=500, detail=resultado["erro"])
    
    # Atualiza permissões se fornecidas
    if cargo.permissoes_ids is not None:
        # Remove permissões existentes
        delete_query = "DELETE FROM dbo.cargo_permissoes WHERE cargo_id = ?"
        resultado_delete = await executar_query(banco="Bddemo", query=delete_query, params=(cargo_id,), usuario=usuario_logado, endpoint="/rbac", is_select=False)
        
        if isinstance(resultado_delete, dict) and "erro" in resultado_delete:
            raise HTTPException(status_code=500, detail=resultado_delete["erro"])
        
        # Insere novas permissões
        if cargo.permissoes_ids:
            insert_query = """
                INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id, criado_em)
                VALUES (?, ?, GETDATE())
            """
            for perm_id in cargo.permissoes_ids:
                resultado_insert = await executar_query(banco="Bddemo", query=insert_query, params=(cargo_id, perm_id), usuario=usuario_logado, endpoint="/rbac", is_select=False)
                
                if isinstance(resultado_insert, dict) and "erro" in resultado_insert:
                    raise HTTPException(status_code=500, detail=resultado_insert["erro"])
    
    # Retorna cargo atualizado
    return await obter_cargo(request, cargo_id)


@router.delete("/cargos/{cargo_id}", dependencies=[Depends(requer_permissao("rbac:excluir_cargo"))])
async def excluir_cargo(request: Request, cargo_id: int):
    """Exclui um cargo (apenas se não estiver em uso por usuários)"""
    usuario_logado = await get_usuario_autenticado(request)
    
    # Verifica se há usuários com este cargo
    check_query = """
        SELECT COUNT(*) as total FROM dbo.API_USUARIOS WHERE cargo_id = ? AND ativo = 1
    """
    check_result = await executar_query(banco="Bddemo", query=check_query, params=(cargo_id,), usuario=usuario_logado, endpoint="/rbac")
    
    if check_result and check_result[0]["total"] > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cargo está em uso por {check_result[0]['total']} usuário(s) ativo(s)"
        )
    
    delete_query = "DELETE FROM dbo.cargos WHERE id = ?"
    resultado = await executar_query(banco="Bddemo", query=delete_query, params=(cargo_id,), usuario=usuario_logado, endpoint="/rbac", is_select=False)
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return {"mensagem": "Cargo excluído com sucesso"}


# ==================== ROTAS DE USUÁRIO-CARGO ====================

@router.put("/cargos/usuarios/{usuario_id}", dependencies=[Depends(requer_permissao("rbac:atribuir_cargo_usuario"))])
async def atribuir_cargo_usuario(request: Request, usuario_id: int, dados: UsuarioCargoUpdate):
    """Atribui ou remove cargo de um usuário"""
    usuario_logado = await get_usuario_autenticado(request)
    
    # Verifica se o usuário existe
    user_check = await executar_query(
        banco="Bddemo", 
        query="SELECT id FROM dbo.API_USUARIOS WHERE id = ?", 
        params=(usuario_id,), 
        usuario=usuario_logado, 
        endpoint="/rbac"
    )
    if not user_check or len(user_check) == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    update_query = """
        UPDATE dbo.API_USUARIOS
        SET cargo_id = ?
        WHERE id = ?
    """
    
    cargo_id_valor = dados.cargo_id if dados.cargo_id is not None else None
    resultado = await executar_query(banco="Bddemo", query=update_query, params=(cargo_id_valor, usuario_id), usuario=usuario_logado, endpoint="/rbac", is_select=False)
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return {
        "mensagem": "Cargo atualizado com sucesso. O usuário precisa fazer logout e login novamente para aplicar as novas permissões."
    }


# ==================== ROTAS AUXILIARES ====================

@router.get("/usuarios/{usuario_id}/permissoes", dependencies=[Depends(requer_permissao("rbac:listar_permissoes_usuario"))])
async def listar_permissoes_usuario(request: Request, usuario_id: int):
    """Lista todas as permissões de um usuário baseado no seu cargo"""
    usuario_logado = await get_usuario_autenticado(request)
    
    query = """
        SELECT DISTINCT p.id, p.codigo, p.descricao, p.modulo, p.ativo
        FROM dbo.permissoes p
        INNER JOIN dbo.cargo_permissoes cp ON p.id = cp.permissao_id
        INNER JOIN dbo.cargos c ON cp.cargo_id = c.id
        INNER JOIN dbo.API_USUARIOS u ON c.id = u.cargo_id
        WHERE u.id = ? AND p.ativo = 1 AND c.ativo = 1 AND u.ativo = 1
        ORDER BY p.modulo, p.codigo
    """
    
    resultado = await executar_query(banco="Bddemo", query=query, params=(usuario_id,), usuario=usuario_logado, endpoint="/rbac")
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado


@router.get("/usuarios/{usuario_id}/verificar-permissao", dependencies=[Depends(requer_permissao("rbac:verificar_permissao_usuario"))])
async def verificar_permissao_usuario(request: Request, usuario_id: int, permissao_codigo: str):
    """Verifica se um usuário possui uma permissão específica"""
    usuario_logado = await get_usuario_autenticado(request)
    
    query = """
        SELECT COUNT(*) as tem_permissao
        FROM dbo.permissoes p
        INNER JOIN dbo.cargo_permissoes cp ON p.id = cp.permissao_id
        INNER JOIN dbo.cargos c ON cp.cargo_id = c.id
        INNER JOIN dbo.API_USUARIOS u ON c.id = u.cargo_id
        WHERE u.id = ? AND p.codigo = ? AND p.ativo = 1 AND c.ativo = 1 AND u.ativo = 1
    """
    
    resultado = await executar_query(banco="Bddemo", query=query, params=(usuario_id, permissao_codigo), usuario=usuario_logado, endpoint="/rbac")
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    tem_permissao = resultado[0]["tem_permissao"] > 0 if resultado else False
    
    return {
        "usuario_id": usuario_id,
        "permissao": permissao_codigo,
        "autorizado": tem_permissao
    }
