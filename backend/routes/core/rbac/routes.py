"""
Rotas da API para Gestão RBAC
Responsável por definir endpoints e delegar lógica para os serviços
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional

# Importa schemas
from .schemas import (
    PermissaoCreate, PermissaoUpdate, PermissaoResponse,
    CargoCreate, CargoUpdate, CargoResponse,
    UsuarioCargoUpdate, MensagemSucesso, VerificacaoPermissao
)

# Importa serviço
from .services import RBACService

# Importa autenticação
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from security import get_current_user_permissions, requer_permissao

router = APIRouter(prefix="/rbac", tags=["RBAC - Controle de Acesso"])


# ==================== DEPENDÊNCIAS ====================

async def get_usuario_autenticado(request: Request) -> str:
    """Extrai o login do usuário autenticado a partir do token JWT"""
    user_data = await get_current_user_permissions(request)
    return user_data["user_login"]


async def get_rbac_service(request: Request) -> RBACService:
    """Cria instância do serviço RBAC com usuário autenticado"""
    usuario_logado = await get_usuario_autenticado(request)
    return RBACService(usuario_logado)


# ==================== ROTAS DE PERMISSÕES ====================

@router.get("/permissoes", response_model=List[PermissaoResponse], 
            dependencies=[Depends(requer_permissao("rbac:listar_permissoes"))])
async def listar_permissoes(
    request: Request, 
    modulo: Optional[str] = None, 
    ativo: bool = True,
    service: RBACService = Depends(get_rbac_service)
):
    """Lista todas as permissões, opcionalmente filtradas por módulo"""
    try:
        return await service.listar_permissoes(modulo=modulo, ativo=ativo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/permissoes", response_model=PermissaoResponse, 
             dependencies=[Depends(requer_permissao("rbac:criar_permissao"))])
async def criar_permissao(
    request: Request, 
    permissao: PermissaoCreate,
    service: RBACService = Depends(get_rbac_service)
):
    """Cria uma nova permissão"""
    try:
        return await service.criar_permissao(
            codigo=permissao.codigo,
            descricao=permissao.descricao,
            modulo=permissao.modulo,
            ativo=permissao.ativo
        )
    except Exception as e:
        if "já existe" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/permissoes/{permissao_id}", response_model=PermissaoResponse, 
            dependencies=[Depends(requer_permissao("rbac:atualizar_permissao"))])
async def atualizar_permissao(
    request: Request, 
    permissao_id: int, 
    permissao: PermissaoUpdate,
    service: RBACService = Depends(get_rbac_service)
):
    """Atualiza uma permissão existente"""
    try:
        dados_atualizacao = {k: v for k, v in permissao.model_dump().items() if v is not None}
        
        if not dados_atualizacao:
            raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
        
        return await service.atualizar_permissao(permissao_id, **dados_atualizacao)
    except HTTPException:
        raise
    except Exception as e:
        if "não encontrada" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/permissoes/{permissao_id}", response_model=MensagemSucesso, 
               dependencies=[Depends(requer_permissao("rbac:excluir_permissao"))])
async def excluir_permissao(
    request: Request, 
    permissao_id: int,
    service: RBACService = Depends(get_rbac_service)
):
    """Exclui uma permissão (apenas se não estiver em uso)"""
    try:
        return await service.excluir_permissao(permissao_id)
    except Exception as e:
        if "em uso" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ROTAS DE CARGOS ====================

@router.get("/cargos", response_model=List[CargoResponse], 
            dependencies=[Depends(requer_permissao("rbac:listar_cargos"))])
async def listar_cargos(
    request: Request, 
    ativo: bool = True, 
    incluir_permissoes: bool = True,
    service: RBACService = Depends(get_rbac_service)
):
    """Lista todos os cargos com suas permissões"""
    try:
        return await service.listar_cargos(ativo=ativo, incluir_permissoes=incluir_permissoes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cargos/{cargo_id}", response_model=CargoResponse, 
            dependencies=[Depends(requer_permissao("rbac:obter_cargo"))])
async def obter_cargo(
    request: Request, 
    cargo_id: int,
    service: RBACService = Depends(get_rbac_service)
):
    """Obtém detalhes de um cargo específico com suas permissões"""
    try:
        cargo = await service.obter_cargo_por_id(cargo_id)
        
        if not cargo:
            raise HTTPException(status_code=404, detail="Cargo não encontrado")
        
        return cargo
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cargos", response_model=CargoResponse, 
             dependencies=[Depends(requer_permissao("rbac:criar_cargo"))])
async def criar_cargo(
    request: Request, 
    cargo: CargoCreate,
    service: RBACService = Depends(get_rbac_service)
):
    """Cria um novo cargo"""
    try:
        return await service.criar_cargo(
            nome=cargo.nome,
            descricao=cargo.descricao,
            ativo=cargo.ativo
        )
    except Exception as e:
        if "já existe" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/cargos/{cargo_id}", response_model=CargoResponse, 
            dependencies=[Depends(requer_permissao("rbac:atualizar_cargo"))])
async def atualizar_cargo(
    request: Request, 
    cargo_id: int, 
    cargo: CargoUpdate,
    service: RBACService = Depends(get_rbac_service)
):
    """Atualiza um cargo e suas permissões"""
    try:
        return await service.atualizar_cargo(
            cargo_id=cargo_id,
            nome=cargo.nome,
            descricao=cargo.descricao,
            ativo=cargo.ativo,
            permissoes_ids=cargo.permissoes_ids
        )
    except Exception as e:
        if "não encontrado" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/cargos/{cargo_id}", response_model=MensagemSucesso, 
               dependencies=[Depends(requer_permissao("rbac:excluir_cargo"))])
async def excluir_cargo(
    request: Request, 
    cargo_id: int,
    service: RBACService = Depends(get_rbac_service)
):
    """Exclui um cargo (apenas se não estiver em uso por usuários)"""
    try:
        return await service.excluir_cargo(cargo_id)
    except Exception as e:
        if "em uso" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ROTAS DE USUÁRIO-CARGO ====================

@router.put("/cargos/usuarios/{usuario_id}", response_model=MensagemSucesso, 
            dependencies=[Depends(requer_permissao("rbac:atribuir_cargo_usuario"))])
async def atribuir_cargo_usuario(
    request: Request, 
    usuario_id: int, 
    dados: UsuarioCargoUpdate,
    service: RBACService = Depends(get_rbac_service)
):
    """Atribui ou remove cargo de um usuário"""
    try:
        return await service.atribuir_cargo_usuario(
            usuario_id=usuario_id,
            cargo_id=dados.cargo_id
        )
    except Exception as e:
        if "não encontrado" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ROTAS AUXILIARES ====================

@router.get("/usuarios/{usuario_id}/permissoes", 
            dependencies=[Depends(requer_permissao("rbac:listar_permissoes_usuario"))])
async def listar_permissoes_usuario(
    request: Request, 
    usuario_id: int,
    service: RBACService = Depends(get_rbac_service)
):
    """Lista todas as permissões de um usuário baseado no seu cargo"""
    try:
        return await service.listar_permissoes_usuario(usuario_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/usuarios/{usuario_id}/verificar-permissao", response_model=VerificacaoPermissao,
            dependencies=[Depends(requer_permissao("rbac:verificar_permissao_usuario"))])
async def verificar_permissao_usuario(
    request: Request, 
    usuario_id: int, 
    permissao_codigo: str,
    service: RBACService = Depends(get_rbac_service)
):
    """Verifica se um usuário possui uma permissão específica"""
    try:
        return await service.verificar_permissao_usuario(
            usuario_id=usuario_id,
            permissao_codigo=permissao_codigo
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
