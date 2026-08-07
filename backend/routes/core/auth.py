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
from auth.seguranca import verificar_senha, criar_token_acesso, SECRET_KEY, ALGORITHM

# Router principal com prefixo /auth (novo padrão)
router = APIRouter(prefix="/auth", tags=["Autenticação"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/login", response_model=Token)
async def login(dados: LoginData):
    """
    Realiza o login do usuário e retorna token JWT.
    Endpoint: /auth/login
    """
    query = "SELECT login, senha_hash, nivel_acesso FROM API_USUARIOS WHERE login = ? AND ativo = 1"
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
    
    token_jwt = criar_token_acesso(dados={"sub": usuario_db["login"], "nivel": usuario_db["nivel_acesso"]})
    
    return {
        "access_token": token_jwt,
        "token_type": "bearer",
        "nivel_acesso": usuario_db["nivel_acesso"],
        "usuario": usuario_db["login"]
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
