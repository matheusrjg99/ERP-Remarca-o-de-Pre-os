"""Schemas para o módulo de Precificação de Produtos."""

from pydantic import BaseModel, Field
from typing import Optional, List


class ProdutoPrecificacao(BaseModel):
    """Modelo de saída para listagem de produtos com dados de precificação."""
    codpro: str
    descricao: str
    custo: float
    preco_venda: float
    markup: float
    margem: Optional[float] = None
    classificacao: Optional[str] = None
    fornecedor: Optional[str] = None

    class Config:
        from_attributes = True


class ProdutoAvancado(BaseModel):
    """Schema para pesquisa avançada de produtos."""
    codpro: str = Field(..., alias="CODPRO", description="Código do produto")
    descricaolong: str = Field(..., alias="DESCRICAOLONGA", description="Descrição longa")
    razsoc: Optional[str] = Field(None, alias="RAZSOC", description="Razão social do fornecedor")
    classificacao: Optional[str] = Field(None, alias="CLASSIFICACAO", description="Classificação")
    status_disp: Optional[str] = Field(None, alias="STATUS_DISP", description="Status de disponibilidade")

    class Config:
        populate_by_name = True


class FiltroProdutoRequest(BaseModel):
    """Schema para body da pesquisa avançada (opcional, usado se enviar JSON)."""
    termo: Optional[str] = ""
    codigo: Optional[str] = ""
    fornecedor: Optional[str] = ""
    classificacao: Optional[str] = ""
    disponibilidade: Optional[str] = ""
