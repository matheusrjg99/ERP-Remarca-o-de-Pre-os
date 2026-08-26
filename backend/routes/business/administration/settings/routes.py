"""
Rotas de Configurações do Usuário - Preferências.
Módulo Business/Administration: Responsável pelas configurações e preferências dos usuários.
Apenas definição de endpoints, injeção de dependências e retorno de respostas HTTP.
"""
from fastapi import APIRouter, Depends, HTTPException
from auth.seguranca import requer_permissao
from .services import SettingsService
from .schemas import PreferenciasUpdate


router = APIRouter(prefix="/settings", tags=["Configurações"])


@router.get("/preferencias")
async def obter_preferencias():
    """
    Obtém as preferências salvas do usuário logado.
    Rota aberta (sem exigência de permissão específica).
    """
    # Nota: A identificação do usuário deve ser tratada no service se necessário,
    # mas esta rota não exige decorador de permissão conforme solicitado.
    service = SettingsService(None)
    return await service.obter_preferencias()


@router.put("/preferencias")
async def salvar_preferencias(dados: PreferenciasUpdate):
    """
    Salva as preferências do usuário logado.
    Rota aberta (sem exigência de permissão específica).
    """
    service = SettingsService(None)
    sucesso = await service.salvar_preferencias(preferencias=dados.preferencias)
    
    if not sucesso:
        raise HTTPException(status_code=500, detail="Erro ao salvar preferências.")
    
    return {"status": "sucesso"}
