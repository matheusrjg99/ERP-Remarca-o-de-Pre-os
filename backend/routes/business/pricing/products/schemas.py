"""Schemas para o módulo de Precificação de Produtos."""

from pydantic import BaseModel
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
