"""
Schemas Pydantic para módulo de Comissões
Define modelos de validação de entrada e saída
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ComissaoConfigBase(BaseModel):
    colaborador_id: int
    salario_base: float
    percentual_desconto: float


class ComissaoConfigCreate(ComissaoConfigBase):
    pass


class ComissaoConfig(ComissaoConfigBase):
    id: int
    nome_colaborador: str
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========================================================================
# RELATÓRIO DE COMISSÕES (com breakdown hierárquico)
# ========================================================================

class DetalheSubordinado(BaseModel):
    """Detalhe de um subordinado no relatório (com NCs e desconto)"""
    subordinado_id: int
    nome_subordinado: str
    percentual_relacao: float
    total_ncs: int
    valor_desconto: float

    class Config:
        from_attributes = True


class ComissaoRelatorioItem(BaseModel):
    """Linha do relatório de comissões — com breakdown hierárquico"""
    colaborador_id: int
    nome_colaborador: str
    salario_base: float
    percentual_desconto: float
    valor_por_nc: float

    # Breakdown (NOVO)
    total_ncs_proprias: int = 0
    valor_desconto_proprio: float = 0.0
    total_ncs_subordinados: int = 0
    valor_desconto_subordinados: float = 0.0
    detalhes_subordinados: List[DetalheSubordinado] = []

    # Consolidado (mantém)
    total_ncs: int
    valor_total_desconto: float
    salario_final: float

    class Config:
        from_attributes = True


# ========================================================================
# MINHA COMISSÃO (VISÃO DO COLABORADOR)
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

    # NOVOS
    total_ncs_proprias: int = 0
    valor_desconto_proprio: float = 0.0
    total_ncs_subordinados: int = 0
    valor_desconto_subordinados: float = 0.0
    detalhes_subordinados: List[DetalheSubordinado] = []

    # Consolidado (mantém)
    total_ncs: int = 0
    valor_total_desconto: float = 0.0
    salario_final: float = 0.0

    periodo: dict = {"mes": None, "ano": None}
    ncs: List[NCMinhaComissao] = []
    erro: Optional[str] = None

    class Config:
        from_attributes = True

# ========================================================================
# RELAÇÕES RESPONSÁVEL ↔ SUBORDINADO
# ========================================================================

class ColaboradorResponsavelBase(BaseModel):
    """Base para criação/edição de relação responsável ↔ subordinado"""
    responsavel_id: int
    subordinado_id: int
    percentual_desconto: float


class ColaboradorResponsavelCreate(ColaboradorResponsavelBase):
    """Payload de criação — todos os campos obrigatórios"""
    pass


class ColaboradorResponsavelUpdate(BaseModel):
    """Payload de edição — só permite alterar % e status ativo"""
    percentual_desconto: Optional[float] = None
    ativo: Optional[bool] = None


class ColaboradorResponsavel(BaseModel):
    """Resposta completa de uma relação (usado em GET)"""
    id: int
    responsavel_id: int
    nome_responsavel: str
    subordinado_id: int
    nome_subordinado: str
    percentual_desconto: float
    ativo: bool
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

    class Config:
        from_attributes = True