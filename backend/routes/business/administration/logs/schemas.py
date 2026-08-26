"""
Schemas para o módulo de Logs do Sistema.
Define modelos Pydantic para validação de entrada e saída.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class LogFiltro(BaseModel):
    """Schema para filtros de consulta de logs."""
    data_inicio: Optional[str] = Field(None, description="Data inicial (YYYY-MM-DD)")
    data_fim: Optional[str] = Field(None, description="Data final (YYYY-MM-DD)")
    usuario_filtro: Optional[str] = Field(None, description="Nome ou login do usuário")
    operacao: Optional[str] = Field(None, description="Tipo de operação")
    termo: Optional[str] = Field(None, description="Termo para busca nos detalhes")
    ambiente: str = Field("treina", description="Ambiente: producao, demo ou treina")

    class Config:
        json_schema_extra = {
            "example": {
                "data_inicio": "2024-01-01",
                "data_fim": "2024-01-31",
                "usuario_filtro": "joao",
                "operacao": "INSERT",
                "termo": "",
                "ambiente": "treina"
            }
        }


class LogResponse(BaseModel):
    """Schema para resposta de um registro de log."""
    id: int
    data_hora: str
    usuario_login: str
    operacao: str
    banco_destino: str
    endpoint: str
    detalhes: Optional[str] = None

    class Config:
        from_attributes = True
