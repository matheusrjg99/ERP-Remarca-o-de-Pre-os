"""
Router principal de Não Conformidades
Importa e consolida todos os sub-routers
"""
from fastapi import APIRouter

# Importa os sub-routers
from .colaboradores import router as colaboradores_router
from .nao_conformidades import router as nc_router
from .contestacoes import router as contestacoes_router
from .comissoes import router as comissoes_router

# Cria o router principal
router = APIRouter()

# Inclui todas as rotas dos módulos
router.include_router(colaboradores_router, tags=["Colaboradores"])
router.include_router(nc_router, tags=["Não Conformidades"])
router.include_router(contestacoes_router, tags=["Contestações"])
router.include_router(comissoes_router, tags=["Comissões"])
