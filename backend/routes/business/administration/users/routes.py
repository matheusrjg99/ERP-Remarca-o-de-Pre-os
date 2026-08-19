"""
Rotas de Gestão de Usuários - CRUD e Status.
Módulo Business/Administration: Responsável pela administração de usuários do sistema.
Apenas definição de endpoints, injeção de dependências e retorno de respostas HTTP.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from auth.seguranca import gerar_hash_senha, get_current_user, requer_permissao
from .services import UserService
from .schemas import UsuarioNovo, UsuarioResponse, StatusResponse


router = APIRouter(prefix="/users", tags=["Administração de Usuários"])


@router.get("", response_model=list[UsuarioResponse])
async def listar_usuarios(current_user: dict = Depends(requer_permissao("usuarios:gerenciar"))):
    """
    Lista todos os usuários do sistema.
    Requer permissão: usuarios:gerenciar (ou admin_total).
    """
    service = UserService(current_user)
    return await service.listar_todos()


@router.post("", status_code=status.HTTP_201_CREATED)
async def cadastrar_usuario(
    dados: UsuarioNovo, 
    current_user: dict = Depends(requer_permissao("usuarios:gerenciar"))
):
    """
    Cadastra um novo usuário no sistema.
    Requer permissão: usuarios:gerenciar (ou admin_total).
    """
    service = UserService(current_user)
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
    current_user: dict = Depends(requer_permissao("usuarios:gerenciar"))
):
    """
    Ativa ou desativa um usuário.
    Requer permissão: usuarios:gerenciar (ou admin_total).
    """
    service = UserService(current_user)
    sucesso = await service.alternar_status(login_user=login_user, ativo=ativo)
    
    if not sucesso:
        raise HTTPException(status_code=500, detail="Erro ao atualizar status do usuário.")
    
    return StatusResponse(status="sucesso", mensagem=f"Status do usuário {login_user} atualizado.")
