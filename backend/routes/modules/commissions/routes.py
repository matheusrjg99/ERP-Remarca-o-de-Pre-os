"""
Rotas de Comissões
Apenas definição de endpoints, injeção de dependências e retorno de respostas HTTP
Regra de negócio delegada para services.py
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional

from auth.seguranca import requer_permissao, get_current_user
from .schemas import (
    ComissaoConfig, 
    ComissaoConfigCreate, 
    ComissaoRelatorioItem,
    MinhaComissaoResponse,
    # NOVOS
    ColaboradorResponsavel,
    ColaboradorResponsavelCreate,
    ColaboradorResponsavelUpdate,
)
from .services import ComissaoService


router = APIRouter(prefix="/comissoes", tags=["Comissões"])


# --- Rotas de Configuração de Comissões ---

@router.get("/configuracoes", response_model=List[ComissaoConfig], 
            dependencies=[Depends(requer_permissao("cadastros:comissoes"))])
async def listar_configuracoes_comissoes():
    """Lista todas as configurações de comissão dos colaboradores"""
    resultado = await ComissaoService.listar_configuracoes()
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado if resultado else []


@router.post("/configuracoes", response_model=ComissaoConfig, 
             dependencies=[Depends(requer_permissao("cadastros:comissoes"))])
async def criar_configuracao_comissao(config: ComissaoConfigCreate):
    """Cria ou atualiza a configuração de comissão para um colaborador"""
    verifica = await ComissaoService.buscar_config_por_colaborador(colaborador_id=config.colaborador_id)
    
    if verifica:
        sucesso = await ComissaoService.atualizar_configuracao_por_colaborador(
            colaborador_id=config.colaborador_id,
            salario_base=config.salario_base,
            percentual_desconto=config.percentual_desconto
        )
    else:
        sucesso = await ComissaoService.criar_configuracao(
            colaborador_id=config.colaborador_id,
            salario_base=config.salario_base,
            percentual_desconto=config.percentual_desconto
        )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao salvar configuração de comissão")
    
    resultado = await ComissaoService.buscar_config_apos_salvar(colaborador_id=config.colaborador_id)
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado[0] if resultado else {}


@router.put("/configuracoes/{config_id}", response_model=ComissaoConfig, 
            dependencies=[Depends(requer_permissao("cadastros:comissoes"))])
async def atualizar_configuracao_comissao(config_id: int, config: ComissaoConfigCreate):
    """Atualiza uma configuração de comissão existente"""
    sucesso = await ComissaoService.atualizar_configuracao(
        config_id=config_id,
        salario_base=config.salario_base,
        percentual_desconto=config.percentual_desconto
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao atualizar configuração")
    
    resultado = await ComissaoService.buscar_config_por_id(config_id=config_id)
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    if not resultado:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    
    return resultado[0]


@router.delete("/configuracoes/{config_id}", 
               dependencies=[Depends(requer_permissao("cadastros:comissoes"))])
async def deletar_configuracao_comissao(config_id: int):
    """Exclui uma configuração de comissão"""
    sucesso = await ComissaoService.excluir_configuracao(config_id=config_id)
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao excluir configuração")
    
    return {"message": "Configuração excluída com sucesso"}


# --- Rotas de Relatório de Comissões ---

@router.get("/relatorio", response_model=List[ComissaoRelatorioItem], 
            dependencies=[Depends(requer_permissao("nc:relatorios"))])
async def gerar_relatorio_comissoes(mes: Optional[int] = None, ano: Optional[int] = None):
    """Gera relatório de comissões com base nas NCs do período
    
    Regra de negócio:
    - NCs com status 'Deferido': NÃO debitam da comissão
    - NCs com status 'Indeferido': Debitam da comissão
    - NCs com outros status (Pendente, Contestada, etc.): Debitam da comissão
    """
    resultado = await ComissaoService.gerar_relatorio(mes=mes, ano=ano)
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado if resultado else []


# --- Rota de Minha Comissão (Visão do Colaborador) ---

@router.get("/minha-comissao", response_model=MinhaComissaoResponse)
async def get_minha_comissao(
    mes: Optional[int] = Query(None, description="Mês para filtro"),
    ano: Optional[int] = Query(None, description="Ano para filtro"),
    current_user: dict = Depends(get_current_user)
):
    """
    Retorna a comissão do usuário logado.
    O usuário vê apenas sua própria comissão, baseada no vínculo com colaborador.
    
    Permissão: Qualquer usuário autenticado pode ver sua própria comissão.
    """
    usuario_id = current_user.get("usuario_id")
    
    if not usuario_id:
        raise HTTPException(
            status_code=401,
            detail="Usuário não identificado"
        )
    
    resultado = await ComissaoService.calcular_minha_comissao(
        usuario_id=usuario_id,
        mes=mes,
        ano=ano
    )
    
    if "erro" in resultado and resultado.get("colaborador_id") is None:
        raise HTTPException(
            status_code=404,
            detail=resultado["erro"]
        )
    
    return resultado


# ========================================================================
# ROTAS - RELAÇÕES RESPONSÁVEL ↔ SUBORDINADO
# ========================================================================

@router.get("/responsaveis", response_model=List[ColaboradorResponsavel],
            dependencies=[Depends(requer_permissao("cadastros:comissoes"))])
async def listar_responsaveis():
    """Lista todas as relações responsável ↔ subordinado"""
    resultado = await ComissaoService.listar_responsaveis()
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado if resultado else []


@router.post("/responsaveis", response_model=ColaboradorResponsavel,
             dependencies=[Depends(requer_permissao("cadastros:comissoes"))])
async def criar_responsavel(relacao: ColaboradorResponsavelCreate):
    """Cria uma nova relação responsável ↔ subordinado"""
    if relacao.responsavel_id == relacao.subordinado_id:
        raise HTTPException(
            status_code=400, 
            detail="Colaborador não pode ser responsável de si mesmo"
        )
    
    if relacao.percentual_desconto < 0 or relacao.percentual_desconto > 100:
        raise HTTPException(
            status_code=400, 
            detail="Percentual deve estar entre 0 e 100"
        )
    
    sucesso = await ComissaoService.criar_relacao(
        responsavel_id=relacao.responsavel_id,
        subordinado_id=relacao.subordinado_id,
        percentual_desconto=relacao.percentual_desconto
    )
    
    if sucesso is not True:
        if isinstance(sucesso, dict) and "erro" in sucesso:
            erro_msg = str(sucesso["erro"])
            if "UQ_RESP_Relacao" in erro_msg or "duplicate" in erro_msg.lower():
                raise HTTPException(
                    status_code=409, 
                    detail="Esta relação já existe"
                )
            raise HTTPException(status_code=500, detail=erro_msg)
        raise HTTPException(status_code=500, detail="Erro ao criar relação")
    
    todas = await ComissaoService.listar_responsaveis()
    if isinstance(todas, list):
        for r in todas:
            if (r["responsavel_id"] == relacao.responsavel_id and 
                r["subordinado_id"] == relacao.subordinado_id):
                return r
    
    raise HTTPException(status_code=500, detail="Relação criada mas não encontrada")


@router.put("/responsaveis/{relacao_id}", response_model=ColaboradorResponsavel,
            dependencies=[Depends(requer_permissao("cadastros:comissoes"))])
async def atualizar_responsavel(relacao_id: int, relacao: ColaboradorResponsavelUpdate):
    """Atualiza uma relação existente (percentual e/ou ativo)"""
    if relacao.percentual_desconto is not None:
        if relacao.percentual_desconto < 0 or relacao.percentual_desconto > 100:
            raise HTTPException(
                status_code=400, 
                detail="Percentual deve estar entre 0 e 100"
            )
    
    sucesso = await ComissaoService.atualizar_relacao(
        relacao_id=relacao_id,
        percentual_desconto=relacao.percentual_desconto,
        ativo=relacao.ativo
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao atualizar relação")
    
    resultado = await ComissaoService.buscar_relacao(relacao_id)
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    if not resultado:
        raise HTTPException(status_code=404, detail="Relação não encontrada")
    
    return resultado[0]


@router.delete("/responsaveis/{relacao_id}",
               dependencies=[Depends(requer_permissao("cadastros:comissoes"))])
async def deletar_responsavel(relacao_id: int):
    """Exclui uma relação responsável ↔ subordinado"""
    sucesso = await ComissaoService.excluir_relacao(relacao_id)
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao excluir relação")
    
    return {"message": "Relação excluída com sucesso"}