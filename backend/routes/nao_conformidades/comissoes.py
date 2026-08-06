"""
Rotas de Comissões
Gerencia configurações de comissão, percentuais de perda e relatórios
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
import sys
import os

# Adiciona o path do backend para importar database
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database import executar_query

router = APIRouter(prefix="/comissoes", tags=["Comissões"])

# --- Schemas Pydantic ---

class ComissaoConfigBase(BaseModel):
    colaborador_id: int
    salario_base: float  # Salário base para cálculo da comissão
    percentual_desconto: float  # Percentual de desconto por NC (ex: 4.0 para 4%)

class ComissaoConfigCreate(ComissaoConfigBase):
    pass

class ComissaoConfig(ComissaoConfigBase):
    id: int
    nome_colaborador: str
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

class ComissaoRelatorioItem(BaseModel):
    colaborador_id: int
    nome_colaborador: str
    salario_base: float
    percentual_desconto: float
    valor_por_nc: float  # Salário base * (percentual_desconto / 100)
    total_ncs: int
    valor_total_desconto: float  # valor_por_nc * total_ncs
    salario_final: float  # salario_base - valor_total_desconto

# --- Rotas de Configuração de Comissões ---

@router.get("/configuracoes", response_model=List[ComissaoConfig])
async def listar_configuracoes_comissoes():
    """Lista todas as configurações de comissão dos colaboradores"""
    query = """
        SELECT cc.id, cc.colaborador_id, c.nome as nome_colaborador, 
               cc.salario_base, cc.percentual_desconto, cc.criado_em, cc.atualizado_em
        FROM comissoes_config cc
        INNER JOIN colaboradores c ON cc.colaborador_id = c.id
        WHERE c.ativo = 1
        ORDER BY c.nome
    """
    resultado = await executar_query(
        banco="Bddemo",
        query=query,
        params=(),
        usuario="SISTEMA",
        endpoint="/comissoes/configuracoes"
    )
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    return resultado if resultado else []


@router.post("/configuracoes", response_model=ComissaoConfig)
async def criar_configuracao_comissao(config: ComissaoConfigCreate):
    """Cria ou atualiza a configuração de comissão para um colaborador"""
    # Verifica se já existe configuração para este colaborador
    query_verifica = "SELECT id FROM comissoes_config WHERE colaborador_id = ?"
    verifica = await executar_query(
        banco="Bddemo",
        query=query_verifica,
        params=(config.colaborador_id,),
        usuario="SISTEMA",
        endpoint="/comissoes/configuracoes"
    )
    
    if verifica:
        # Atualiza existente
        query_update = """
            UPDATE comissoes_config 
            SET salario_base = ?, percentual_desconto = ?, atualizado_em = GETDATE()
            WHERE colaborador_id = ?
        """
        sucesso = await executar_query(
            banco="Bddemo",
            query=query_update,
            params=(config.salario_base, config.percentual_desconto, config.colaborador_id),
            usuario="SISTEMA",
            endpoint="/comissoes/configuracoes",
            is_select=False
        )
    else:
        # Cria nova
        query_insert = """
            INSERT INTO comissoes_config (colaborador_id, salario_base, percentual_desconto, criado_em)
            VALUES (?, ?, ?, GETDATE())
        """
        sucesso = await executar_query(
            banco="Bddemo",
            query=query_insert,
            params=(config.colaborador_id, config.salario_base, config.percentual_desconto),
            usuario="SISTEMA",
            endpoint="/comissoes/configuracoes",
            is_select=False
        )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao salvar configuração de comissão")
    
    # Retorna a configuração salva
    query_select = """
        SELECT cc.id, cc.colaborador_id, c.nome as nome_colaborador, 
               cc.salario_base, cc.percentual_desconto, cc.criado_em, cc.atualizado_em
        FROM comissoes_config cc
        INNER JOIN colaboradores c ON cc.colaborador_id = c.id
        WHERE cc.colaborador_id = ?
    """
    resultado = await executar_query(
        banco="Bddemo",
        query=query_select,
        params=(config.colaborador_id,),
        usuario="SISTEMA",
        endpoint="/comissoes/configuracoes"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado[0] if resultado else {}


@router.put("/configuracoes/{config_id}", response_model=ComissaoConfig)
async def atualizar_configuracao_comissao(config_id: int, config: ComissaoConfigCreate):
    """Atualiza uma configuração de comissão existente"""
    query_update = """
        UPDATE comissoes_config 
        SET salario_base = ?, percentual_desconto = ?, atualizado_em = GETDATE()
        WHERE id = ?
    """
    sucesso = await executar_query(
        banco="Bddemo",
        query=query_update,
        params=(config.salario_base, config.percentual_desconto, config_id),
        usuario="SISTEMA",
        endpoint="/comissoes/configuracoes",
        is_select=False
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao atualizar configuração")
    
    # Retorna a configuração atualizada
    query_select = """
        SELECT cc.id, cc.colaborador_id, c.nome as nome_colaborador, 
               cc.salario_base, cc.percentual_desconto, cc.criado_em, cc.atualizado_em
        FROM comissoes_config cc
        INNER JOIN colaboradores c ON cc.colaborador_id = c.id
        WHERE cc.id = ?
    """
    resultado = await executar_query(
        banco="Bddemo",
        query=query_select,
        params=(config_id,),
        usuario="SISTEMA",
        endpoint="/comissoes/configuracoes"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    if not resultado:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    
    return resultado[0]


@router.delete("/configuracoes/{config_id}")
async def deletar_configuracao_comissao(config_id: int):
    """Exclui uma configuração de comissão"""
    query = "DELETE FROM comissoes_config WHERE id = ?"
    sucesso = await executar_query(
        banco="Bddemo",
        query=query,
        params=(config_id,),
        usuario="SISTEMA",
        endpoint="/comissoes/configuracoes",
        is_select=False
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao excluir configuração")
    
    return {"message": "Configuração excluída com sucesso"}


# --- Rotas de Relatório de Comissões ---

@router.get("/relatorio", response_model=List[ComissaoRelatorioItem])
async def gerar_relatorio_comissoes(mes: Optional[int] = None, ano: Optional[int] = None):
    """Gera relatório de comissões com base nas NCs do período
    
    Regra de negócio:
    - NCs com veredito 'Deferido': NÃO debitam da comissão
    - NCs com veredito 'Indeferido': Debitam da comissão
    - NCs sem veredito (NULL): Debitam da comissão (mantidas sem análise)
    """
    
    hoje = date.today()
    if mes is None:
        mes = hoje.month
    if ano is None:
        ano = hoje.year
    
    # Primeiro dia do mês
    data_inicio = f"{ano}-{mes:02d}-01"
    
    # Último dia do mês (usando EOMONTH do SQL Server)
    data_fim_sql = f"EOMONTH('{data_inicio}')"
    
    query = f"""
        SELECT 
            c.id as colaborador_id,
            c.nome as nome_colaborador,
            ISNULL(cc.salario_base, 0) as salario_base,
            ISNULL(cc.percentual_desconto, 0) as percentual_desconto,
            ISNULL(cc.salario_base, 0) * ISNULL(cc.percentual_desconto, 0) / 100.0 as valor_por_nc,
            COUNT(nc.id) as total_ncs,
            ISNULL(cc.salario_base, 0) * ISNULL(cc.percentual_desconto, 0) / 100.0 * COUNT(nc.id) as valor_total_desconto,
            ISNULL(cc.salario_base, 0) - (ISNULL(cc.salario_base, 0) * ISNULL(cc.percentual_desconto, 0) / 100.0 * COUNT(nc.id)) as salario_final
        FROM colaboradores c
        LEFT JOIN comissoes_config cc ON c.id = cc.colaborador_id
        LEFT JOIN nao_conformidades_v2 nc ON c.id = nc.colaborador_id 
            AND nc.data_ocorrencia >= '{data_inicio}' 
            AND nc.data_ocorrencia <= {data_fim_sql}
            -- Debita apenas se: veredito for 'Indeferido' OU veredito for NULL (sem verdito)
            -- NÃO debita se veredito for 'Deferido'
            AND (nc.veredito = 'Indeferido' OR nc.veredito IS NULL)
        WHERE c.ativo = 1
        GROUP BY c.id, c.nome, cc.salario_base, cc.percentual_desconto
        ORDER BY c.nome
    """
    
    resultado = await executar_query(
        banco="Bddemo",
        query=query,
        params=(),
        usuario="SISTEMA",
        endpoint="/comissoes/relatorio"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado if resultado else []
