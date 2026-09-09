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
    MinhaComissaoResponse  # ADICIONADO
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
    # Verifica se já existe configuração para este colaborador
    verifica = await ComissaoService.buscar_config_por_colaborador(colaborador_id=config.colaborador_id)
    
    if verifica:
        # Atualiza existente
        sucesso = await ComissaoService.atualizar_configuracao_por_colaborador(
            colaborador_id=config.colaborador_id,
            salario_base=config.salario_base,
            percentual_desconto=config.percentual_desconto
        )
    else:
        # Cria nova
        sucesso = await ComissaoService.criar_configuracao(
            colaborador_id=config.colaborador_id,
            salario_base=config.salario_base,
            percentual_desconto=config.percentual_desconto
        )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao salvar configuração de comissão")
    
    # Retorna a configuração salva
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
    
    # Retorna a configuração atualizada
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
    # Obtém o ID do usuário do token
    usuario_id = current_user.get("usuario_id")
    
    if not usuario_id:
        raise HTTPException(
            status_code=401,
            detail="Usuário não identificado"
        )
    
    # Busca a comissão
    resultado = await ComissaoService.calcular_minha_comissao(
        usuario_id=usuario_id,
        mes=mes,
        ano=ano
    )
    
    # Se houver erro de vínculo, retorna 404
    if "erro" in resultado and resultado.get("colaborador_id") is None:
        raise HTTPException(
            status_code=404,
            detail=resultado["erro"]
        )
    
    return resultado