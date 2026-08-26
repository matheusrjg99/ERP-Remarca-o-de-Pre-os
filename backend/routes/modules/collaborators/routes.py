"""
Rotas de Colaboradores
Apenas definição de endpoints, injeção de dependências e retorno de respostas HTTP
Regra de negócio delegada para services.py
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List

from auth.seguranca import requer_permissao
from .schemas import Colaborador, ColaboradorCreate, ColaboradorUpdate
from .services import ColaboradorService


router = APIRouter(prefix="/colaboradores", tags=["Colaboradores"])


@router.get("", response_model=List[Colaborador], dependencies=[Depends(requer_permissao("nc:criar"))])
async def listar_colaboradores():
    """Lista todos os colaboradores cadastrados"""
    resultado = await ColaboradorService.listar_todos()
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado if resultado else []


@router.post("", response_model=Colaborador, status_code=status.HTTP_201_CREATED, 
             dependencies=[Depends(requer_permissao("cadastros:colaboradores:criar"))])
async def criar_colaborador(colab: ColaboradorCreate):
    """Adiciona novo colaborador"""
    sucesso = await ColaboradorService.criar(
        nome=colab.nome,
        cargo=colab.cargo,
        departamento=colab.departamento,
        usuario_id=colab.usuario_id
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao criar colaborador")
    
    # Busca o colaborador recém-criado
    resultado = await ColaboradorService.buscar_por_nome(nome=colab.nome)
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado[0] if resultado else {}


@router.put("/{colaborador_id}", response_model=Colaborador, 
            dependencies=[Depends(requer_permissao("cadastros:colaboradores:editar"))])
async def atualizar_colaborador(colaborador_id: int, colab: ColaboradorUpdate):
    """Atualiza dados de um colaborador existente"""
    try:
        sucesso = await ColaboradorService.atualizar(
            colaborador_id=colaborador_id,
            nome=colab.nome,
            cargo=colab.cargo,
            departamento=colab.departamento,
            usuario_id=colab.usuario_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao atualizar colaborador")
    
    # Retorna o colaborador atualizado
    resultado = await ColaboradorService.buscar_por_id(colaborador_id=colaborador_id)
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado[0] if resultado else {}


@router.delete("/{colaborador_id}", status_code=status.HTTP_204_NO_CONTENT, 
               dependencies=[Depends(requer_permissao("cadastros:colaboradores:excluir"))])
async def excluir_colaborador(colaborador_id: int):
    """Exclui (desativa) um colaborador"""
    sucesso = await ColaboradorService.excluir(colaborador_id=colaborador_id)
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao excluir colaborador")
    
    return None
