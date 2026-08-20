"""
Schemas para Autenticação - Modelos Pydantic
Módulo Core: Responsável pela validação de dados de entrada e saída.
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class LoginData(BaseModel):
    """Schema para dados de login."""
    login: str = Field(..., description="Login do usuário")
    senha: str = Field(..., description="Senha do usuário")


class Token(BaseModel):
    """Schema para resposta de token JWT."""
    access_token: str
    token_type: str
    usuario: str
    nome: str
    permissoes: List[str]


class TokenData(BaseModel):
    """Schema para dados internos do token."""
    sub: str
    permissoes: List[str]
    nome: Optional[str] = None
    cargo: Optional[str] = None


class UsuarioInfo(BaseModel):
    """Schema para informações do usuário autenticado."""
    id: Optional[int] = None
    login: str
    nome: Optional[str] = None
    cargo_id: Optional[int] = None
    permissions: List[str]


class UsuarioSistema(BaseModel):
    """Schema para lista de usuários do sistema."""
    id: int
    username: str
    nome: Optional[str] = None
    cargo_id: Optional[int] = None
    cargo_nome: Optional[str] = None
