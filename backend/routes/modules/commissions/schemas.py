"""
Schemas Pydantic para módulo de Comissões
Define modelos de validação de entrada e saída
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ComissaoConfigBase(BaseModel):
    colaborador_id: int
    salario_base: float  # Salário base para cálculo da comissão
    percentual_desconto: float  # Percentual de desconto por NC (ex: 4.0 para 4.0%)


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


# ========================================================================
# NOVOS SCHEMAS - MINHA COMISSÃO (VISÃO DO COLABORADOR)
# ========================================================================

class NCMinhaComissao(BaseModel):
    """NC individual na visão da minha comissão"""
    id: int
    descricao: str
    data_ocorrencia: datetime
    status: str

    class Config:
        from_attributes = True


class MinhaComissaoResponse(BaseModel):
    """Resposta da rota de minha comissão"""
    colaborador_id: Optional[int] = None
    nome_colaborador: Optional[str] = None
    salario_base: float = 0.0
    percentual_desconto: float = 0.0
    valor_por_nc: float = 0.0
    total_ncs: int = 0
    valor_total_desconto: float = 0.0
    salario_final: float = 0.0
    periodo: dict = {"mes": None, "ano": None}
    ncs: List[NCMinhaComissao] = []
    erro: Optional[str] = None

    class Config:
        from_attributes = True