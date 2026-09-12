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

    # ========================================================================
    # CRUD - RELAÇÕES RESPONSÁVEL ↔ SUBORDINADO
    # Nota: modo silencioso — não grava auditoria (decisão 6C)
    # ========================================================================

    # Endpoint "silencioso" que já está na blacklist do database.py
    _ENDPOINT_SILENCIOSO = "/api/usuarios/cadastro"

    @staticmethod
    async def listar_responsaveis() -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Lista todas as relações responsável ↔ subordinado com nomes resolvidos"""
        query = """
            SELECT 
                r.id,
                r.responsavel_id,
                resp.nome AS nome_responsavel,
                r.subordinado_id,
                sub.nome AS nome_subordinado,
                r.percentual_desconto,
                r.ativo,
                r.criado_em,
                r.atualizado_em
            FROM dbo.colaboradores_responsaveis r
            INNER JOIN dbo.colaboradores resp ON r.responsavel_id = resp.id
            INNER JOIN dbo.colaboradores sub ON r.subordinado_id = sub.id
            WHERE resp.ativo = 1 AND sub.ativo = 1
            ORDER BY resp.nome, sub.nome
        """
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(),
            usuario="SISTEMA",
            endpoint=ComissaoService._ENDPOINT_SILENCIOSO
        )

    @staticmethod
    async def listar_responsaveis_por_colaborador(colaborador_id: int) -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Lista relações onde o colaborador é o RESPONSÁVEL"""
        query = """
            SELECT 
                r.id,
                r.subordinado_id,
                sub.nome AS nome_subordinado,
                r.percentual_desconto,
                r.ativo
            FROM dbo.colaboradores_responsaveis r
            INNER JOIN dbo.colaboradores sub ON r.subordinado_id = sub.id
            WHERE r.responsavel_id = ?
            ORDER BY sub.nome
        """
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(colaborador_id,),
            usuario="SISTEMA",
            endpoint=ComissaoService._ENDPOINT_SILENCIOSO
        )

    @staticmethod
    async def buscar_relacao(relacao_id: int) -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Busca uma relação específica por ID"""
        query = """
            SELECT 
                r.id,
                r.responsavel_id,
                resp.nome AS nome_responsavel,
                r.subordinado_id,
                sub.nome AS nome_subordinado,
                r.percentual_desconto,
                r.ativo,
                r.criado_em,
                r.atualizado_em
            FROM dbo.colaboradores_responsaveis r
            INNER JOIN dbo.colaboradores resp ON r.responsavel_id = resp.id
            INNER JOIN dbo.colaboradores sub ON r.subordinado_id = sub.id
            WHERE r.id = ?
        """
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(relacao_id,),
            usuario="SISTEMA",
            endpoint=ComissaoService._ENDPOINT_SILENCIOSO
        )

    @staticmethod
    async def criar_relacao(
        responsavel_id: int,
        subordinado_id: int,
        percentual_desconto: float
    ) -> Union[bool, Dict[str, str]]:
        """Cria relação. Levanta erro se já existir (UNIQUE) ou self (CHECK)."""
        query = """
            INSERT INTO dbo.colaboradores_responsaveis 
                (responsavel_id, subordinado_id, percentual_desconto, ativo, criado_em)
            VALUES (?, ?, ?, 1, GETDATE())
        """
        params = (responsavel_id, subordinado_id, percentual_desconto)
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=params,
            usuario="SISTEMA",
            endpoint=ComissaoService._ENDPOINT_SILENCIOSO,
            is_select=False
        )

    @staticmethod
    async def atualizar_relacao(
        relacao_id: int,
        percentual_desconto: Optional[float] = None,
        ativo: Optional[bool] = None
    ) -> Union[bool, Dict[str, str]]:
        """Atualiza relação (patch parcial — só o que foi passado)"""
        campos = []
        params = []

        if percentual_desconto is not None:
            campos.append("percentual_desconto = ?")
            params.append(percentual_desconto)

        if ativo is not None:
            campos.append("ativo = ?")
            params.append(1 if ativo else 0)

        if not campos:
            return True  # nada a atualizar

        campos.append("atualizado_em = GETDATE()")
        params.append(relacao_id)

        query = f"""
            UPDATE dbo.colaboradores_responsaveis
            SET {', '.join(campos)}
            WHERE id = ?
        """
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=tuple(params),
            usuario="SISTEMA",
            endpoint=ComissaoService._ENDPOINT_SILENCIOSO,
            is_select=False
        )

    @staticmethod
    async def excluir_relacao(relacao_id: int) -> Union[bool, Dict[str, str]]:
        """Exclui relação permanentemente"""
        query = "DELETE FROM dbo.colaboradores_responsaveis WHERE id = ?"
        return await executar_query(
            banco="Bddemo",
            query=query,
            params=(relacao_id,),
            usuario="SISTEMA",
            endpoint=ComissaoService._ENDPOINT_SILENCIOSO,
            is_select=False
        )


    @staticmethod
    async def gerar_relatorio(
        mes: Optional[int] = None,
        ano: Optional[int] = None
    ) -> Union[List[Dict[str, Any]], Dict[str, str]]:
        """Gera relatório de comissões com cálculo HIERÁRQUICO.

        Regra:
        - Desconto próprio:    salario_base × %_proprio × NCs_proprias
        - Desconto subordinados: salario_base × SUM(%_relacao × NCs_subordinado) / 100
        - Só NCs com status = 'Deferido' NÃO debitam.
        """
        hoje = date.today()
        if mes is None:
            mes = hoje.month
        if ano is None:
            ano = hoje.year

        data_inicio = f"{ano}-{mes:02d}-01"
        data_fim_sql = f"EOMONTH('{data_inicio}')"

        # CTE 1 — NCs próprias por colaborador
        # CTE 2 — NCs de subordinados agregadas por responsável
        query = f"""
            WITH ncs_proprias AS (
                SELECT 
                    nc.colaborador_id,
                    COUNT(nc.id) AS qtd_ncs_proprias
                FROM dbo.nao_conformidades_v2 nc
                WHERE nc.data_ocorrencia >= '{data_inicio}'
                  AND nc.data_ocorrencia <= {data_fim_sql}
                  AND nc.status <> 'Deferido'
                GROUP BY nc.colaborador_id
            ),
            ncs_subordinados AS (
                SELECT 
                    r.responsavel_id,
                    r.subordinado_id,
                    sub.nome AS nome_subordinado,
                    r.percentual_desconto,
                    COUNT(nc.id) AS qtd_ncs
                FROM dbo.colaboradores_responsaveis r
                INNER JOIN dbo.colaboradores sub ON r.subordinado_id = sub.id
                LEFT JOIN dbo.nao_conformidades_v2 nc
                    ON nc.colaborador_id = r.subordinado_id
                    AND nc.data_ocorrencia >= '{data_inicio}'
                    AND nc.data_ocorrencia <= {data_fim_sql}
                    AND nc.status <> 'Deferido'
                WHERE r.ativo = 1 AND sub.ativo = 1
                GROUP BY r.responsavel_id, r.subordinado_id, sub.nome, r.percentual_desconto
            ),
            agregado_subordinados AS (
                SELECT
                    responsavel_id,
                    SUM(qtd_ncs) AS qtd_ncs_subordinados,
                    SUM(qtd_ncs * percentual_desconto) AS soma_percentual_x_ncs
                FROM ncs_subordinados
                GROUP BY responsavel_id
            )
            SELECT 
                c.id AS colaborador_id,
                c.nome AS nome_colaborador,
                ISNULL(cc.salario_base, 0) AS salario_base,
                ISNULL(cc.percentual_desconto, 0) AS percentual_desconto,
                
                -- Por NC (mantém o próprio)
                ISNULL(cc.salario_base, 0) * ISNULL(cc.percentual_desconto, 0) / 100.0 AS valor_por_nc,
                
                -- NCs próprias
                ISNULL(np.qtd_ncs_proprias, 0) AS total_ncs_proprias,
                ISNULL(cc.salario_base, 0) * ISNULL(cc.percentual_desconto, 0) / 100.0 
                    * ISNULL(np.qtd_ncs_proprias, 0) AS valor_desconto_proprio,
                
                -- NCs subordinados
                ISNULL(ags.qtd_ncs_subordinados, 0) AS total_ncs_subordinados,
                ISNULL(cc.salario_base, 0) 
                    * ISNULL(ags.soma_percentual_x_ncs, 0) / 100.0 AS valor_desconto_subordinados,
                
                -- Consolidado
                ISNULL(np.qtd_ncs_proprias, 0) + ISNULL(ags.qtd_ncs_subordinados, 0) AS total_ncs,
                
                (ISNULL(cc.salario_base, 0) * ISNULL(cc.percentual_desconto, 0) / 100.0 
                    * ISNULL(np.qtd_ncs_proprias, 0))
                + (ISNULL(cc.salario_base, 0) 
                    * ISNULL(ags.soma_percentual_x_ncs, 0) / 100.0) AS valor_total_desconto,
                
                ISNULL(cc.salario_base, 0) 
                - (ISNULL(cc.salario_base, 0) * ISNULL(cc.percentual_desconto, 0) / 100.0 
                    * ISNULL(np.qtd_ncs_proprias, 0))
                - (ISNULL(cc.salario_base, 0) 
                    * ISNULL(ags.soma_percentual_x_ncs, 0) / 100.0) AS salario_final
            FROM dbo.colaboradores c
            LEFT JOIN dbo.comissoes_config cc ON c.id = cc.colaborador_id
            LEFT JOIN ncs_proprias np ON c.id = np.colaborador_id
            LEFT JOIN agregado_subordinados ags ON c.id = ags.responsavel_id
            WHERE c.ativo = 1
            ORDER BY c.nome
        """

        resultado = await executar_query(
            banco="Bddemo",
            query=query,
            params=(),
            usuario="SISTEMA",
            endpoint="/comissoes/relatorio"
        )

        if isinstance(resultado, dict):
            return resultado  # erro propagado

        # Enriquece cada linha com os detalhes dos subordinados
        if isinstance(resultado, list):
            for linha in resultado:
                salario_base = float(linha.get("salario_base") or 0)
                detalhes = await ComissaoService._detalhar_subordinados(
                    linha["colaborador_id"], data_inicio, data_fim_sql
                )
                # Calcula valor_desconto por subordinado
                for d in detalhes:
                    d["valor_desconto"] = (
                        salario_base * (d["percentual_relacao"] / 100.0) * d["total_ncs"]
                    )
                linha["detalhes_subordinados"] = detalhes

        return resultado

    @staticmethod
    async def _detalhar_subordinados(
        responsavel_id: int,
        data_inicio: str,
        data_fim_sql: str
    ) -> List[Dict[str, Any]]:
        """Busca detalhes de cada subordinado de um responsável no período"""
        query = f"""
            SELECT 
                sub.id AS subordinado_id,
                sub.nome AS nome_subordinado,
                r.percentual_desconto AS percentual_relacao,
                ISNULL(COUNT(nc.id), 0) AS total_ncs,
                ISNULL(SUM(1), 0) AS _dummy
            FROM dbo.colaboradores_responsaveis r
            INNER JOIN dbo.colaboradores sub ON r.subordinado_id = sub.id
            LEFT JOIN dbo.nao_conformidades_v2 nc
                ON nc.colaborador_id = r.subordinado_id
                AND nc.data_ocorrencia >= '{data_inicio}'
                AND nc.data_ocorrencia <= {data_fim_sql}
                AND nc.status <> 'Deferido'
            WHERE r.responsavel_id = ? AND r.ativo = 1 AND sub.ativo = 1
            GROUP BY sub.id, sub.nome, r.percentual_desconto
            ORDER BY sub.nome
        """

        resultado = await executar_query(
            banco="Bddemo",
            query=query,
            params=(responsavel_id,),
            usuario="SISTEMA",
            endpoint="/comissoes/relatorio"
        )

        if isinstance(resultado, dict) or not isinstance(resultado, list):
            return []

        # Remove _dummy e calcula valor_desconto no Python
        # (salario_base não está aqui, então valor unitário vem do responsável;
        #  por isso pegamos o salario_base do responsável depois no caller)

        return [
            {
                "subordinado_id": r["subordinado_id"],
                "nome_subordinado": r["nome_subordinado"],
                "percentual_relacao": float(r["percentual_relacao"] or 0),
                "total_ncs": int(r["total_ncs"] or 0),
                "valor_desconto": 0.0,  # preenchido no caller (precisa do salario_base)
            }
            for r in resultado
        ]
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
        Calcula a comissão do usuário logado (com breakdown hierárquico).

        Args:
            usuario_id: Pode ser o ID numérico OU o login do usuário
            mes: Mês para filtro (opcional)
            ano: Ano para filtro (opcional)

        Returns:
            Dict com os dados da comissão calculada + detalhes_subordinados
        """

        # ============================================================
        # Helpers internos
        # ============================================================
        def _resposta_vazia(mensagem_erro: str) -> Dict[str, Any]:
            """Retorno padrão pra erros — evita duplicação de dict"""
            return {
                "erro": mensagem_erro,
                "colaborador_id": None,
                "nome_colaborador": None,
                "salario_base": 0,
                "percentual_desconto": 0,
                "valor_por_nc": 0,
                "total_ncs_proprias": 0,
                "valor_desconto_proprio": 0,
                "total_ncs_subordinados": 0,
                "valor_desconto_subordinados": 0,
                "detalhes_subordinados": [],
                "total_ncs": 0,
                "valor_total_desconto": 0,
                "salario_final": 0,
                "periodo": {"mes": mes, "ano": ano},
                "ncs": []
            }

        def _filtro_periodo(campo_data: str) -> str:
            """Retorna o trecho SQL de filtro por período (mês/ano)"""
            if mes and ano:
                return f" AND MONTH({campo_data}) = ? AND YEAR({campo_data}) = ?"
            if mes:
                return f" AND MONTH({campo_data}) = ?"
            if ano:
                return f" AND YEAR({campo_data}) = ?"
            return ""

        def _params_periodo() -> list:
            """Retorna os parâmetros na mesma ordem que _filtro_periodo"""
            if mes and ano:
                return [mes, ano]
            if mes:
                return [mes]
            if ano:
                return [ano]
            return []

        # ============================================================
        # 1. Resolve o ID numérico do usuário (aceita login ou ID)
        # ============================================================
        if isinstance(usuario_id, str):
            resultado = await executar_query(
                banco="Bddemo",
                query="SELECT id FROM dbo.API_USUARIOS WHERE login = ? AND ativo = 1",
                params=(usuario_id,),
                usuario="SISTEMA",
                endpoint="/minha-comissao/resolver-usuario"
            )

            if not resultado or isinstance(resultado, dict) or len(resultado) == 0:
                return _resposta_vazia("Usuário não encontrado")

            usuario_id_numerico = resultado[0]["id"]
        else:
            usuario_id_numerico = usuario_id

        # ============================================================
        # 2. Busca o colaborador vinculado
        # ============================================================
        resultado = await executar_query(
            banco="Bddemo",
            query="SELECT id, nome FROM dbo.COLABORADORES WHERE usuario_id = ? AND ativo = 1",
            params=(usuario_id_numerico,),
            usuario="SISTEMA",
            endpoint="/minha-comissao/colaborador"
        )

        if not resultado or isinstance(resultado, dict) or len(resultado) == 0:
            return _resposta_vazia("Nenhum colaborador vinculado ao seu usuário")

        colaborador_id = resultado[0]["id"]
        nome_colaborador = resultado[0]["nome"]

        # ============================================================
        # 3. Busca a configuração de comissão
        # ============================================================
        resultado = await executar_query(
            banco="Bddemo",
            query="""
                SELECT salario_base, percentual_desconto
                FROM dbo.comissoes_config
                WHERE colaborador_id = ?
            """,
            params=(colaborador_id,),
            usuario="SISTEMA",
            endpoint="/minha-comissao/configuracao"
        )

        salario_base = 0.0
        percentual_desconto = 0.0

        if resultado and not isinstance(resultado, dict) and len(resultado) > 0:
            salario_base = float(resultado[0].get("salario_base") or 0)
            percentual_desconto = float(resultado[0].get("percentual_desconto") or 0)

        # ============================================================
        # 4. Busca NCs próprias (do colaborador)
        # ============================================================
        params_ncs = [colaborador_id] + _params_periodo()
        query_ncs = (
            "SELECT id, descricao, data_ocorrencia, status "
            "FROM dbo.nao_conformidades_v2 "
            "WHERE colaborador_id = ?"
            + _filtro_periodo("data_ocorrencia")
            + " ORDER BY data_ocorrencia DESC"
        )

        resultado = await executar_query(
            banco="Bddemo",
            query=query_ncs,
            params=tuple(params_ncs),
            usuario="SISTEMA",
            endpoint="/minha-comissao/ncs"
        )

        ncs = resultado if isinstance(resultado, list) else []
        ncs_debitadas = [nc for nc in ncs if nc.get("status") != "Deferido"]
        total_ncs_proprias = len(ncs_debitadas)

        # ============================================================
        # 5. Busca NCs de subordinados (agregado por subordinado)
        # ============================================================
        params_subs = _params_periodo() + [colaborador_id]
        query_subs = (
            "SELECT "
            "    r.subordinado_id, "
            "    sub.nome AS nome_subordinado, "
            "    r.percentual_desconto, "
            "    COUNT(nc.id) AS total_ncs "
            "FROM dbo.colaboradores_responsaveis r "
            "INNER JOIN dbo.colaboradores sub ON r.subordinado_id = sub.id "
            "LEFT JOIN dbo.nao_conformidades_v2 nc "
            "    ON nc.colaborador_id = r.subordinado_id "
            "    AND nc.status <> 'Deferido'"
            + _filtro_periodo("nc.data_ocorrencia")
            + " WHERE r.responsavel_id = ? AND r.ativo = 1 AND sub.ativo = 1 "
            "GROUP BY r.subordinado_id, sub.nome, r.percentual_desconto "
            "ORDER BY sub.nome"
        )

        resultado = await executar_query(
            banco="Bddemo",
            query=query_subs,
            params=tuple(params_subs),
            usuario="SISTEMA",
            endpoint="/minha-comissao/subordinados"
        )

        subordinados = resultado if isinstance(resultado, list) else []

        # ============================================================
        # 6. Calcula descontos (próprio + subordinados)
        # ============================================================
        valor_por_nc = (
            (salario_base * percentual_desconto) / 100
            if salario_base > 0 and percentual_desconto > 0
            else 0.0
        )
        valor_desconto_proprio = valor_por_nc * total_ncs_proprias

        detalhes_subordinados: List[Dict[str, Any]] = []
        valor_desconto_subordinados = 0.0

        for s in subordinados:
            perc_rel = float(s.get("percentual_desconto") or 0)
            ncs_sub = int(s.get("total_ncs") or 0)
            valor_sub = (salario_base * perc_rel / 100.0) * ncs_sub

            valor_desconto_subordinados += valor_sub
            detalhes_subordinados.append({
                "subordinado_id": s.get("subordinado_id"),
                "nome_subordinado": s.get("nome_subordinado"),
                "percentual_relacao": perc_rel,
                "total_ncs": ncs_sub,
                "valor_desconto": valor_sub,
            })

        total_ncs_subordinados = sum(d["total_ncs"] for d in detalhes_subordinados)
        valor_total_desconto = valor_desconto_proprio + valor_desconto_subordinados
        salario_final = salario_base - valor_total_desconto

        # ============================================================
        # 7. Retorno consolidado
        # ============================================================
        return {
            # Identificação
            "colaborador_id": colaborador_id,
            "nome_colaborador": nome_colaborador,

            # Config do próprio
            "salario_base": salario_base,
            "percentual_desconto": percentual_desconto,
            "valor_por_nc": valor_por_nc,

            # Breakdown NCs próprias
            "total_ncs_proprias": total_ncs_proprias,
            "valor_desconto_proprio": valor_desconto_proprio,

            # Breakdown NCs subordinados
            "total_ncs_subordinados": total_ncs_subordinados,
            "valor_desconto_subordinados": valor_desconto_subordinados,
            "detalhes_subordinados": detalhes_subordinados,

            # Consolidado
            "total_ncs": total_ncs_proprias + total_ncs_subordinados,
            "valor_total_desconto": valor_total_desconto,
            "salario_final": salario_final,

            # Extras
            "periodo": {"mes": mes, "ano": ano},
            "ncs": ncs_debitadas,
        }