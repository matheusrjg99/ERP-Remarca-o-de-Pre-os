from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import sys
import os

# Adiciona o path do backend para importar database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import executar_query
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.schemas import ComissaoConfig, ComissaoConfigCreate, PercentualPerda, PercentualPerdaCreate, ComissaoRelatorioItem

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

class NaoConformidadeCreate(NaoConformidadeBase):
    colaborador_id: int  # AGORA É ID INTEIRO

# Modelo específico para atualização (todos os campos opcionais)
class NaoConformidadeUpdate(BaseModel):
    descricao: Optional[str] = None
    data_ocorrencia: Optional[datetime] = None
    status: Optional[str] = None
    colaborador_id: Optional[int] = None

class NaoConformidade(NaoConformidadeBase):
    id: int
    colaborador_id: int
    nome_colaborador: str # Campo calculado via JOIN
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

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
async def atualizar_nc(nc_id: int, nc_update: NaoConformidadeUpdate):
    """Atualiza campos de uma NC (apenas os fornecidos)"""
    # Constrói a query dinamicamente baseada nos campos fornecidos
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

@router.post("/nao-conformidades/{nc_id}/deferir", response_model=NaoConformidade)
async def deferir_nc(nc_id: int):
    """Marca NC como Deferida"""
    return await _atualizar_status_nc(nc_id, "Deferido")

@router.post("/nao-conformidades/{nc_id}/indeferir", response_model=NaoConformidade)
async def indeferir_nc(nc_id: int):
    """Marca NC como Indeferida"""
    return await _atualizar_status_nc(nc_id, "Indeferido")

@router.post("/nao-conformidades/{nc_id}/resolver", response_model=NaoConformidade)
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


# ==========================================
# ROTAS DE COMISSÕES
# ==========================================

