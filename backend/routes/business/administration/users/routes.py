"""
Rotas de Gestão de Usuários - CRUD e Status.
Módulo Business/Administration: Responsável pela administração de usuários do sistema.
Apenas definição de endpoints, injeção de dependências e retorno de respostas HTTP.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from auth.seguranca import gerar_hash_senha, get_current_user, requer_permissao
from .services import UserService
from .schemas import (
    UsuarioNovo,
    UsuarioResponse,
    UsuarioDetalheResponse,
    UsuarioUpdate,
    StatusResponse,
)


router = APIRouter(prefix="/users", tags=["Administração de Usuários"])


# ==================== CONFIGURAÇÕES ====================

# ID do cargo de Administrador (usado para validação de "último admin")
CARGO_ADMIN_ID = 1


# ==================== HELPERS ====================

def _obter_login_logado(current_user: dict) -> str:
    """
    Extrai o login do usuário logado a partir do payload do JWT.
    
    O campo `usuario_id` do JWT contém o LOGIN do usuário (não o id numérico),
    conforme definido em auth/seguranca.py.
    """
    return (current_user.get("usuario_id") or "").strip().lower()


# ==================== ROTAS ====================

@router.get("", response_model=list[UsuarioResponse])
async def listar_usuarios(current_user: dict = Depends(requer_permissao("admin:usuarios"))):
    """
    Lista todos os usuários do sistema.
    Requer permissão: admin:usuarios (ou admin_total).
    """
    service = UserService(current_user)
    return await service.listar_todos()


@router.post("", status_code=status.HTTP_201_CREATED)
async def cadastrar_usuario(
    dados: UsuarioNovo, 
    current_user: dict = Depends(requer_permissao("admin:usuarios"))
):
    """
    Cadastra um novo usuário no sistema.
    Requer permissão: admin:usuarios (ou admin_total).
    """
    import logging
    import traceback
    
    service = UserService(current_user)
    
    # LOG: payload recebido
    logging.debug(
        f"[DEBUG POST /users] Payload: login={dados.login!r}, "
        f"nome={dados.nome!r}, cargo_id={dados.cargo_id!r}, "
        f"senha_len={len(dados.senha) if dados.senha else 0}"
    )
    
    # 1. Verifica se o login já existe
    usuario_existente = await service.buscar_usuario(dados.login)
    if usuario_existente:
        logging.error(f"[DEBUG POST /users] Login '{dados.login}' já existe")
        raise HTTPException(
            status_code=400,
            detail=f"O login '{dados.login}' já está em uso. Escolha outro."
        )
    
    # 2. Gera o hash da senha
    try:
        hash_senha = gerar_hash_senha(dados.senha)
        logging.debug(f"[DEBUG POST /users] Hash gerado com sucesso")
    except Exception as e:
        logging.error(f"[DEBUG POST /users] Erro ao gerar hash: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar senha: {type(e).__name__} — {str(e)}"
        )
    
    # 3. Tenta criar e captura o erro real
    try:
        sucesso = await service.criar_usuario(
            login=dados.login,
            senha_hash=hash_senha,
            nome=dados.nome,
            cargo_id=dados.cargo_id
        )
    except Exception as e:
        traceback.print_exc()
        logging.error(
            f"[DEBUG POST /users] EXCEÇÃO: {type(e).__name__} — {str(e)}"
        )
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar usuário: {type(e).__name__} — {str(e)}"
        )
    
    if not sucesso:
        logging.error(
            f"[DEBUG POST /users] criar_usuario retornou False. "
            f"Possíveis causas: login duplicado, cargo inválido, ou erro no banco."
        )
        raise HTTPException(
            status_code=500,
            detail="Erro ao salvar usuário. Verifique se o login já existe ou se o cargo é válido."
        )
    
    logging.debug(f"[DEBUG POST /users] Usuário '{dados.login}' criado com sucesso!")
    return {
        "status": "sucesso",
        "mensagem": f"Usuário {dados.login} criado!"
    }

# ==================== DETALHE ====================

@router.get("/{login_user}", response_model=UsuarioDetalheResponse)
async def obter_usuario(
    login_user: str,
    current_user: dict = Depends(requer_permissao("admin:usuarios"))
):
    """
    Busca dados detalhados de um usuário específico pelo login.
    Requer permissão: admin:usuarios (ou admin_total).
    """
    service = UserService(current_user)
    usuario = await service.buscar_usuario(login_user)
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    return usuario


# ==================== ATUALIZAÇÃO ====================

@router.put("/{login_user}/status", response_model=StatusResponse)
async def alternar_status_usuario(
    login_user: str, 
    ativo: int, 
    current_user: dict = Depends(requer_permissao("admin:usuarios"))
):
    """
    Ativa ou desativa um usuário.
    Requer permissão: admin:usuarios (ou admin_total).
    """
    service = UserService(current_user)
    sucesso = await service.alternar_status(login_user=login_user, ativo=ativo)
    
    if not sucesso:
        raise HTTPException(status_code=500, detail="Erro ao atualizar status do usuário.")
    
    return StatusResponse(status="sucesso", mensagem=f"Status do usuário {login_user} atualizado.")


@router.put("/{login_user}", response_model=StatusResponse)
async def atualizar_usuario(
    login_user: str,
    dados: UsuarioUpdate,
    current_user: dict = Depends(requer_permissao("admin:usuarios"))
):
    """
    Atualiza PARCIALMENTE os dados de um usuário (nome, senha, cargo).
    
    Regra: apenas os campos enviados são atualizados.
    - Se `nome` for enviado → atualiza
    - Se `senha` for enviada → hasheada e atualizada
    - Se `cargo_id` for enviado → atualiza
    
    Login NÃO é editável.
    
    Requer permissão: admin:usuarios (ou admin_total).
    """
    service = UserService(current_user)
    
    # 1. Verifica se o usuário existe
    usuario_existente = await service.buscar_usuario(login_user)
    if not usuario_existente:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    # 2. Prepara os campos a atualizar
    nome = dados.nome
    cargo_id = dados.cargo_id
    senha_hash = None
    
    if dados.senha is not None:
        senha_hash = gerar_hash_senha(dados.senha)
    
    # 3. Verifica se há algo para atualizar
    if nome is None and senha_hash is None and cargo_id is None:
        raise HTTPException(
            status_code=400,
            detail="Nenhum campo fornecido para atualização."
        )
    
    # 4. Executa a atualização parcial
    sucesso = await service.atualizar_usuario(
        login=login_user,
        nome=nome,
        senha_hash=senha_hash,
        cargo_id=cargo_id
    )
    
    if not sucesso:
        raise HTTPException(status_code=500, detail="Erro ao atualizar usuário.")
    
    return StatusResponse(
        status="sucesso",
        mensagem=f"Usuário {login_user} atualizado com sucesso."
    )


# ==================== EXCLUSÃO (SOFT DELETE) ====================

@router.delete("/{login_user}", response_model=StatusResponse)
async def excluir_usuario(
    login_user: str,
    current_user: dict = Depends(requer_permissao("admin:usuarios"))
):
    """
    Exclui (soft delete) um usuário — na prática, apenas desativa.
    
    Validações de segurança:
    1. Não pode excluir a si mesmo
    2. Não pode excluir o último administrador ativo
    
    Requer permissão: admin:usuarios (ou admin_total).
    """
    service = UserService(current_user)
    
    # 1. Verifica se o usuário existe
    usuario = await service.buscar_usuario(login_user)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    # 2. Validação: não pode excluir a si mesmo
    login_logado = _obter_login_logado(current_user)
    if login_user.strip().lower() == login_logado:
        raise HTTPException(
            status_code=400,
            detail="Você não pode excluir a si mesmo."
        )
    
    # 3. Validação: não pode excluir o último administrador ativo
    if usuario.get("cargo_id") == CARGO_ADMIN_ID:
        total_admins = await service.contar_admins_ativos(CARGO_ADMIN_ID)
        if total_admins <= 1:
            raise HTTPException(
                status_code=400,
                detail="Não é possível excluir o último administrador ativo."
            )
    
    # 4. Executa o soft delete
    sucesso = await service.excluir_usuario(login_user)
    
    if not sucesso:
        raise HTTPException(status_code=500, detail="Erro ao excluir usuário.")
    
    return StatusResponse(
        status="sucesso",
        mensagem=f"Usuário {login_user} foi desativado."
    )