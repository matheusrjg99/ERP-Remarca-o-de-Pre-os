"""
Rotas de Contestações
Apenas definição de endpoints, injeção de dependências e retorno de respostas HTTP
Regra de negócio delegada para services.py
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List

from auth.seguranca import requer_permissao
from .schemas import NCContestacao, NCContestacaoCreate
from .services import ContestacaoService


router = APIRouter(prefix="/contestacoes", tags=["Contestações"])


@router.get("/{nc_id}", response_model=List[NCContestacao], dependencies=[Depends(requer_permissao("nc:visualizar"))])
async def listar_contestacoes(nc_id: int):
    """Lista todas as mensagens de uma NC específica"""
    resultado = await ContestacaoService.listar_por_nc(nao_conformidade_id=nc_id)
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado if resultado else []


@router.post("", response_model=NCContestacao, status_code=status.HTTP_201_CREATED, 
             dependencies=[Depends(requer_permissao("nc:contestar"))])
async def adicionar_contestacao(contestacao: NCContestacaoCreate):
    """Adiciona mensagem ao chat da NC"""
    sucesso = await ContestacaoService.criar(
        nao_conformidade_id=contestacao.nao_conformidade_id,
        mensagem=contestacao.mensagem,
        usuario=contestacao.usuario
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao adicionar contestação")
    
    # Retorna a mensagem criada
    resultado = await ContestacaoService.buscar_ultima_mensagem(
        nao_conformidade_id=contestacao.nao_conformidade_id
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado[0] if resultado else {}
