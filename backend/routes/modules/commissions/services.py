"""
Services para módulo de Comissões
Contém toda a regra de negócio e queries SQL
"""
from typing import List, Dict, Any, Union, Optional
from datetime import date
from database import executar_query


class ComissaoService:
    """Serviço de Comissões - encapsula lógica de negócio e acesso ao banco"""

    @staticmethod
    async def listar_configuracoes() -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Lista todas as configurações de comissão dos colaboradores ativos"""
        query = """
            SELECT cc.id, cc.colaborador_id, c.nome as nome_colaborador, 
                   cc.salario_base, cc.percentual_desconto, cc.criado_em, cc.atualizado_em
            FROM comissoes_config cc
            INNER JOIN colaboradores c ON cc.colaborador_id = c.id
            WHERE c.ativo = 1
            ORDER BY c.nome
        """
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(),
            usuario="SISTEMA",
            endpoint="/comissoes/configuracoes"
        )

    @staticmethod
    async def buscar_config_por_colaborador(colaborador_id: int) -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Busca configuração de comissão por colaborador"""
        query = """
            SELECT id FROM comissoes_config WHERE colaborador_id = ?
        """
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(colaborador_id,),
            usuario="SISTEMA",
            endpoint="/comissoes/configuracoes"
        )

    @staticmethod
    async def criar_configuracao(
        colaborador_id: int,
        salario_base: float,
        percentual_desconto: float
    ) -> Union[bool, Dict[str, str]]:
        """Cria nova configuração de comissão"""
        query = """
            INSERT INTO comissoes_config (colaborador_id, salario_base, percentual_desconto, criado_em)
            VALUES (?, ?, ?, GETDATE())
        """
        params = (colaborador_id, salario_base, percentual_desconto)
        
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=params,
            usuario="SISTEMA",
            endpoint="/comissoes/configuracoes",
            is_select=False
        )

    @staticmethod
    async def atualizar_configuracao(
        config_id: int,
        salario_base: float,
        percentual_desconto: float
    ) -> Union[bool, Dict[str, str]]:
        """Atualiza configuração de comissão existente"""
        query = """
            UPDATE comissoes_config 
            SET salario_base = ?, percentual_desconto = ?, atualizado_em = GETDATE()
            WHERE id = ?
        """
        params = (salario_base, percentual_desconto, config_id)
        
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=params,
            usuario="SISTEMA",
            endpoint="/comissoes/configuracoes",
            is_select=False
        )

    @staticmethod
    async def atualizar_configuracao_por_colaborador(
        colaborador_id: int,
        salario_base: float,
        percentual_desconto: float
    ) -> Union[bool, Dict[str, str]]:
        """Cria ou atualiza configuração de comissão para um colaborador"""
        query = """
            UPDATE comissoes_config 
            SET salario_base = ?, percentual_desconto = ?, atualizado_em = GETDATE()
            WHERE colaborador_id = ?
        """
        params = (salario_base, percentual_desconto, colaborador_id)
        
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=params,
            usuario="SISTEMA",
            endpoint="/comissoes/configuracoes",
            is_select=False
        )

    @staticmethod
    async def buscar_config_por_id(config_id: int) -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Busca configuração de comissão por ID"""
        query = """
            SELECT cc.id, cc.colaborador_id, c.nome as nome_colaborador, 
                   cc.salario_base, cc.percentual_desconto, cc.criado_em, cc.atualizado_em
            FROM comissoes_config cc
            INNER JOIN colaboradores c ON cc.colaborador_id = c.id
            WHERE cc.id = ?
        """
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(config_id,),
            usuario="SISTEMA",
            endpoint=f"/comissoes/configuracoes/{config_id}"
        )

    @staticmethod
    async def buscar_config_apos_salvar(colaborador_id: int) -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Retorna configuração após salvar (criar ou atualizar)"""
        query = """
            SELECT cc.id, cc.colaborador_id, c.nome as nome_colaborador, 
                   cc.salario_base, cc.percentual_desconto, cc.criado_em, cc.atualizado_em
            FROM comissoes_config cc
            INNER JOIN colaboradores c ON cc.colaborador_id = c.id
            WHERE cc.colaborador_id = ?
        """
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(colaborador_id,),
            usuario="SISTEMA",
            endpoint="/comissoes/configuracoes"
        )

    @staticmethod
    async def excluir_configuracao(config_id: int) -> Union[bool, Dict[str, str]]:
        """Exclui uma configuração de comissão"""
        query = "DELETE FROM comissoes_config WHERE id = ?"
        
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(config_id,),
            usuario="SISTEMA",
            endpoint="/comissoes/configuracoes",
            is_select=False
        )

    @staticmethod
    async def gerar_relatorio(
        mes: Optional[int] = None,
        ano: Optional[int] = None
    ) -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Gera relatório de comissões com base nas NCs do período
        
        Regra de negócio:
        - NCs com status 'Deferido': NÃO debitam da comissão
        - NCs com status 'Indeferido': Debitam da comissão
        - NCs com outros status (Pendente, Contestada, etc.): Debitam da comissão
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
                -- Debita apenas se: status for 'Indeferido' OU status for NULL/pendente
                -- NÃO debita se status for 'Deferido'
                AND (nc.status = 'Indeferido' OR nc.status NOT IN ('Deferido'))
            WHERE c.ativo = 1
            GROUP BY c.id, c.nome, cc.salario_base, cc.percentual_desconto
            ORDER BY c.nome
        """
        
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(),
            usuario="SISTEMA",
            endpoint="/comissoes/relatorio"
        )
