"""
Rotas de Não Conformidades (NCs)
Apenas definição de endpoints, injeção de dependências e retorno de respostas HTTP
Regra de negócio delegada para services.py
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional

from auth.seguranca import requer_permissao
from .schemas import NaoConformidade, NaoConformidadeCreate, NaoConformidadeUpdate
from .services import NaoConformidadeService


router = APIRouter(prefix="/nao-conformidades", tags=["Não Conformidades"])


@router.get("", response_model=List[NaoConformidade], dependencies=[Depends(requer_permissao("nc:visualizar"))])
async def listar_ncs(
    colaborador_id: Optional[int] = None,
    status: Optional[str] = None,
    mes: Optional[int] = None,
    ano: Optional[int] = None
):
    """Lista NCs com dados do colaborador (JOIN)"""
    resultado = await NaoConformidadeService.listar_todos(
        colaborador_id=colaborador_id,
        status=status,
        mes=mes,
        ano=ano
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado if resultado else []


@router.post("", response_model=NaoConformidade, status_code=status.HTTP_201_CREATED, 
             dependencies=[Depends(requer_permissao("nc:criar"))])
async def criar_nc(nc: NaoConformidadeCreate):
    """Cria nova Não Conformidade vinculada a um ID de colaborador"""
    # Valida se o colaborador existe
    valida = await NaoConformidadeService.validar_colaborador(colaborador_id=nc.colaborador_id)
    
    if not valida:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    
    sucesso = await NaoConformidadeService.criar(
        colaborador_id=nc.colaborador_id,
        descricao=nc.descricao,
        data_ocorrencia=nc.data_ocorrencia,
        status=nc.status
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao criar NC")
    
    # Retorna completo com nome
    resultado = await NaoConformidadeService.buscar_ultima()
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado[0] if resultado else {}


@router.put("/{nc_id}", response_model=NaoConformidade, dependencies=[Depends(requer_permissao("nc:editar"))])
async def atualizar_nc(nc_id: int, nc_update: NaoConformidadeUpdate):
    """Atualiza campos de uma NC (apenas os fornecidos)"""
    try:
        sucesso = await NaoConformidadeService.atualizar(
            nc_id=nc_id,
            descricao=nc_update.descricao,
            data_ocorrencia=nc_update.data_ocorrencia,
            status=nc_update.status,
            colaborador_id=nc_update.colaborador_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao atualizar NC")
    
    # Retorna atualizado
    resultado = await NaoConformidadeService.buscar_por_id(nc_id=nc_id)
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    if not resultado:
        raise HTTPException(status_code=404, detail="NC não encontrada")
    
    return resultado[0]


@router.post("/{nc_id}/deferir", response_model=NaoConformidade, dependencies=[Depends(requer_permissao("nc:deferir"))])
async def deferir_nc(nc_id: int):
    """Marca NC como Deferida"""
    return await _atualizar_status_nc(nc_id, "Deferido")


@router.post("/{nc_id}/indeferir", response_model=NaoConformidade, dependencies=[Depends(requer_permissao("nc:indeferir"))])
async def indeferir_nc(nc_id: int):
    """Marca NC como Indeferida"""
    return await _atualizar_status_nc(nc_id, "Indeferido")


@router.post("/{nc_id}/resolver", response_model=NaoConformidade, dependencies=[Depends(requer_permissao("nc:resolver"))])
async def resolver_nc(nc_id: int):
    """Marca NC como Resolvida"""
    return await _atualizar_status_nc(nc_id, "Resolvido")


async def _atualizar_status_nc(nc_id: int, novo_status: str) -> NaoConformidade:
    """Função auxiliar para atualizar status"""
    sucesso = await NaoConformidadeService.atualizar_status(
        nc_id=nc_id,
        novo_status=novo_status
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail=f"Erro ao marcar NC como {novo_status}")
    
    # Retorna atualizado
    resultado = await NaoConformidadeService.buscar_por_id(nc_id=nc_id)
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    if not resultado:
        raise HTTPException(status_code=404, detail="NC não encontrada")
    
    return resultado[0]


@router.delete("/{nc_id}", dependencies=[Depends(requer_permissao("nc:excluir"))])
async def deletar_nc(nc_id: int):
    """Exclui uma NC (e suas contestações em cascade)"""
    sucesso = await NaoConformidadeService.excluir(nc_id=nc_id)
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao excluir NC")
    
    return {"message": "NC excluída com sucesso"}
