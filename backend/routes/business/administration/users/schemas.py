"""
Schemas para o módulo de Gestão de Usuários.
Define modelos Pydantic para validação de entrada e saída.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


# ==================== CRIAÇÃO ====================

class UsuarioNovo(BaseModel):
    """Schema para criação de novo usuário."""
    login: str = Field(..., min_length=3, max_length=50, description="Login do usuário")
    senha: str = Field(..., min_length=6, description="Senha do usuário")
    nome: str = Field(..., max_length=100, description="Nome completo do usuário")
    cargo_id: int = Field(..., gt=0, description="ID do cargo do usuário")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "login": "joao.silva",
                "senha": "senha123",
                "nome": "João Silva",
                "cargo_id": 3
            }
        }
    )


# ==================== RESPOSTAS ====================

class UsuarioResponse(BaseModel):
    """Schema para resposta de dados de usuário (listagem)."""
    login: str
    nome: str
    cargo_id: int
    cargo_nome: Optional[str] = None
    ativo: bool

    model_config = ConfigDict(from_attributes=True)


class UsuarioDetalheResponse(BaseModel):
    """
    Schema de resposta detalhada de um usuário específico.
    Mesma estrutura do UsuarioResponse — mantido separado para
    futura expansão (ex: incluir email, timestamps, etc).
    """
    login: str
    nome: str
    cargo_id: Optional[int] = None
    cargo_nome: Optional[str] = None
    ativo: bool

    model_config = ConfigDict(from_attributes=True)


# ==================== ATUALIZAÇÃO ====================

class UsuarioUpdate(BaseModel):
    """
    Schema para atualização PARCIAL de usuário.

    Regra: apenas os campos enviados são atualizados.
    Campos não enviados permanecem inalterados.

    - nome: opcional (corrige nome)
    - senha: opcional (reset de senha — será hasheada no backend)
    - cargo_id: opcional (troca de cargo)

    Login NÃO é editável (é a chave primária natural).
    """
    nome: Optional[str] = Field(
        None,
        min_length=3,
        max_length=100,
        description="Novo nome completo do usuário"
    )
    senha: Optional[str] = Field(
        None,
        min_length=6,
        max_length=100,
        description="Nova senha (será hasheada no backend)"
    )
    cargo_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID do novo cargo"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nome": "João Silva Santos"
            }
        }
    )


# ==================== RESPOSTAS AUXILIARES ====================

class StatusResponse(BaseModel):
    """Schema para resposta de operações de status."""
    status: str
    mensagem: Optional[str] = None