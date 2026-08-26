"""
Schemas para o módulo de Gestão de Usuários.
Define modelos Pydantic para validação de entrada e saída.
"""
from pydantic import BaseModel, Field
from typing import Optional


class UsuarioNovo(BaseModel):
    """Schema para criação de novo usuário."""
    login: str = Field(..., min_length=3, max_length=50, description="Login do usuário")
    senha: str = Field(..., min_length=6, description="Senha do usuário")
    nome: str = Field(..., max_length=100, description="Nome completo do usuário")
    cargo_id: int = Field(..., gt=0, description="ID do cargo do usuário")

    class Config:
        json_schema_extra = {
            "example": {
                "login": "joao.silva",
                "senha": "senha123",
                "nome": "João Silva",
                "cargo_id": 3
            }
        }


class UsuarioResponse(BaseModel):
    """Schema para resposta de dados de usuário."""
    login: str
    nome: str
    cargo_id: int
    cargo_nome: Optional[str] = None
    ativo: bool

    class Config:
        from_attributes = True


class StatusResponse(BaseModel):
    """Schema para resposta de operações de status."""
    status: str
    mensagem: Optional[str] = None
