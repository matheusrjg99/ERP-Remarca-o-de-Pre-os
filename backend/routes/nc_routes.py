from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import sys
import os

# Adiciona o path do backend para importar database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import executar_query

router = APIRouter()

# --- Schemas Pydantic (V2 - Com IDs) ---

class ColaboradorBase(BaseModel):
    nome: str
    cargo: Optional[str] = None
    departamento: Optional[str] = None

class ColaboradorCreate(ColaboradorBase):
    pass

class Colaborador(ColaboradorBase):
    id: int

class NCContestacaoBase(BaseModel):
    mensagem: str
    usuario: str # Quem escreveu (admin ou colaborador)

class NCContestacaoCreate(NCContestacaoBase):
    nao_conformidade_id: int

class NCContestacao(NCContestacaoBase):
    id: int
    nao_conformidade_id: int
    data_hora: datetime

class NaoConformidadeBase(BaseModel):
    descricao: str
    data_ocorrencia: datetime
    status: str = 'Pendente' # Pendente, Contestado, Deferido, Indeferido, Resolvido
    observacoes: Optional[str] = None

class NaoConformidadeCreate(NaoConformidadeBase):
    colaborador_id: int  # AGORA É ID INTEIRO

class NaoConformidade(NaoConformidadeBase):
    id: int
    colaborador_id: int
    nome_colaborador: str # Campo calculado via JOIN

# --- Rotas ---

@router.get("/colaboradores", response_model=List[Colaborador])
async def listar_colaboradores():
    """Lista todos os colaboradores cadastrados"""
    query = "SELECT id, nome, cargo, departamento FROM colaboradores WHERE ativo = 1 OR ativo IS NULL"
    resultado = await executar_query(
        banco="Bddemo",
        query=query,
        params=(),
        usuario="SISTEMA",
        endpoint="/colaboradores"
    )
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    return resultado if resultado else []

