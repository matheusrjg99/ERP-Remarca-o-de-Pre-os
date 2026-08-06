"""
Rotas de Colaboradores
Gerencia CRUD de colaboradores do sistema
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
import sys
import os

# Adiciona o path do backend para importar database
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database import executar_query

router = APIRouter(prefix="/colaboradores", tags=["Colaboradores"])

# --- Schemas Pydantic ---

class ColaboradorBase(BaseModel):
    nome: str
    cargo: Optional[str] = None
    departamento: Optional[str] = None

class ColaboradorCreate(ColaboradorBase):
    pass

class Colaborador(ColaboradorBase):
    id: int

# --- Rotas ---

@router.get("", response_model=List[Colaborador])
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

@router.post("", response_model=Colaborador, status_code=status.HTTP_201_CREATED)
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
