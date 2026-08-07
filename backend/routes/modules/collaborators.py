"""
Rotas de Colaboradores
Gerencia CRUD de colaboradores do sistema
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional
import sys
import os

# Adiciona o path do backend para importar database
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database import executar_query
from security import requer_permissao

router = APIRouter(prefix="/colaboradores", tags=["Colaboradores"])

# --- Schemas Pydantic ---

class ColaboradorBase(BaseModel):
    nome: str
    cargo: Optional[str] = None
    departamento: Optional[str] = None
    usuario_id: Optional[int] = None  # Vínculo com usuário do sistema

class ColaboradorCreate(ColaboradorBase):
    pass

class ColaboradorUpdate(BaseModel):
    nome: Optional[str] = None
    cargo: Optional[str] = None
    departamento: Optional[str] = None
    usuario_id: Optional[int] = None

class Colaborador(ColaboradorBase):
    id: int
    ativo: bool = True

# --- Rotas ---

@router.get("", response_model=List[Colaborador], dependencies=[Depends(requer_permissao("cadastros:colaboradores"))])
async def listar_colaboradores():
    """Lista todos os colaboradores cadastrados"""
    query = """
        SELECT 
            c.id, 
            c.nome, 
            c.cargo, 
            c.departamento, 
            c.ativo,
            c.usuario_id
        FROM colaboradores c 
        WHERE c.ativo = 1 OR c.ativo IS NULL
    """
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

@router.post("", response_model=Colaborador, status_code=status.HTTP_201_CREATED, dependencies=[Depends(requer_permissao("cadastros:colaboradores"))])
async def criar_colaborador(colab: ColaboradorCreate):
    """Adiciona novo colaborador"""
    query_insert = """
        INSERT INTO colaboradores (nome, cargo, departamento, usuario_id, ativo) 
        VALUES (?, ?, ?, ?, 1)
    """
    params_insert = (colab.nome, colab.cargo, colab.departamento, colab.usuario_id)
    
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
    query_select = """
        SELECT TOP 1 id, nome, cargo, departamento, usuario_id, ativo 
        FROM colaboradores 
        WHERE nome = ? 
        ORDER BY id DESC
    """
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

@router.put("/{colaborador_id}", response_model=Colaborador, dependencies=[Depends(requer_permissao("cadastros:colaboradores"))])
async def atualizar_colaborador(colaborador_id: int, colab: ColaboradorUpdate):
    """Atualiza dados de um colaborador existente"""
    # Constrói a query dinamicamente baseada nos campos fornecidos
    updates = []
    params = []
    
    if colab.nome is not None:
        updates.append("nome = ?")
        params.append(colab.nome)
    if colab.cargo is not None:
        updates.append("cargo = ?")
        params.append(colab.cargo)
    if colab.departamento is not None:
        updates.append("departamento = ?")
        params.append(colab.departamento)
    if colab.usuario_id is not None:
        updates.append("usuario_id = ?")
        params.append(colab.usuario_id)
    
    if not updates:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    params.append(colaborador_id)
    query_update = f"UPDATE colaboradores SET {', '.join(updates)}, atualizado_em = GETDATE() WHERE id = ?"
    
    sucesso = await executar_query(
        banco="Bddemo",
        query=query_update,
        params=tuple(params),
        usuario="SISTEMA",
        endpoint=f"/colaboradores/{colaborador_id}",
        is_select=False
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao atualizar colaborador")
    
    # Retorna o colaborador atualizado
    query_select = """
        SELECT id, nome, cargo, departamento, usuario_id, ativo 
        FROM colaboradores 
        WHERE id = ?
    """
    resultado = await executar_query(
        banco="Bddemo",
        query=query_select,
        params=(colaborador_id,),
        usuario="SISTEMA",
        endpoint=f"/colaboradores/{colaborador_id}"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado[0] if resultado else {}

@router.delete("/{colaborador_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(requer_permissao("cadastros:colaboradores"))])
async def excluir_colaborador(colaborador_id: int):
    """Exclui (desativa) um colaborador"""
    query = "UPDATE colaboradores SET ativo = 0, atualizado_em = GETDATE() WHERE id = ?"
    
    sucesso = await executar_query(
        banco="Bddemo",
        query=query,
        params=(colaborador_id,),
        usuario="SISTEMA",
        endpoint=f"/colaboradores/{colaborador_id}",
        is_select=False
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao excluir colaborador")
    
    return None
