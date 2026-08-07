"""
Rotas de Contestações
Gerencia mensagens e contestações de Não Conformidades
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List
from datetime import datetime
import sys
import os

# Adiciona o path do backend para importar database
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database import executar_query

router = APIRouter(prefix="/contestacoes", tags=["Contestações"])

# --- Schemas Pydantic ---

class NCContestacaoBase(BaseModel):
    mensagem: str
    usuario: str  # Quem escreveu (admin ou colaborador)

class NCContestacaoCreate(NCContestacaoBase):
    nao_conformidade_id: int

class NCContestacao(NCContestacaoBase):
    id: int
    nao_conformidade_id: int
    data_hora: datetime

# --- Rotas ---

@router.get("/{nc_id}", response_model=List[NCContestacao])
async def listar_contestacoes(nc_id: int):
    """Lista todas as mensagens de uma NC específica"""
    query = """
        SELECT id, nao_conformidade_id, mensagem, usuario, data_hora 
        FROM contestacoes_v2 
        WHERE nao_conformidade_id = ? 
        ORDER BY data_hora ASC
    """
    resultado = await executar_query(
        banco="Bddemo",
        query=query,
        params=(nc_id,),
        usuario="SISTEMA",
        endpoint="/contestacoes"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado if resultado else []

@router.post("", response_model=NCContestacao, status_code=status.HTTP_201_CREATED)
async def adicionar_contestacao(contestacao: NCContestacaoCreate):
    """Adiciona mensagem ao chat da NC"""
    query_insert = """
        INSERT INTO contestacoes_v2 (nao_conformidade_id, mensagem, usuario, data_hora) 
        VALUES (?, ?, ?, GETDATE())
    """
    params_insert = (contestacao.nao_conformidade_id, contestacao.mensagem, contestacao.usuario)
    
    sucesso = await executar_query(
        banco="Bddemo",
        query=query_insert,
        params=params_insert,
        usuario="SISTEMA",
        endpoint="/contestacoes",
        is_select=False
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao adicionar contestação")
    
    # Retorna a mensagem criada
    query_select = """
        SELECT id, nao_conformidade_id, mensagem, usuario, data_hora 
        FROM contestacoes_v2 
        WHERE nao_conformidade_id = ? 
        ORDER BY data_hora DESC
    """
    resultado = await executar_query(
        banco="Bddemo",
        query=query_select,
        params=(contestacao.nao_conformidade_id,),
        usuario="SISTEMA",
        endpoint="/contestacoes"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado[0] if resultado else {}
