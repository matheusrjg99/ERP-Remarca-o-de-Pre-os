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

    # ========================================================================
    # NOVOS MÉTODOS - MINHA COMISSÃO (VISÃO DO COLABORADOR)
    # ========================================================================

    @staticmethod
    async def calcular_minha_comissao(
        usuario_id: int,
        mes: Optional[int] = None,
        ano: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Calcula a comissão do usuário logado.
        
        Args:
            usuario_id: Pode ser o ID numérico OU o login do usuário
            mes: Mês para filtro (opcional)
            ano: Ano para filtro (opcional)
        
        Returns:
            Dict com os dados da comissão calculada
        """
        # 1. Primeiro, resolve o ID numérico do usuário
        # Se 'usuario_id' for string (login), busca o ID real
        if isinstance(usuario_id, str):
            query_resolve_usuario = """
                SELECT id 
                FROM dbo.API_USUARIOS 
                WHERE login = ? AND ativo = 1
            """
            
            resultado_resolve = await executar_query(
                banco="Bddemo",
                query=query_resolve_usuario,
                params=(usuario_id,),
                usuario="SISTEMA",
                endpoint="/minha-comissao/resolver-usuario"
            )
            
            if not resultado_resolve or isinstance(resultado_resolve, dict) or len(resultado_resolve) == 0:
                return {
                    "erro": "Usuário não encontrado",
                    "colaborador_id": None,
                    "nome_colaborador": None,
                    "salario_base": 0,
                    "percentual_desconto": 0,
                    "valor_por_nc": 0,
                    "total_ncs": 0,
                    "valor_total_desconto": 0,
                    "salario_final": 0,
                    "periodo": {"mes": mes, "ano": ano},
                    "ncs": []
                }
            
            usuario_id_numerico = resultado_resolve[0]['id']
        else:
            usuario_id_numerico = usuario_id
        
        # 2. Busca o colaborador vinculado ao usuário
        query_colaborador = """
            SELECT 
                id,
                nome,
                usuario_id,
                ativo
            FROM dbo.COLABORADORES
            WHERE usuario_id = ? AND ativo = 1
        """
        
        colaborador_resultado = await executar_query(
            banco="Bddemo",
            query=query_colaborador,
            params=(usuario_id_numerico,),
            usuario="SISTEMA",
            endpoint="/minha-comissao/colaborador"
        )
        
        if not colaborador_resultado or isinstance(colaborador_resultado, dict) or len(colaborador_resultado) == 0:
            return {
                "erro": "Nenhum colaborador vinculado ao seu usuário",
                "colaborador_id": None,
                "nome_colaborador": None,
                "salario_base": 0,
                "percentual_desconto": 0,
                "valor_por_nc": 0,
                "total_ncs": 0,
                "valor_total_desconto": 0,
                "salario_final": 0,
                "periodo": {"mes": mes, "ano": ano},
                "ncs": []
            }
        
        colaborador = colaborador_resultado[0]
        colaborador_id = colaborador['id']
        nome_colaborador = colaborador['nome']
        
        # 3. Busca a configuração de comissão
        query_config = """
            SELECT 
                id,
                colaborador_id,
                salario_base,
                percentual_desconto
            FROM dbo.comissoes_config
            WHERE colaborador_id = ?
        """
        
        config_resultado = await executar_query(
            banco="Bddemo",
            query=query_config,
            params=(colaborador_id,),
            usuario="SISTEMA",
            endpoint="/minha-comissao/configuracao"
        )
        
        salario_base = 0.0
        percentual_desconto = 0.0
        
        if config_resultado and not isinstance(config_resultado, dict) and len(config_resultado) > 0:
            configuracao = config_resultado[0]
            salario_base = float(configuracao.get('salario_base', 0) or 0)
            percentual_desconto = float(configuracao.get('percentual_desconto', 0) or 0)
        
        # 4. Busca as NCs do colaborador
        query_ncs = """
            SELECT 
                id,
                descricao,
                data_ocorrencia,
                status
            FROM dbo.nao_conformidades_v2
            WHERE colaborador_id = ?
        """
        params_ncs = [colaborador_id]
        
        if mes and ano:
            query_ncs += " AND MONTH(data_ocorrencia) = ? AND YEAR(data_ocorrencia) = ?"
            params_ncs.extend([mes, ano])
        elif mes:
            query_ncs += " AND MONTH(data_ocorrencia) = ?"
            params_ncs.append(mes)
        elif ano:
            query_ncs += " AND YEAR(data_ocorrencia) = ?"
            params_ncs.append(ano)
        
        query_ncs += " ORDER BY data_ocorrencia DESC"
        
        ncs_resultado = await executar_query(
            banco="Bddemo",
            query=query_ncs,
            params=tuple(params_ncs),
            usuario="SISTEMA",
            endpoint="/minha-comissao/ncs"
        )
        
        ncs = ncs_resultado if isinstance(ncs_resultado, list) else []
        
        # Filtra NCs que NÃO debitam (status 'Deferido')
        ncs_debitadas = [nc for nc in ncs if nc.get('status') != 'Deferido']
        
        total_ncs = len(ncs_debitadas)
        
        # 5. Calcula o desconto
        valor_por_nc = (salario_base * percentual_desconto) / 100 if salario_base > 0 and percentual_desconto > 0 else 0
        valor_total_desconto = valor_por_nc * total_ncs
        salario_final = salario_base - valor_total_desconto
        
        return {
            "colaborador_id": colaborador_id,
            "nome_colaborador": nome_colaborador,
            "salario_base": salario_base,
            "percentual_desconto": percentual_desconto,
            "valor_por_nc": valor_por_nc,
            "total_ncs": total_ncs,
            "valor_total_desconto": valor_total_desconto,
            "salario_final": salario_final,
            "periodo": {
                "mes": mes,
                "ano": ano
            },
            "ncs": ncs_debitadas
        }