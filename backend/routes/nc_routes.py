from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import aioodbc
import os

router = APIRouter()

# --- Configuração do Banco ---
DB_HOST = os.getenv("DB_HOST", "192.168.0.254")
DB_NAME = os.getenv("DB_NAME", "SEU_BANCO_DE_DADOS") # Ajuste se necessário
DB_USER = os.getenv("DB_USER", "seu_usuario")
DB_PASSWORD = os.getenv("DB_PASSWORD", "sua_senha")

async def get_db_connection():
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={DB_HOST};"
        f"DATABASE={DB_NAME};"
        f"UID={DB_USER};"
        f"PWD={DB_PASSWORD}"
    )
    return await aioodbc.connect(conn_str, autocommit=True)

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
    conn = await get_db_connection()
    try:
        cursor = await conn.cursor()
        # Busca da tabela existente de colaboradores
        await cursor.execute("SELECT id, nome, cargo, departamento FROM colaboradores WHERE ativo = 1 OR ativo IS NULL")
        columns = [column[0] for column in cursor.description]
        results = []
        async for row in cursor:
            results.append(dict(zip(columns, row)))
        return results
    finally:
        await conn.close()

@router.post("/colaboradores", response_model=Colaborador, status_code=status.HTTP_201_CREATED)
async def criar_colaborador(colab: ColaboradorCreate):
    """Adiciona novo colaborador"""
    conn = await get_db_connection()
    try:
        cursor = await conn.cursor()
        await cursor.execute(
            "INSERT INTO colaboradores (nome, cargo, departamento, ativo) VALUES (?, ?, ?, 1); SELECT SCOPE_IDENTITY();",
            (colab.nome, colab.cargo, colab.departamento)
        )
        new_id = await cursor.fetchone()
        await conn.commit()
        
        # Retorna o objeto criado
        await cursor.execute("SELECT id, nome, cargo, departamento FROM colaboradores WHERE id = ?", (new_id[0],))
        row = await cursor.fetchone()
        columns = [column[0] for column in cursor.description]
        return dict(zip(columns, row))
    finally:
        await conn.close()

@router.get("/nao-conformidades", response_model=List[NaoConformidade])
async def listar_ncs(colaborador_id: Optional[int] = None, status: Optional[str] = None):
    """Lista NCs com dados do colaborador (JOIN)"""
    conn = await get_db_connection()
    try:
        cursor = await conn.cursor()
        
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

        await cursor.execute(query, params)
        columns = [column[0] for column in cursor.description]
        results = []
        async for row in cursor:
            results.append(dict(zip(columns, row)))
        return results
    finally:
        await conn.close()

@router.post("/nao-conformidades", response_model=NaoConformidade, status_code=status.HTTP_201_CREATED)
async def criar_nc(nc: NaoConformidadeCreate):
    """Cria nova Não Conformidade vinculada a um ID de colaborador"""
    conn = await get_db_connection()
    try:
        cursor = await conn.cursor()
        
        # Valida se o colaborador existe
        await cursor.execute("SELECT id FROM colaboradores WHERE id = ?", (nc.colaborador_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Colaborador não encontrado")

        await cursor.execute(
            """INSERT INTO nao_conformidades_v2 
               (colaborador_id, descricao, data_ocorrencia, status, observacoes) 
               VALUES (?, ?, ?, ?, ?); 
               SELECT SCOPE_IDENTITY();""",
            (nc.colaborador_id, nc.descricao, nc.data_ocorrencia, nc.status, nc.observacoes)
        )
        new_id = await cursor.fetchone()
        await conn.commit()

        # Retorna completo com nome
        await cursor.execute("""
            SELECT nc.id, nc.descricao, nc.data_ocorrencia, nc.status, nc.observacoes,
                   nc.colaborador_id, c.nome as nome_colaborador
            FROM nao_conformidades_v2 nc
            JOIN colaboradores c ON nc.colaborador_id = c.id
            WHERE nc.id = ?
        """, (new_id[0],))
        
        row = await cursor.fetchone()
        columns = [column[0] for column in cursor.description]
        return dict(zip(columns, row))
    finally:
        await conn.close()

@router.put("/nao-conformidades/{nc_id}", response_model=NaoConformidade)
async def atualizar_nc(nc_id: int, nc_update: NaoConformidadeBase):
    """Atualiza status ou observações de uma NC"""
    conn = await get_db_connection()
    try:
        cursor = await conn.cursor()
        await cursor.execute(
            """UPDATE nao_conformidades_v2 
               SET status = ?, observacoes = ?
               WHERE id = ?""",
            (nc_update.status, nc_update.observacoes, nc_id)
        )
        await conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="NC não encontrada")

        # Retorna atualizado
        await cursor.execute("""
            SELECT nc.id, nc.descricao, nc.data_ocorrencia, nc.status, nc.observacoes,
                   nc.colaborador_id, c.nome as nome_colaborador
            FROM nao_conformidades_v2 nc
            JOIN colaboradores c ON nc.colaborador_id = c.id
            WHERE nc.id = ?
        """, (nc_id,))
        row = await cursor.fetchone()
        columns = [column[0] for column in cursor.description]
        return dict(zip(columns, row))
    finally:
        await conn.close()

@router.delete("/nao-conformidades/{nc_id}")
async def deletar_nc(nc_id: int):
    """Exclui uma NC (e suas contestações em cascade)"""
    conn = await get_db_connection()
    try:
        cursor = await conn.cursor()
        await cursor.execute("DELETE FROM nao_conformidades_v2 WHERE id = ?", (nc_id,))
        await conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="NC não encontrada")
        return {"message": "NC excluída com sucesso"}
    finally:
        await conn.close()

# --- Contestações ---

@router.get("/contestacoes/{nc_id}", response_model=List[NCContestacao])
async def listar_contestacoes(nc_id: int):
    """Lista todas as mensagens de uma NC específica"""
    conn = await get_db_connection()
    try:
        cursor = await conn.cursor()
        await cursor.execute(
            "SELECT id, nao_conformidade_id, mensagem, usuario, data_hora FROM contestacoes_v2 WHERE nao_conformidade_id = ? ORDER BY data_hora ASC",
            (nc_id,)
        )
        columns = [column[0] for column in cursor.description]
        results = []
        async for row in cursor:
            results.append(dict(zip(columns, row)))
        return results
    finally:
        await conn.close()

@router.post("/contestacoes", response_model=NCContestacao, status_code=status.HTTP_201_CREATED)
async def adicionar_contestacao(contestacao: NCContestacaoCreate):
    """Adiciona mensagem ao chat da NC"""
    conn = await get_db_connection()
    try:
        cursor = await conn.cursor()
        await cursor.execute(
            """INSERT INTO contestacoes_v2 (nao_conformidade_id, mensagem, usuario, data_hora) 
               VALUES (?, ?, ?, GETDATE()); 
               SELECT SCOPE_IDENTITY();""",
            (contestacao.nao_conformidade_id, contestacao.mensagem, contestacao.usuario)
        )
        new_id = await cursor.fetchone()
        await conn.commit()

        await cursor.execute(
            "SELECT id, nao_conformidade_id, mensagem, usuario, data_hora FROM contestacoes_v2 WHERE id = ?",
            (new_id[0],)
        )
        row = await cursor.fetchone()
        columns = [column[0] for column in cursor.description]
        return dict(zip(columns, row))
    finally:
        await conn.close()