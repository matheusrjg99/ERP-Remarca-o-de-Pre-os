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
async def obter_preferencias(current_user: dict = Depends(requer_permissao("usuario:leitura"))):
    """
    Obtém as preferências salvas do usuário logado.
    Requer permissão: usuario:leitura (herdada automaticamente por cargos superiores).
    """
    service = SettingsService(current_user)
    return await service.obter_preferencias()


@router.put("/preferencias")
async def salvar_preferencias(
    dados: PreferenciasUpdate, 
    current_user: dict = Depends(requer_permissao("usuario:escrita"))
):
    """
    Salva as preferências do usuário logado.
    Requer permissão: usuario:escrita (ou superior).
    """
    service = SettingsService(current_user)
    sucesso = await service.salvar_preferencias(preferencias=dados.preferencias)
    
    if not sucesso:
        raise HTTPException(status_code=500, detail="Erro ao salvar preferências.")
    
    return {"status": "sucesso"}
