"""
Módulo de Gestão RBAC (Role-Based Access Control)
Rotas para administração de cargos e permissões

NOTA: Este arquivo foi descontinuado. O código foi modularizado em:
- routes.py: Definição dos endpoints
- services.py: Lógica de negócios e consultas ao banco
- schemas.py: Modelos Pydantic para validação

Use: from backend.routes.core.rbac import router
"""

# Importa o router do módulo modularizado para manter compatibilidade
from .rbac.routes import router

__all__ = ["router"]
