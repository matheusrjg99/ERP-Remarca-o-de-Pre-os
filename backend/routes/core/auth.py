"""
Rotas de Autenticação - Login e Token JWT
Módulo Core: Responsável pela segurança e autenticação do sistema.

NOTA: Este arquivo foi convertido em um wrapper para manter compatibilidade.
A lógica real foi movida para o pacote auth/ (Clean Architecture).
"""
# Importação dos routers da nova estrutura para manter compatibilidade
from .auth.routes import router, router_compat

# Reexportar para manter imports antigos funcionando
__all__ = ["router", "router_compat"]
