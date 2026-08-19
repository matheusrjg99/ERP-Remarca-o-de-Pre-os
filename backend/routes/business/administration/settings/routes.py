"""
Rotas de Configurações do Usuário - Preferências.
Módulo Business/Administration: Responsável pelas configurações e preferências dos usuários.
Apenas definição de endpoints, injeção de dependências e retorno de respostas HTTP.
"""
from fastapi import APIRouter, Depends, HTTPException
from auth.rbac.services import verificar_permissao_usuario
from .services import SettingsService
from .schemas import PreferenciasUpdate


router = APIRouter(prefix="/settings", tags=["Configurações"])


@router.get("/preferencias")
async def obter_preferencias(usuario_logado: str = Depends(verificar_permissao_usuario("usuario:leitura"))):
    """
    Obtém as preferências salvas do usuário logado.
    Requer permissão: usuario:leitura (herdada automaticamente por cargos superiores).
    """
    service = SettingsService(usuario_logado)
    return await service.obter_preferencias()


@router.put("/preferencias")
async def salvar_preferencias(
    dados: PreferenciasUpdate, 
    usuario_logado: str = Depends(verificar_permissao_usuario("usuario:escrita"))
):
    """
    Salva as preferências do usuário logado.
    Requer permissão: usuario:escrita (ou superior).
    """
    service = SettingsService(usuario_logado)
    sucesso = await service.salvar_preferencias(preferencias=dados.preferencias)
    
    if not sucesso:
        raise HTTPException(status_code=500, detail="Erro ao salvar preferências.")
    
    return {"status": "sucesso"}
