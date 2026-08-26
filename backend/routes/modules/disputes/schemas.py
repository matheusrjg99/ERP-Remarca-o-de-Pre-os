"""
Schemas Pydantic para módulo de Contestações
Define modelos de validação de entrada e saída
"""
from pydantic import BaseModel
from datetime import datetime


class NCContestacaoBase(BaseModel):
    mensagem: str
    usuario: str  # Quem escreveu (admin ou colaborador)


class NCContestacaoCreate(NCContestacaoBase):
    nao_conformidade_id: int


class NCContestacao(NCContestacaoBase):
    id: int
    nao_conformidade_id: int
    data_hora: datetime

    class Config:
        from_attributes = True
