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

# ==========================================
# BUSINESS - Regras de Negócio
# ==========================================
# Administration: Gestão de usuários, configurações e administração geral
from .business.administration.users import router as users_router
from .business.administration.settings import router as settings_router
from .business.administration.management import router as management_router

# Queries: Consultas e leitura de dados
from .business.queries.general import router as queries_router

# Operations: Operações de escrita e atualização
from .business.operations.transactions import router as operations_router

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

# Inclusão das rotas de BUSINESS
router.include_router(users_router)
router.include_router(settings_router)
router.include_router(management_router)
router.include_router(queries_router)
router.include_router(operations_router)

# Inclusão das rotas de MODULES
router.include_router(collaborators_router)
router.include_router(nonconformities_router)
router.include_router(disputes_router)
router.include_router(commissions_router)

__all__ = ["router"]
