"""
Rotas de Autenticação - Login e Token JWT
Módulo Core: Responsável pela segurança e autenticação do sistema.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from pydantic import BaseModel

from database import executar_query
from models.schemas import LoginData, Token
from auth.seguranca import verificar_senha, criar_token_acesso, obter_permissoes_usuario, SECRET_KEY, ALGORITHM

# Router principal com prefixo /auth (novo padrão)
router = APIRouter(prefix="/auth", tags=["Autenticação"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/login", response_model=Token)
async def login(dados: LoginData):
    """
    Realiza o login do usuário e retorna token JWT com permissões.
    Endpoint: /auth/login
    """
    query = "SELECT login, senha_hash, nivel_acesso, nome FROM API_USUARIOS WHERE login = ? AND ativo = 1"
    resultado = await executar_query(
        banco="Bddemo", 
        query=query, 
        params=(dados.login,), 
        usuario="SISTEMA", 
        endpoint="/login"
    )
    
    if not resultado or not isinstance(resultado, list):
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    usuario_db = resultado[0]
    
    if not verificar_senha(dados.senha, usuario_db["senha_hash"]):
        raise HTTPException(status_code=401, detail="Senha incorreta")
    
    # Buscar permissões do usuário baseado no cargo
    permissoes = await obter_permissoes_usuario(usuario_db["login"])
    
    # Criar token incluindo as permissões
    token_jwt = criar_token_acesso(dados={
        "sub": usuario_db["login"],
        "nivel": usuario_db["nivel_acesso"],
        "permissions": permissoes,
        "nome": usuario_db.get("nome", "")
    })
    
    return {
        "access_token": token_jwt,
        "token_type": "bearer",
        "nivel_acesso": usuario_db["nivel_acesso"],
        "usuario": usuario_db["login"],
        "nome": usuario_db.get("nome", ""),
        "permissions": permissoes
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

@router.get("/usuarios")
async def listar_usuarios_sistema():
    """
    Lista todos usuários do sistema para vinculação com colaboradores.
    Endpoint: /auth/usuarios
    
    IMPORTANTE: Retorna também o cargo_id e cargo_nome de cada usuário
    para que o frontend possa exibir as informações corretamente no RBACManager.
    """
    query = """
        SELECT 
            u.id, 
            u.login as username, 
            u.nome,
            u.cargo_id,
            c.nome as cargo_nome
        FROM dbo.API_USUARIOS u
        LEFT JOIN dbo.cargos c ON u.cargo_id = c.id AND c.ativo = 1
        WHERE u.ativo = 1 
        ORDER BY u.nome
    """
    resultado = await executar_query(
        banco="Bddemo",
        query=query,
        params=(),
        usuario="SISTEMA",
        endpoint="/auth/usuarios"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado if resultado else []

@router.get("/meus-dados")
async def get_current_user_info(token: str = Depends(oauth2_scheme)):
    """
    Retorna informações do usuário autenticado e suas permissões.
    Endpoint: /auth/meus-dados
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        login: str = payload.get("sub")
        
        if login is None:
            raise HTTPException(status_code=401, detail="Token inválido")
            
        # Buscar dados completos do usuário
        query = "SELECT id, login, nome, email, cargo_id FROM API_USUARIOS WHERE login = ? AND ativo = 1"
        resultado = await executar_query(
            banco="Bddemo",
            query=query,
            params=(login,),
            usuario="SISTEMA",
            endpoint="/auth/meus-dados"
        )
        
        if not resultado:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
            
        usuario = resultado[0]
        permissoes = await obter_permissoes_usuario(login)
        
        return {
            "id": usuario.get("id"),
            "login": usuario.get("login"),
            "nome": usuario.get("nome"),
            "email": usuario.get("email"),
            "cargo_id": usuario.get("cargo_id"),
            "permissions": permissoes
        }
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado ou inválido")