@router.post("/colaboradores", response_model=Colaborador, status_code=status.HTTP_201_CREATED)
async def criar_colaborador(colab: ColaboradorCreate):
    """Adiciona novo colaborador"""
    query_insert = "INSERT INTO colaboradores (nome, cargo, departamento, ativo) VALUES (?, ?, ?, 1)"
    params_insert = (colab.nome, colab.cargo, colab.departamento)
    
    sucesso = await executar_query(
        banco="Bddemo",
        query=query_insert,
        params=params_insert,
        usuario="SISTEMA",
        endpoint="/colaboradores",
        is_select=False
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao criar colaborador")
    
    # Busca o ID recém-criado
    query_select = "SELECT TOP 1 id, nome, cargo, departamento FROM colaboradores WHERE nome = ? ORDER BY id DESC"
    resultado = await executar_query(
        banco="Bddemo",
        query=query_select,
        params=(colab.nome,),
        usuario="SISTEMA",
        endpoint="/colaboradores"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado[0] if resultado else {}

@router.get("/nao-conformidades", response_model=List[NaoConformidade])
async def listar_ncs(colaborador_id: Optional[int] = None, status: Optional[str] = None):
    """Lista NCs com dados do colaborador (JOIN)"""
    query = """
        SELECT 
            nc.id, nc.descricao, nc.data_ocorrencia, nc.status, nc.observacoes,
            nc.colaborador_id, c.nome as nome_colaborador
        FROM nao_conformidades_v2 nc
        INNER JOIN colaboradores c ON nc.colaborador_id = c.id
        WHERE 1=1
    """
    params = []

    if colaborador_id:
        query += " AND nc.colaborador_id = ?"
        params.append(colaborador_id)
    
    if status:
        query += " AND nc.status = ?"
        params.append(status)

    query += " ORDER BY nc.data_ocorrencia DESC"

    resultado = await executar_query(
        banco="Bddemo",
        query=query,
        params=tuple(params),
        usuario="SISTEMA",
        endpoint="/nao-conformidades"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    return resultado if resultado else []

@router.post("/nao-conformidades", response_model=NaoConformidade, status_code=status.HTTP_201_CREATED)
async def criar_nc(nc: NaoConformidadeCreate):
    """Cria nova Não Conformidade vinculada a um ID de colaborador"""
    # Valida se o colaborador existe
    query_valida = "SELECT id FROM colaboradores WHERE id = ?"
    valida = await executar_query(
        banco="Bddemo",
        query=query_valida,
        params=(nc.colaborador_id,),
        usuario="SISTEMA",
        endpoint="/nao-conformidades"
    )
    
    if not valida:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    
    query_insert = """
        INSERT INTO nao_conformidades_v2 
        (colaborador_id, descricao, data_ocorrencia, status, observacoes) 
        VALUES (?, ?, ?, ?, ?)
    """
    params_insert = (nc.colaborador_id, nc.descricao, nc.data_ocorrencia, nc.status, nc.observacoes)
    
    sucesso = await executar_query(
        banco="Bddemo",
        query=query_insert,
        params=params_insert,
        usuario="SISTEMA",
        endpoint="/nao-conformidades",
        is_select=False
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao criar NC")
    
    # Retorna completo com nome
    query_select = """
        SELECT nc.id, nc.descricao, nc.data_ocorrencia, nc.status, nc.observacoes,
               nc.colaborador_id, c.nome as nome_colaborador
        FROM nao_conformidades_v2 nc
        JOIN colaboradores c ON nc.colaborador_id = c.id
        WHERE nc.id = (SELECT TOP 1 id FROM nao_conformidades_v2 ORDER BY id DESC)
    """
    resultado = await executar_query(
        banco="Bddemo",
        query=query_select,
        params=(),
        usuario="SISTEMA",
        endpoint="/nao-conformidades"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado[0] if resultado else {}

@router.put("/nao-conformidades/{nc_id}", response_model=NaoConformidade)
async def atualizar_nc(nc_id: int, nc_update: NaoConformidadeBase):
    """Atualiza status ou observações de uma NC"""
    query_update = """
        UPDATE nao_conformidades_v2 
        SET status = ?, observacoes = ?
        WHERE id = ?
    """
    sucesso = await executar_query(
        banco="Bddemo",
        query=query_update,
        params=(nc_update.status, nc_update.observacoes, nc_id),
        usuario="SISTEMA",
        endpoint="/nao-conformidades",
        is_select=False
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao atualizar NC")
    
    # Retorna atualizado
    query_select = """
        SELECT nc.id, nc.descricao, nc.data_ocorrencia, nc.status, nc.observacoes,
               nc.colaborador_id, c.nome as nome_colaborador
        FROM nao_conformidades_v2 nc
        JOIN colaboradores c ON nc.colaborador_id = c.id
        WHERE nc.id = ?
    """
    resultado = await executar_query(
        banco="Bddemo",
        query=query_select,
        params=(nc_id,),
        usuario="SISTEMA",
        endpoint="/nao-conformidades"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    if not resultado:
        raise HTTPException(status_code=404, detail="NC não encontrada")
    
    return resultado[0]

@router.delete("/nao-conformidades/{nc_id}")
async def deletar_nc(nc_id: int):
    """Exclui uma NC (e suas contestações em cascade)"""
    query = "DELETE FROM nao_conformidades_v2 WHERE id = ?"
    sucesso = await executar_query(
        banco="Bddemo",
        query=query,
        params=(nc_id,),
        usuario="SISTEMA",
        endpoint="/nao-conformidades",
        is_select=False
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao excluir NC")
    
    return {"message": "NC excluída com sucesso"}

# --- Contestações ---

@router.get("/contestacoes/{nc_id}", response_model=List[NCContestacao])
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

@router.post("/contestacoes", response_model=NCContestacao, status_code=status.HTTP_201_CREATED)
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
