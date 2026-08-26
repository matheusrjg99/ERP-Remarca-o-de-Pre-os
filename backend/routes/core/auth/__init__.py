"""
Módulo de Autenticação - Exportação dos Routers
Clean Architecture: Separação entre routes, services e schemas.
"""
from .routes import router, router_compat

__all__ = ["router", "router_compat"]
