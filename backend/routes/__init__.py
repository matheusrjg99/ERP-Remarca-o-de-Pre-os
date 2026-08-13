"""
Router Principal da Aplicação

Este módulo consolida todas as rotas da aplicação organizadas por camadas:
- Core: Funcionalidades essenciais (autenticação, segurança)
- Business: Regras de negócio (consultas, operações, administração)
- Modules: Módulos independentes (não conformidades, comissões, etc.)

A estrutura segue padrões profissionais de arquitetura de software.
"""
from fastapi import APIRouter

# ==========================================
# CORE - Funcionalidades Essenciais
# ==========================================
from .core.auth import router as auth_router
from .core.auth import router_compat as auth_compat_router
from .core.rbac import router as rbac_router

# ==========================================
# BUSINESS - Regras de Negócio
# ==========================================
# Administration: Gestão de usuários, configurações e administração geral
from .business.administration.users import router as users_router
from .business.administration.settings import router as settings_router
from .business.administration.management import router as management_router

# Pricing (Precificação): Módulo unificado de remarcação de preços
# Contém: Consultas, Operações e Produtos
from .business.pricing.queries import router as pricing_queries_router
from .business.pricing.operations import router as pricing_operations_router
from .business.pricing.products import router as pricing_products_router

# ==========================================
# MODULES - Módulos Independentes
# ==========================================
from .modules.collaborators import router as collaborators_router
from .modules.nonconformities import router as nonconformities_router
from .modules.disputes import router as disputes_router
from .modules.commissions import router as commissions_router

# ==========================================
# Router Consolidado
# ==========================================
router = APIRouter()

# Inclusão das rotas de compatibilidade (devem vir primeiro para capturar /login)
router.include_router(auth_compat_router)

# Inclusão das rotas do CORE
router.include_router(auth_router)
router.include_router(rbac_router)

# Inclusão das rotas de BUSINESS
router.include_router(users_router)
router.include_router(settings_router)
router.include_router(management_router)

# Módulo de Precificação (Consultas, Operações e Produtos)
router.include_router(pricing_queries_router)
router.include_router(pricing_operations_router)
router.include_router(pricing_products_router)

# Inclusão das rotas de MODULES
router.include_router(collaborators_router)
router.include_router(nonconformities_router)
router.include_router(disputes_router)
router.include_router(commissions_router)

__all__ = ["router"]
