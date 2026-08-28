"""
Rotas de Configurações do Usuário - Preferências.
Módulo Business/Administration: Responsável pelas configurações e preferências dos usuários.
Apenas definição de endpoints, injeção de dependências e retorno de respostas HTTP.
"""
from fastapi import APIRouter, Depends, HTTPException
from auth.seguranca import get_current_user
from .services import SettingsService
from .schemas import PreferenciasUpdate



router = APIRouter(prefix="/settings", tags=["Configurações"])


@router.get("/preferencias")
async def obter_preferencias(current_user: dict = Depends(get_current_user)):
    """
    Obtém as preferências salvas do usuário logado.
    Rota aberta (sem exigência de permissão específica).
    """
    usuario_logado = current_user.get('usuario_id')


    service = SettingsService(usuario_logado=usuario_logado)
    return await service.obter_preferencias()


@router.put("/preferencias")
async def salvar_preferencias(dados: PreferenciasUpdate, current_user: dict = Depends(get_current_user)):
    """
    Salva as preferências do usuário logado.
    Rota aberta (sem exigência de permissão específica).
    """

    usuario_logado = current_user.get('usuario_id')

    service = SettingsService(usuario_logado=usuario_logado)
    sucesso = await service.salvar_preferencias(preferencias=dados.preferencias)
    
    if not sucesso:
        raise HTTPException(status_code=500, detail="Erro ao salvar preferências.")
    
    return {"status": "sucesso"}