@router.get("/comissoes/configuracoes", response_model=List[ComissaoConfig])
async def listar_configuracoes_comissoes():
    """Lista todas as configurações de comissão dos colaboradores"""
    query = """
        SELECT cc.id, cc.colaborador_id, c.nome as nome_colaborador, cc.valor_maximo, cc.criado_em, cc.atualizado_em
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


@router.post("/comissoes/configuracoes", response_model=ComissaoConfig, status_code=status.HTTP_201_CREATED)
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
            SET valor_maximo = ?, atualizado_em = GETDATE()
            WHERE colaborador_id = ?
        """
        sucesso = await executar_query(
            banco="Bddemo",
            query=query_update,
            params=(config.valor_maximo, config.colaborador_id),
            usuario="SISTEMA",
            endpoint="/comissoes/configuracoes",
            is_select=False
        )
    else:
        # Cria nova
        query_insert = """
            INSERT INTO comissoes_config (colaborador_id, valor_maximo, criado_em)
            VALUES (?, ?, GETDATE())
        """
        sucesso = await executar_query(
            banco="Bddemo",
            query=query_insert,
            params=(config.colaborador_id, config.valor_maximo),
            usuario="SISTEMA",
            endpoint="/comissoes/configuracoes",
            is_select=False
        )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao salvar configuração de comissão")
    
    # Retorna a configuração salva
    query_select = """
        SELECT cc.id, cc.colaborador_id, c.nome as nome_colaborador, cc.valor_maximo, cc.criado_em, cc.atualizado_em
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


@router.get("/comissoes/percentuais", response_model=List[PercentualPerda])
async def listar_percentuais_perda():
    """Lista todos os percentuais de perda por tipo de não conformidade"""
    query = "SELECT id, descricao, percentual, ativo, criado_em FROM comissoes_percentuais WHERE ativo = 1 ORDER BY descricao"
    resultado = await executar_query(
        banco="Bddemo",
        query=query,
        params=(),
        usuario="SISTEMA",
        endpoint="/comissoes/percentuais"
    )
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    return resultado if resultado else []


@router.post("/comissoes/percentuais", response_model=PercentualPerda, status_code=status.HTTP_201_CREATED)
async def criar_percentual_perda(percentual: PercentualPerdaCreate):
    """Cadastra um novo percentual de perda"""
    query_insert = """
        INSERT INTO comissoes_percentuais (descricao, percentual, ativo, criado_em)
        VALUES (?, ?, 1, GETDATE())
    """
    sucesso = await executar_query(
        banco="Bddemo",
        query=query_insert,
        params=(percentual.descricao, percentual.percentual),
        usuario="SISTEMA",
        endpoint="/comissoes/percentuais",
        is_select=False
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao cadastrar percentual")
    
    # Retorna o percentual criado
    query_select = """
        SELECT TOP 1 id, descricao, percentual, ativo, criado_em
        FROM comissoes_percentuais
        ORDER BY ID DESC
    """
    resultado = await executar_query(
        banco="Bddemo",
        query=query_select,
        params=(),
        usuario="SISTEMA",
        endpoint="/comissoes/percentuais"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    return resultado[0] if resultado else {}


@router.put("/comissoes/percentuais/{percentual_id}", response_model=PercentualPerda)
async def atualizar_percentual_perda(percentual_id: int, percentual: PercentualPerdaCreate):
    """Atualiza um percentual de perda existente"""
    query_update = """
        UPDATE comissoes_percentuais
        SET descricao = ?, percentual = ?
        WHERE id = ?
    """
    sucesso = await executar_query(
        banco="Bddemo",
        query=query_update,
        params=(percentual.descricao, percentual.percentual, percentual_id),
        usuario="SISTEMA",
        endpoint="/comissoes/percentuais",
        is_select=False
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao atualizar percentual")
    
    # Retorna o percentual atualizado
    query_select = """
        SELECT id, descricao, percentual, ativo, criado_em
        FROM comissoes_percentuais
        WHERE id = ?
    """
    resultado = await executar_query(
        banco="Bddemo",
        query=query_select,
        params=(percentual_id,),
        usuario="SISTEMA",
        endpoint="/comissoes/percentuais"
    )
    
    if isinstance(resultado, dict) and "erro" in resultado:
        raise HTTPException(status_code=500, detail=resultado["erro"])
    
    if not resultado:
        raise HTTPException(status_code=404, detail="Percentual não encontrado")
    
    return resultado[0]


@router.delete("/comissoes/percentuais/{percentual_id}")
async def deletar_percentual_perda(percentual_id: int):
    """Desativa um percentual de perda (soft delete)"""
    query = "UPDATE comissoes_percentuais SET ativo = 0 WHERE id = ?"
    sucesso = await executar_query(
        banco="Bddemo",
        query=query,
        params=(percentual_id,),
        usuario="SISTEMA",
        endpoint="/comissoes/percentuais",
        is_select=False
    )
    
    if sucesso is not True:
        raise HTTPException(status_code=500, detail="Erro ao desativar percentual")
    
    return {"message": "Percentual desativado com sucesso"}


@router.get("/comissoes/relatorio", response_model=List[ComissaoRelatorioItem])
async def gerar_relatorio_comissoes(mes: Optional[int] = None, ano: Optional[int] = None):
    """Gera relatório de comissões com base nas NCs do período"""
    from datetime import date
    
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
            ISNULL(cc.valor_maximo, 0) as valor_maximo_comissao,
            COUNT(nc.id) as total_ncs,
            ISNULL(SUM(CASE 
                WHEN nc.status IN ('Deferido', 'Indeferido') THEN cp.percentual
                ELSE 0
            END), 0) as total_perdas,
            ISNULL(cc.valor_maximo, 0) - (ISNULL(cc.valor_maximo, 0) * ISNULL(SUM(CASE 
                WHEN nc.status IN ('Deferido', 'Indeferido') THEN cp.percentual / 100.0
                ELSE 0
            END), 0)) as valor_comissao_final
        FROM colaboradores c
        LEFT JOIN comissoes_config cc ON c.id = cc.colaborador_id
        LEFT JOIN nao_conformidades_v2 nc ON c.id = nc.colaborador_id 
            AND nc.data_ocorrencia >= '{data_inicio}' 
            AND nc.data_ocorrencia <= {data_fim_sql}
        CROSS JOIN comissoes_percentuais cp
        WHERE c.ativo = 1
        GROUP BY c.id, c.nome, cc.valor_maximo
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
