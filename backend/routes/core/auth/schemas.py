"""
Schemas para Autenticação - Modelos Pydantic
Módulo Core: Responsável pela validação de dados de entrada e saída.
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Union, Any


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
    cargo: Optional[Union[str, int]] = None
    
    @field_validator('cargo', mode='before')
    @classmethod
    def validate_cargo(cls, v: Any) -> Optional[str]:
        """Converte cargo para string se for inteiro"""
        if v is None:
            return None
        return str(v)


class UsuarioInfo(BaseModel):
    """Schema para informações do usuário autenticado."""
    id: Optional[int] = None
    login: str
    nome: Optional[str] = None
    cargo_id: Optional[Union[str, int]] = None
    permissions: List[str]
    
    @field_validator('cargo_id', mode='before')
    @classmethod
    def validate_cargo_id(cls, v: Any) -> Optional[int]:
        """Converte cargo_id para int se for string numérica"""
        if v is None:
            return None
        if isinstance(v, str) and v.isdigit():
            return int(v)
        return v if isinstance(v, int) else None


class UsuarioSistema(BaseModel):
    """Schema para lista de usuários do sistema."""
    id: int
    username: str
    nome: Optional[str] = None
    cargo_id: Optional[Union[str, int]] = None
    cargo_nome: Optional[str] = None
    
    @field_validator('cargo_id', mode='before')
    @classmethod
    def validate_cargo_id(cls, v: Any) -> Optional[int]:
        """Converte cargo_id para int se for string numérica"""
        if v is None:
            return None
        if isinstance(v, str) and v.isdigit():
            return int(v)
        return v if isinstance(v, int) else None