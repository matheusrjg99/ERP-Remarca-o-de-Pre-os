"""
Schemas para o módulo de Configurações do Usuário.
Define modelos Pydantic para validação de entrada e saída.
"""
from pydantic import BaseModel, Field
from typing import Dict, Any


class PreferenciasUpdate(BaseModel):
    """Schema para atualização de preferências do usuário."""
    preferencias: Dict[str, Any] = Field(..., description="Dicionário de preferências do usuário")

    class Config:
        json_schema_extra = {
            "example": {
                "preferencias": {
                    "tema": "escuro",
                    "idioma": "pt-BR",
                    "notificacoes_email": True
                }
            }
        }


class PreferenciasResponse(BaseModel):
    """Schema para resposta de preferências."""
    tema: str = "claro"
    idioma: str = "pt-BR"
    notificacoes_email: bool = True
    
    class Config:
        extra = "allow"  # Permite campos dinâmicos
