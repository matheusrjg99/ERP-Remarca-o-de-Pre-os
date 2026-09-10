"""
Modelos Pydantic para Gestão RBAC
Responsável por definir schemas de validação de dados

IMPORTANTE: Permissões são READ-ONLY via API.
Schemas de criação/atualização de permissão foram removidos.
Para adicionar permissões, usar SQL/migration/seed.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime


# ==================== MODELOS DE PERMISSÃO (READ-ONLY) ====================

class PermissaoResponse(BaseModel):
    """Schema de resposta completa de permissão"""
    id: int
    codigo: str = Field(..., description="Código único da permissão (ex: nc:criar)")
    descricao: str = Field(..., description="Descrição detalhada da permissão")
    modulo: str = Field(..., description="Módulo ao qual pertence a permissão")
    ativo: bool = Field(..., description="Status da permissão")
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)


class PermissaoAgrupadaResponse(BaseModel):
    """Schema para permissões agrupadas por módulo"""
    modulo: str
    permissoes: List[PermissaoResponse]


# ==================== MODELOS DE CARGO ====================

class CargoBase(BaseModel):
    """Schema base para cargos"""
    nome: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="Nome único do cargo"
    )
    descricao: Optional[str] = Field(
        None,
        max_length=255,
        description="Descrição do cargo"
    )
    ativo: bool = Field(
        default=True,
        description="Status do cargo"
    )


class CargoCreate(CargoBase):
    """
    Schema para criação de cargo.
    Permite já criar o cargo com permissões iniciais.
    """
    permissoes_ids: Optional[List[int]] = Field(
        None,
        description="Lista opcional de IDs de permissões a atribuir ao criar"
    )


class CargoUpdate(BaseModel):
    """
    Schema para atualização parcial de cargo.

    IMPORTANTE sobre `permissoes_ids`:
    - Se NÃO enviado (None): permissões permanecem inalteradas
    - Se enviado (mesmo lista vazia []): substitui TODAS as permissões
    """
    nome: Optional[str] = Field(
        None,
        min_length=3,
        max_length=100,
        description="Novo nome do cargo"
    )
    descricao: Optional[str] = Field(
        None,
        max_length=255,
        description="Nova descrição do cargo"
    )
    ativo: Optional[bool] = Field(
        None,
        description="Novo status do cargo"
    )
    permissoes_ids: Optional[List[int]] = Field(
        None,
        description="Lista de IDs de permissões (substitui todas). Envie [] para remover todas."
    )


class CargoResponse(CargoBase):
    """Schema de resposta completa de cargo com permissões"""
    id: int
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    permissoes: List[PermissaoResponse] = Field(
        default_factory=list,
        description="Lista de permissões associadas ao cargo"
    )

    model_config = ConfigDict(from_attributes=True)


class CargoSimplesResponse(BaseModel):
    """
    Schema leve de cargo (sem permissões).
    Usado em dropdowns/selects no frontend.
    """
    id: int
    nome: str
    descricao: Optional[str] = None
    ativo: bool

    model_config = ConfigDict(from_attributes=True)


class CargoComContagemResponse(CargoResponse):
    """Schema de cargo incluindo contagem de usuários (opcional)"""
    total_usuarios: Optional[int] = Field(
        None,
        description="Total de usuários ativos com este cargo"
    )


# ==================== MODELOS DE ATRIBUIÇÃO DE PERMISSÕES ====================

class AtribuirPermissoesCargo(BaseModel):
    """
    Schema para substituir apenas as permissões de um cargo.
    Não altera nome, descrição ou status.
    """
    permissoes_ids: List[int] = Field(
        ...,
        description="Lista de IDs de permissões. Envie [] para remover todas."
    )


# ==================== MODELOS DE USUÁRIO-CARGO ====================

class UsuarioCargoUpdate(BaseModel):
    """
    Schema para atribuição/remoção de cargo de um usuário.
    Envie `cargo_id: null` para remover o cargo do usuário.
    """
    cargo_id: Optional[int] = Field(
        None,
        description="ID do cargo (null para remover o cargo do usuário)"
    )


class UsuarioResponse(BaseModel):
    """Schema de resposta de usuário (simplificado)"""
    id: int
    login: str
    nome: str
    email: Optional[str] = None
    ativo: bool
    cargo_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== MODELOS AUXILIARES ====================

class MensagemSucesso(BaseModel):
    """Schema genérico para mensagens de sucesso"""
    mensagem: str


class VerificacaoPermissao(BaseModel):
    """Schema para verificação de permissão de usuário"""
    usuario_id: int
    permissao: str = Field(..., description="Código da permissão verificada")
    autorizado: bool = Field(..., description="True se o usuário possui a permissão")