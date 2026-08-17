"""Schemas para o módulo de Precificação de Produtos."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ProdutoBase(BaseModel):
    """Campos base comuns para produtos."""
    produto_id: Optional[int] = None
    descricao: Optional[str] = None
    grupo: Optional[str] = None
    subgrupo: Optional[str] = None
    marca: Optional[str] = None
    fornecedor_id: Optional[int] = None
    custo_atual: Optional[float] = None
    margem_atual: Optional[float] = None
    preco_venda: Optional[float] = None
    ativo: Optional[bool] = None


class ProdutoPrecificacao(ProdutoBase):
    """Modelo de saída para listagem/detalhes de precificação."""
    ultima_atualizacao: Optional[datetime] = None
    usuario_alteracao: Optional[str] = None

    class Config:
        from_attributes = True


class RecalculoRequest(BaseModel):
    """Modelo de entrada para solicitação de recálculo."""
    produto_ids: Optional[List[int]] = Field(default=None, description="Lista de IDs de produtos para recálculo. Se vazio, recalcula todos.")
    novo_custo: Optional[float] = Field(default=None, description="Novo custo para aplicar (opcional).")
    nova_margem: Optional[float] = Field(default=None, description="Nova margem para aplicar (opcional).")
    justifica: str = Field(..., min_length=5, description="Justificativa obrigatória para o recálculo.")


class ExportacaoRequest(BaseModel):
    """Modelo de entrada para solicitação de exportação."""
    formato: str = Field(default="CSV", description="Formato de exportação (CSV, XLSX).")
    filtros: Optional[dict] = Field(default=None, description="Filtros adicionais para a exportação.")
