"""
Rotas da API para Gestão RBAC
Responsável por definir endpoints e delegar lógica para os serviços

IMPORTANTE: Permissões são READ-ONLY via API.
Criação/edição de permissões deve ser feita via SQL/migration/seed.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional

# Importa schemas
from .schemas import (
    PermissaoResponse,
    CargoCreate, CargoUpdate, CargoResponse,
    CargoSimplesResponse,
    UsuarioCargoUpdate,
    UsuarioResponse,
    MensagemSucesso,
    VerificacaoPermissao,
    AtribuirPermissoesCargo
)

# Importa serviço
from .services import RBACService

# Importa autenticação
from auth.seguranca import get_current_user, requer_permissao

router = APIRouter(prefix="/rbac", tags=["RBAC - Controle de Acesso"])


# ==================== DEPENDÊNCIAS ====================

async def get_rbac_service(current_user: dict = Depends(get_current_user)) -> RBACService:
    """Cria instância do serviço RBAC com usuário autenticado"""
    usuario_logado = current_user.get("nome", current_user.get("usuario_id", "desconhecido"))
    return RBACService(usuario_logado)


# ==================== ROTAS DE PERMISSÕES (READ-ONLY) ====================
# Permissões são apenas consultadas via API.
# Para adicionar/editar permissões: usar SQL/migration/seed no backend.

@router.get(
    "/permissoes",
    response_model=List[PermissaoResponse],
    dependencies=[Depends(requer_permissao("rbac:permissao_visualizar"))]
)
async def listar_permissoes(
    modulo: Optional[str] = Query(None, description="Filtrar por módulo"),
    ativo: bool = Query(True, description="Filtrar apenas ativas"),
    agrupar_por_modulo: bool = Query(False, description="Agrupar por módulo"),
    service: RBACService = Depends(get_rbac_service)
):
    """
    Lista todas as permissões, opcionalmente filtradas por módulo.
    Retorna agrupado por módulo se `agrupar_por_modulo=True`.
    """
    try:
        return await service.listar_permissoes(
            modulo=modulo,
            ativo=ativo,
            agrupar_por_modulo=agrupar_por_modulo
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/permissoes/{permissao_id}",
    response_model=PermissaoResponse,
    dependencies=[Depends(requer_permissao("rbac:permissao_visualizar"))]
)
async def obter_permissao(
    permissao_id: int,
    service: RBACService = Depends(get_rbac_service)
):
    """Obtém uma permissão específica pelo ID"""
    try:
        permissao = await service.obter_permissao_por_id(permissao_id)
        if not permissao:
            raise HTTPException(status_code=404, detail="Permissão não encontrada")
        return permissao
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ROTAS DE CARGOS ====================

@router.get(
    "/cargos",
    response_model=List[CargoResponse],
    dependencies=[Depends(requer_permissao("rbac:cargo_visualizar"))]
)
async def listar_cargos(
    ativo: bool = Query(True, description="Filtrar apenas ativos"),
    incluir_permissoes: bool = Query(True, description="Incluir permissões de cada cargo"),
    incluir_usuarios_count: bool = Query(False, description="Incluir contagem de usuários"),
    service: RBACService = Depends(get_rbac_service)
):
    """Lista todos os cargos com suas permissões"""
    try:
        return await service.listar_cargos(
            ativo=ativo,
            incluir_permissoes=incluir_permissoes,
            incluir_usuarios_count=incluir_usuarios_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/cargos/simples",
    response_model=List[CargoSimplesResponse],
    dependencies=[Depends(requer_permissao("rbac:cargo_visualizar"))]
)
async def listar_cargos_simples(
    ativo: bool = Query(True),
    service: RBACService = Depends(get_rbac_service)
):
    """Lista cargos de forma leve (sem permissões). Útil para dropdowns."""
    try:
        return await service.listar_cargos_simples(ativo=ativo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/cargos/{cargo_id}",
    response_model=CargoResponse,
    dependencies=[Depends(requer_permissao("rbac:cargo_visualizar"))]
)
async def obter_cargo(
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


@router.get(
    "/cargos/{cargo_id}/usuarios",
    response_model=List[UsuarioResponse],
    dependencies=[Depends(requer_permissao("rbac:cargo_visualizar"))]
)
async def obter_usuarios_do_cargo(
    cargo_id: int,
    service: RBACService = Depends(get_rbac_service)
):
    """Lista todos os usuários ativos com um determinado cargo"""
    try:
        return await service.obter_usuarios_do_cargo(cargo_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/cargos",
    response_model=CargoResponse,
    dependencies=[Depends(requer_permissao("rbac:cargo_criar"))]
)
async def criar_cargo(
    cargo: CargoCreate,
    service: RBACService = Depends(get_rbac_service)
):
    """Cria um novo cargo, opcionalmente já com permissões"""
    try:
        return await service.criar_cargo(
            nome=cargo.nome,
            descricao=cargo.descricao,
            ativo=cargo.ativo,
            permissoes_ids=cargo.permissoes_ids if hasattr(cargo, 'permissoes_ids') else None
        )
    except Exception as e:
        if "já existe" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.put(
    "/cargos/{cargo_id}",
    response_model=CargoResponse,
    dependencies=[Depends(requer_permissao("rbac:cargo_editar"))]
)
async def atualizar_cargo(
    cargo_id: int,
    cargo: CargoUpdate,
    service: RBACService = Depends(get_rbac_service)
):
    """
    Atualiza um cargo. As permissões só serão alteradas se
    `permissoes_ids` for fornecido (mesmo que vazio).
    """
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
        if "já existe" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.put(
    "/cargos/{cargo_id}/permissoes",
    response_model=CargoResponse,
    dependencies=[Depends(requer_permissao("rbac:cargo_editar"))]
)
async def atribuir_permissoes_ao_cargo(
    cargo_id: int,
    dados: AtribuirPermissoesCargo,
    service: RBACService = Depends(get_rbac_service)
):
    """
    Substitui APENAS as permissões de um cargo (sem alterar nome/descrição/ativo).
    Endpoint dedicado para gestão de permissões.
    """
    try:
        return await service.atribuir_permissoes_ao_cargo(
            cargo_id=cargo_id,
            permissoes_ids=dados.permissoes_ids
        )
    except Exception as e:
        if "não encontrado" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/cargos/{cargo_id}",
    response_model=MensagemSucesso,
    dependencies=[Depends(requer_permissao("rbac:cargo_excluir"))]
)
async def excluir_cargo(
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
# NOTA: A API /users expõe apenas o LOGIN como identificador do usuário.
# Por isso, estas rotas recebem o login (string) em vez do id (int).

@router.put(
    "/usuarios/{usuario_login}/cargo",
    response_model=MensagemSucesso,
    dependencies=[Depends(requer_permissao("rbac:atribuir_cargo_usuario"))]
)
async def atribuir_cargo_usuario(
    usuario_login: str,
    dados: UsuarioCargoUpdate,
    service: RBACService = Depends(get_rbac_service)
):
    """
    Atribui ou remove cargo de um usuário PELO LOGIN.
    Envie `cargo_id: null` para remover o cargo.
    """
    try:
        return await service.atribuir_cargo_usuario_por_login(
            usuario_login=usuario_login,
            cargo_id=dados.cargo_id
        )
    except Exception as e:
        if "não encontrado" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/usuarios/{usuario_login}/cargo",
    response_model=MensagemSucesso,
    dependencies=[Depends(requer_permissao("rbac:atribuir_cargo_usuario"))]
)
async def remover_cargo_usuario(
    usuario_login: str,
    service: RBACService = Depends(get_rbac_service)
):
    """Remove o cargo de um usuário pelo LOGIN (define como NULL)"""
    try:
        return await service.remover_cargo_do_usuario_por_login(usuario_login)
    except Exception as e:
        if "não encontrado" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ROTAS AUXILIARES DE USUÁRIO ====================

@router.get(
    "/usuarios/{usuario_id}/permissoes",
    response_model=List[PermissaoResponse],
    dependencies=[Depends(requer_permissao("rbac:permissao_visualizar"))]
)
async def listar_permissoes_usuario(
    usuario_id: int,
    service: RBACService = Depends(get_rbac_service)
):
    """Lista todas as permissões de um usuário baseado no seu cargo"""
    try:
        return await service.listar_permissoes_usuario(usuario_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/usuarios/{usuario_id}/verificar-permissao",
    response_model=VerificacaoPermissao,
    dependencies=[Depends(requer_permissao("rbac:permissao_visualizar"))]
)
async def verificar_permissao_usuario(
    usuario_id: int,
    permissao: str = Query(..., description="Código da permissão (ex: 'nc:criar')"),
    service: RBACService = Depends(get_rbac_service)
):
    """Verifica se um usuário possui uma permissão específica"""
    try:
        return await service.verificar_permissao_usuario(
            usuario_id=usuario_id,
            permissao_codigo=permissao
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))