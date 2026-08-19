"""
Schemas Pydantic para módulo de Colaboradores
Define modelos de validação de entrada e saída
"""
from pydantic import BaseModel
from typing import List, Optional


class ColaboradorBase(BaseModel):
    nome: str
    cargo: Optional[str] = None
    departamento: Optional[str] = None
    usuario_id: Optional[int] = None  # Vínculo com usuário do sistema


class ColaboradorCreate(ColaboradorBase):
    pass


class ColaboradorUpdate(BaseModel):
    nome: Optional[str] = None
    cargo: Optional[str] = None
    departamento: Optional[str] = None
    usuario_id: Optional[int] = None


class Colaborador(ColaboradorBase):
    id: int
    ativo: bool = True

    class Config:
        from_attributes = True
