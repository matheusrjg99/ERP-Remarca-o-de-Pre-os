"""
Rotas de Autenticação - Endpoints HTTP
Módulo Core: Responsável pela definição de endpoints e injeção de dependências.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from auth.seguranca import obter_permissoes_usuario, SECRET_KEY, ALGORITHM
from .schemas import LoginData, Token, UsuarioInfo, UsuarioSistema
from .services import AuthService

# Router principal com prefixo /auth
router = APIRouter(prefix="/auth", tags=["Autenticação"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


@router.post("/login", response_model=Token)
async def login(dados: LoginData):
    """
    Realiza o login do usuário e retorna token JWT com permissões.
    Endpoint: /auth/login
    """
    # Autenticar usuário
    usuario_data = await AuthService.autenticar_usuario(dados)
    
    # Gerar token JWT
    token_jwt = await AuthService.gerar_token(usuario_data)
    
    return {
        "access_token": token_jwt,
        "token_type": "bearer",
        "usuario": usuario_data["login"],
        "nome": usuario_data["nome"],
        "permissoes": usuario_data["permissoes"]
    }


# Router de compatibilidade para frontend antigo (sem prefixo)
# Isso permite que requisições POST /login continuem funcionando
router_compat = APIRouter(tags=["Autenticação"])


@router_compat.post("/login", response_model=Token)
async def login_compat(dados: LoginData):
    """
    Endpoint de compatibilidade: /login (mesma função que /auth/login)
    Mantido para suportar frontends que ainda usam a rota antiga.
    """
    return await login(dados)


@router.get("/usuarios", response_model=list[UsuarioSistema])
async def listar_usuarios_sistema():
    """
    Lista todos usuários do sistema para vinculação com colaboradores.
    Endpoint: /auth/usuarios
    
    IMPORTANTE: Retorna também o cargo_id e cargo_nome de cada usuário
    para que o frontend possa exibir as informações corretamente no RBACManager.
    """
    return await AuthService.listar_usuarios_sistema()


@router.get("/meus-dados", response_model=UsuarioInfo)
async def get_current_user_info(token: str = Depends(oauth2_scheme)):
    """
    Retorna informações do usuário autenticado e suas permissões.
    Endpoint: /auth/meus-dados
    """
    # Validar token e obter login
    token_data = await AuthService.validar_token(token)
    login = token_data.sub
    
    # Buscar dados completos do usuário
    usuario = await AuthService.obter_dados_usuario(login)
    permissoes = await obter_permissoes_usuario(login)
    
    return {
        "id": usuario.get("id"),
        "login": usuario.get("login"),
        "nome": usuario.get("nome"),
        "cargo_id": usuario.get("cargo_id"),
        "permissions": permissoes
    }
