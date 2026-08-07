"""
Rotas de Não Conformidades (NCs)
Gerencia CRUD de registros de não conformidade
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import sys
import os

# Adiciona o path do backend para importar database
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database import executar_query

router = APIRouter(prefix="/nao-conformidades", tags=["Não Conformidades"])

# --- Schemas Pydantic ---

class NaoConformidadeBase(BaseModel):
    descricao: str
    data_ocorrencia: datetime
    status: str = 'Pendente'  # Pendente, Contestado, Deferido, Indeferido, Resolvido

class NaoConformidadeCreate(NaoConformidadeBase):
    colaborador_id: int

class NaoConformidadeUpdate(BaseModel):
    descricao: Optional[str] = None
    data_ocorrencia: Optional[datetime] = None
    status: Optional[str] = None
    colaborador_id: Optional[int] = None

class NaoConformidade(NaoConformidadeBase):
    id: int
    colaborador_id: int
    nome_colaborador: str
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

# --- Rotas ---

@router.get("", response_model=List[NaoConformidade])
async def listar_ncs(colaborador_id: Optional[int] = None, status: Optional[str] = None, mes: Optional[int] = None, ano: Optional[int] = None):
    """Lista NCs com dados do colaborador (JOIN)"""
    query = """
        SELECT 
            nc.id, nc.descricao, nc.data_ocorrencia, nc.status,
            nc.colaborador_id, c.nome as nome_colaborador,
            nc.criado_em, nc.atualizado_em
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
    
    # Filtro por mês e ano
    if mes and ano:
        query += " AND MONTH(nc.data_ocorrencia) = ? AND YEAR(nc.data_ocorrencia) = ?"
        params.extend([mes, ano])
    elif mes:
        query += " AND MONTH(nc.data_ocorrencia) = ?"
        params.append(mes)
    elif ano:
        query += " AND YEAR(nc.data_ocorrencia) = ?"
        params.append(ano)

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

@router.post("", response_model=NaoConformidade, status_code=status.HTTP_201_CREATED)
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
        (colaborador_id, descricao, data_ocorrencia, status) 
        VALUES (?, ?, ?, ?)
    """
    params_insert = (nc.colaborador_id, nc.descricao, nc.data_ocorrencia, nc.status)
    
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
        SELECT nc.id, nc.descricao, nc.data_ocorrencia, nc.status,
               nc.colaborador_id, c.nome as nome_colaborador,
               nc.criado_em, nc.atualizado_em
        FROM nao_conformidades_v2 nc
        JOIN colaboradores c ON nc.colaborador_id = c.id
        WHERE nc.id = (SELECT TOP 1 id FROM nao_conformidades_v2 ORDER BY ID DESC)
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

@router.put("/{nc_id}", response_model=NaoConformidade)
async def atualizar_nc(nc_id: int, nc_update: NaoConformidadeUpdate):
    """Atualiza campos de uma NC (apenas os fornecidos)"""
    updates = []
    params = []
    
    if nc_update.descricao is not None:
        updates.append("descricao = ?")
        params.append(nc_update.descricao)
    
    if nc_update.data_ocorrencia is not None:
        updates.append("data_ocorrencia = ?")
        params.append(nc_update.data_ocorrencia)
    
    if nc_update.status is not None:
        updates.append("status = ?")
        params.append(nc_update.status)
    
    if nc_update.colaborador_id is not None:
        updates.append("colaborador_id = ?")
        params.append(nc_update.colaborador_id)
    
    if not updates:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    updates.append("atualizado_em = GETDATE()")
    params.append(nc_id)
    
    query_update = f"""
        UPDATE nao_conformidades_v2 
        SET {', '.join(updates)}
        WHERE id = ?
    """
    
    sucesso = await executar_query(
        banco="Bddemo",
        query=query_update,
        params=tuple(params),
        usuario="SISTEMA",
        endpoint="/nao-conformidades",
        is_select=False
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao atualizar NC")
    
    # Retorna atualizado
    query_select = """
        SELECT nc.id, nc.descricao, nc.data_ocorrencia, nc.status,
               nc.colaborador_id, c.nome as nome_colaborador,
               nc.criado_em, nc.atualizado_em
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

@router.post("/{nc_id}/deferir", response_model=NaoConformidade)
async def deferir_nc(nc_id: int):
    """Marca NC como Deferida"""
    return await _atualizar_status_nc(nc_id, "Deferido")

@router.post("/{nc_id}/indeferir", response_model=NaoConformidade)
async def indeferir_nc(nc_id: int):
    """Marca NC como Indeferida"""
    return await _atualizar_status_nc(nc_id, "Indeferido")

@router.post("/{nc_id}/resolver", response_model=NaoConformidade)
async def resolver_nc(nc_id: int):
    """Marca NC como Resolvida"""
    return await _atualizar_status_nc(nc_id, "Resolvido")

async def _atualizar_status_nc(nc_id: int, novo_status: str):
    """Função auxiliar para atualizar status"""
    query_update = """
        UPDATE nao_conformidades_v2 
        SET status = ?, atualizado_em = GETDATE()
        WHERE id = ?
    """
    sucesso = await executar_query(
        banco="Bddemo",
        query=query_update,
        params=(novo_status, nc_id),
        usuario="SISTEMA",
        endpoint="/nao-conformidades",
        is_select=False
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail=f"Erro ao marcar NC como {novo_status}")
    
    # Retorna atualizado
    query_select = """
        SELECT nc.id, nc.descricao, nc.data_ocorrencia, nc.status,
               nc.colaborador_id, c.nome as nome_colaborador,
               nc.criado_em, nc.atualizado_em
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

@router.delete("/{nc_id}")
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
