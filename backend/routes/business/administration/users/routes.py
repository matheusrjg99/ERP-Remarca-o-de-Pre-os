"""
Rotas de Gestão de Usuários - CRUD e Status.
Módulo Business/Administration: Responsável pela administração de usuários do sistema.
Apenas definição de endpoints, injeção de dependências e retorno de respostas HTTP.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from auth.seguranca import gerar_hash_senha
from auth.rbac.services import verificar_permissao_usuario
from .services import UserService
from .schemas import UsuarioNovo, UsuarioResponse, StatusResponse


router = APIRouter(prefix="/users", tags=["Administração de Usuários"])


@router.get("", response_model=list[UsuarioResponse])
async def listar_usuarios(usuario_logado: str = Depends(verificar_permissao_usuario("usuarios:gerenciar"))):
    """
    Lista todos os usuários do sistema.
    Requer permissão: usuarios:gerenciar (ou admin_total).
    """
    service = UserService(usuario_logado)
    return await service.listar_todos()


@router.post("", status_code=status.HTTP_201_CREATED)
async def cadastrar_usuario(
    dados: UsuarioNovo, 
    usuario_logado: str = Depends(verificar_permissao_usuario("usuarios:gerenciar"))
):
    """
    Cadastra um novo usuário no sistema.
    Requer permissão: usuarios:gerenciar (ou admin_total).
    """
    service = UserService(usuario_logado)
    hash_senha = gerar_hash_senha(dados.senha)
    
    sucesso = await service.criar_usuario(
        login=dados.login,
        senha_hash=hash_senha,
        nome=dados.nome,
        cargo_id=dados.cargo_id
    )
    
    if not sucesso:
        raise HTTPException(status_code=500, detail="Erro ao salvar usuário no banco.")
    
    return {"status": "sucesso", "mensagem": f"Usuário {dados.login} criado!"}


@router.put("/{login_user}/status", response_model=StatusResponse)
async def alternar_status_usuario(
    login_user: str, 
    ativo: int, 
    usuario_logado: str = Depends(verificar_permissao_usuario("usuarios:gerenciar"))
):
    """
    Ativa ou desativa um usuário.
    Requer permissão: usuarios:gerenciar (ou admin_total).
    """
    service = UserService(usuario_logado)
    sucesso = await service.alternar_status(login_user=login_user, ativo=ativo)
    
    if not sucesso:
        raise HTTPException(status_code=500, detail="Erro ao atualizar status do usuário.")
    
    return StatusResponse(status="sucesso", mensagem=f"Status do usuário {login_user} atualizado.")
