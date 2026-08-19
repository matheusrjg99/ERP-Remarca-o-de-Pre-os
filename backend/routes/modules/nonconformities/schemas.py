"""
Schemas Pydantic para módulo de Não Conformidades
Define modelos de validação de entrada e saída
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NaoConformidadeBase(BaseModel):
    descricao: str
    data_ocorrencia: datetime
    status: str = 'Pendente'  # Pendente, Contestado, Deferido, Indeferido, Resolvido


class NaoConformidadeCreate(NaoConformidadeBase):
    colaborador_id: int


class NaoConformidadeUpdate(BaseModel):
    descricao: Optional[str] = None
    data_ocorrencia: Optional[datetime] = None
    status: Optional[str] = None
    colaborador_id: Optional[int] = None


class NaoConformidade(NaoConformidadeBase):
    id: int
    colaborador_id: int
    nome_colaborador: str
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

    class Config:
        from_attributes = True
