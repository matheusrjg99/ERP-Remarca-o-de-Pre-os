"""
Modelos Pydantic para o módulo de Consultas de Precificação.
Define schemas para requisições e respostas da API.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class LoteRequisicao(BaseModel):
    """Schema para requisição em lote de códigos de produtos."""
    codigos: List[str] = Field(..., description="Lista de códigos dos produtos")


class ProdutoSearchRequest(BaseModel):
    """Schema para pesquisa avançada de produtos."""
    termo: Optional[str] = Field("", description="Termo de busca na descrição")
    codigo: Optional[str] = Field("", description="Código do produto")
    fornecedor: Optional[str] = Field("", description="Nome do fornecedor")
    classificacao: Optional[str] = Field("", description="Classificação do produto")
    disponibilidade: Optional[str] = Field("", description="Status de disponibilidade")


class NotaFiscalResponse(BaseModel):
    """Schema simplificado para resposta de nota fiscal."""
    numord: int
    numero: str
    # Outros campos serão retornados dinamicamente do banco


class ProdutoResponse(BaseModel):
    """Schema genérico para resposta de produto."""
    # Campos dinâmicos baseados na query SQL
    pass


class DivergenciaMarkupResponse(BaseModel):
    """Schema para resposta de divergência de markup."""
    # Campos dinâmicos baseados na query SQL
    pass


class ClassificacaoResponse(BaseModel):
    """Schema para resposta de classificação de produto."""
    codigo: str
    descr: str


class FornecedorResponse(BaseModel):
    """Schema para resposta de fornecedor."""
    OID: str
    NOME: str
