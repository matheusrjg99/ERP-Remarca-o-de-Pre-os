"""
Módulo de rotas principais do sistema.
Organizado por responsabilidade para melhor manutenção.
"""

from fastapi import APIRouter

# Importação dos routers modulares
from .autenticacao import router as auth_router
from .usuarios import router as usuarios_router
from .consultas import router as consultas_router
from .operacoes import router as operacoes_router
from .configuracoes import router as configuracoes_router
from .administracao import router as administracao_router

# Router principal que agrega todos os módulos
router = APIRouter()

# Inclusão das rotas por responsabilidade
router.include_router(auth_router, prefix="", tags=["Autenticação"])
router.include_router(usuarios_router, prefix="/api/usuarios", tags=["Administração"])
router.include_router(consultas_router, prefix="/api", tags=["Consultas"])
router.include_router(operacoes_router, prefix="/api", tags=["Operações"])
router.include_router(configuracoes_router, prefix="/api/usuario", tags=["Configurações"])
router.include_router(administracao_router, prefix="/api", tags=["Administração"])
