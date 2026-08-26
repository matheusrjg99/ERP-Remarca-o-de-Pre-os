"""
Pacote de módulos do sistema
Exporta os routers dos módulos refatorados em Clean Architecture
"""
from .collaborators import router as colaboradores_router
from .nonconformities import router as nao_conformidades_router
from .disputes import router as contestacoes_router
from .commissions import router as comissoes_router

__all__ = [
    "colaboradores_router",
    "nao_conformidades_router",
    "contestacoes_router",
    "comissoes_router"
]
