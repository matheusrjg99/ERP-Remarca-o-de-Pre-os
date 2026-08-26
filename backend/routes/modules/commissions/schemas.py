"""
Schemas Pydantic para módulo de Comissões
Define modelos de validação de entrada e saída
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ComissaoConfigBase(BaseModel):
    colaborador_id: int
    salario_base: float  # Salário base para cálculo da comissão
    percentual_desconto: float  # Percentual de desconto por NC (ex: 4.0 para 4%)


class ComissaoConfigCreate(ComissaoConfigBase):
    pass


class ComissaoConfig(ComissaoConfigBase):
    id: int
    nome_colaborador: str
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

    class Config:
        from_attributes = True


class ComissaoRelatorioItem(BaseModel):
    colaborador_id: int
    nome_colaborador: str
    salario_base: float
    percentual_desconto: float
    valor_por_nc: float  # Salário base * (percentual_desconto / 100)
    total_ncs: int
    valor_total_desconto: float  # valor_por_nc * total_ncs
    salario_final: float  # salario_base - valor_total_desconto

    class Config:
        from_attributes = True
