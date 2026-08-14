"""
Modelos Pydantic para Gestão RBAC
Responsável por definir schemas de validação de dados
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ==================== MODELOS DE PERMISSÃO ====================

class PermissaoBase(BaseModel):
    """Schema base para permissões"""
    codigo: str = Field(..., min_length=3, max_length=100, description="Código único da permissão (ex: precificacao:visualizar)")
    descricao: str = Field(..., min_length=5, max_length=255, description="Descrição detalhada da permissão")
    modulo: str = Field(..., min_length=3, max_length=50, description="Módulo ao qual pertence a permissão")
    ativo: bool = Field(default=True, description="Status da permissão")


class PermissaoCreate(PermissaoBase):
    """Schema para criação de permissão"""
    pass


class PermissaoUpdate(BaseModel):
    """Schema para atualização parcial de permissão"""
    codigo: Optional[str] = Field(None, min_length=3, max_length=100)
    descricao: Optional[str] = Field(None, min_length=5, max_length=255)
    modulo: Optional[str] = Field(None, min_length=3, max_length=50)
    ativo: Optional[bool] = None


class PermissaoResponse(PermissaoBase):
    """Schema de resposta completa de permissão"""
    id: int
    criado_em: datetime
    
    class Config:
        from_attributes = True


# ==================== MODELOS DE CARGO ====================

class CargoBase(BaseModel):
    """Schema base para cargos"""
    nome: str = Field(..., min_length=3, max_length=100, description="Nome do cargo")
    descricao: Optional[str] = Field(None, max_length=255, description="Descrição do cargo")
    ativo: bool = Field(default=True, description="Status do cargo")


class CargoCreate(CargoBase):
    """Schema para criação de cargo"""
    pass


class CargoUpdate(BaseModel):
    """Schema para atualização parcial de cargo"""
    nome: Optional[str] = Field(None, min_length=3, max_length=100)
    descricao: Optional[str] = Field(None, max_length=255)
    ativo: Optional[bool] = None
    permissoes_ids: Optional[List[int]] = Field(None, description="Lista de IDs das permissões associadas")


class CargoResponse(CargoBase):
    """Schema de resposta completa de cargo"""
    id: int
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    permissoes: List[PermissaoResponse] = []
    
    class Config:
        from_attributes = True


# ==================== MODELOS DE USUÁRIO-CARGO ====================

class UsuarioCargoUpdate(BaseModel):
    """Schema para atribuição de cargo a usuário"""
    cargo_id: Optional[int] = Field(None, description="ID do cargo (null para remover)")


# ==================== MODELOS AUXILIARES ====================

class MensagemSucesso(BaseModel):
    """Schema genérico para mensagens de sucesso"""
    mensagem: str


class VerificacaoPermissao(BaseModel):
    """Schema para verificação de permissão de usuário"""
    usuario_id: int
    permissao: str
    autorizado: bool
