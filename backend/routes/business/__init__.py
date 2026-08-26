"""
Pacote Business - Regras de negócio da aplicação.
Exporta os routers dos módulos de Pricing e Administration.
"""
from .pricing.operations import router as operations_router
from .pricing.products import router as products_router
from .pricing.queries import router as queries_router
from .administration.users import router as users_router
from .administration.logs import router as logs_router
from .administration.settings import router as settings_router

__all__ = [
    "operations_router",
    "products_router",
    "queries_router",
    "users_router",
    "logs_router",
    "settings_router"
]