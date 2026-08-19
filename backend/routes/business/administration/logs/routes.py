"""
Rotas de Logs do Sistema.
Módulo Business/Administration: Responsável pela consulta de logs administrativos.
Apenas definição de endpoints, injeção de dependências e retorno de respostas HTTP.
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from auth.rbac.services import verificar_permissao_usuario
from .services import LogService
from .schemas import LogFiltro, LogResponse


router = APIRouter(prefix="/admin", tags=["Administração Geral"])


@router.get("/logs", response_model=List[LogResponse])
async def consultar_logs(
    data_inicio: Optional[str] = Query(None, description="Data inicial (YYYY-MM-DD)"),
    data_fim: Optional[str] = Query(None, description="Data final (YYYY-MM-DD)"),
    usuario_filtro: Optional[str] = Query(None, description="Nome ou login do usuário"),
    operacao: Optional[str] = Query(None, description="Tipo de operação"),
    termo: Optional[str] = Query(None, description="Termo para busca nos detalhes"),
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"], description="Ambiente"),
    usuario_logado: str = Depends(verificar_permissao_usuario("admin:logs"))
):
    """
    Consulta logs do sistema com filtros.
    Requer permissão: admin:logs (ou admin_total).
    Retorna até 500 registros ordenados por ID decrescente.
    """
    service = LogService(usuario_logado)
    return await service.consultar_logs(
        data_inicio=data_inicio,
        data_fim=data_fim,
        usuario_filtro=usuario_filtro,
        operacao=operacao,
        termo=termo,
        ambiente=ambiente
    )
