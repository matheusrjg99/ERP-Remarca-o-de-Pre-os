"""Services para o módulo de Precificação de Produtos.

Contém toda a regra de negócio, construção de queries SQL e tratamento de erros lógicos.
Nenhuma lógica de HTTP ou FastAPI deve residir aqui.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from backend.database import executar_query
from fastapi import HTTPException


class ProdutoService:
    """Lógica de negócio para precificação de produtos."""

    @staticmethod
    def _construir_query_filtros(filtros: Dict[str, Any]) -> tuple[str, list]:
        """Constrói dinamicamente a cláusula WHERE baseada nos filtros fornecidos."""
        query_base = "SELECT * FROM API_PRODUTOS WHERE 1=1"
        params = []

        if filtros.get("produto_id"):
            query_base += " AND produto_id = ?"
            params.append(filtros["produto_id"])
        
        if filtros.get("descricao"):
            query_base += " AND descricao LIKE ?"
            params.append(f"%{filtros['descricao']}%")
        
        if filtros.get("grupo"):
            query_base += " AND grupo = ?"
            params.append(filtros["grupo"])
        
        if filtros.get("subgrupo"):
            query_base += " AND subgrupo = ?"
            params.append(filtros["subgrupo"])
        
        if filtros.get("marca"):
            query_base += " AND marca = ?"
            params.append(filtros["marca"])
        
        if filtros.get("fornecedor_id"):
            query_base += " AND fornecedor_id = ?"
            params.append(filtros["fornecedor_id"])
        
        if filtros.get("ativo") is not None:
            query_base += " AND ativo = ?"
            params.append(filtros["ativo"])

        # Ordenação padrão
        query_base += " ORDER BY descricao ASC"

        return query_base, params

    async def listar_produtos(self, filtros: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Lista produtos com precificação aplicando filtros opcionais."""
        filtros = filtros or {}
        
        query, params = self._construir_query_filtros(filtros)
        
        resultado = await executar_query(
            banco="microuni",
            query=query,
            params=tuple(params) if params else None,
            is_select=True
        )
        
        if isinstance(resultado, dict) and "erro" in resultado:
            raise HTTPException(status_code=500, detail=f"Erro ao consultar produtos: {resultado['erro']}")
        
        return resultado if resultado else []

    async def obter_produto_detalhe(self, produto_id: int) -> Dict[str, Any]:
        """Obtém detalhes completos de um único produto."""
        query = """
            SELECT * FROM API_PRODUTOS 
            WHERE produto_id = ?
        """
        
        resultado = await executar_query(
            banco="microuni",
            query=query,
            params=(produto_id,),
            is_select=True
        )
        
        if isinstance(resultado, dict) and "erro" in resultado:
            raise HTTPException(status_code=500, detail=f"Erro ao buscar produto: {resultado['erro']}")
        
        if not resultado:
            raise HTTPException(status_code=404, detail="Produto não encontrado.")
        
        return resultado[0]

    async def recalcular_precificacao(
        self, 
        produto_ids: Optional[List[int]], 
        novo_custo: Optional[float], 
        nova_margem: Optional[float],
        justifica: str,
        usuario_id: int
    ) -> Dict[str, Any]:
        """
        Executa o recálculo de precificação.
        Regra de negócio: 
        - Se custo/margem forem fornecidos, atualiza antes de calcular preço.
        - Registra log da alteração.
        """
        try:
            # Construção dinâmica do WHERE para os IDs
            if produto_ids:
                placeholders = ','.join(['?'] * len(produto_ids))
                where_clause = f"AND produto_id IN ({placeholders})"
                params_ids = list(produto_ids)
            else:
                where_clause = ""
                params_ids = []

            # 1. Atualizar custos/margens se fornecidos
            updates = []
            update_params = []
            
            if novo_custo is not None:
                updates.append("custo_atual = ?")
                update_params.append(novo_custo)
            
            if nova_margem is not None:
                updates.append("margem_atual = ?")
                update_params.append(nova_margem)
            
            if updates:
                update_params.extend(params_ids)
                update_params.append(usuario_id)
                
                query_update = f"""
                    UPDATE API_PRODUTOS 
                    SET {', '.join(updates)},
                        ultima_atualizacao = GETDATE(),
                        usuario_alteracao = ?
                    WHERE 1=1 {where_clause}
                """
                
                result_update = await executar_query(
                    banco="microuni",
                    query=query_update,
                    params=tuple(update_params),
                    is_select=False
                )
                
                if isinstance(result_update, dict) and "erro" in result_update:
                    raise HTTPException(status_code=500, detail=f"Erro ao atualizar custos: {result_update['erro']}")

            # 2. Recalcular preço de venda (Exemplo: Custo * (1 + Margem/100))
            query_recalculo = f"""
                UPDATE API_PRODUTOS 
                SET preco_venda = ROUND(custo_atual * (1 + (margem_atual / 100)), 2),
                    ultima_atualizacao = GETDATE(),
                    usuario_alteracao = ?
                WHERE 1=1 {where_clause}
            """
            params_recalculo = params_ids + [usuario_id]
            
            result_recalculo = await executar_query(
                banco="microuni",
                query=query_recalculo,
                params=tuple(params_recalculo),
                is_select=False
            )
            
            if isinstance(result_recalculo, dict) and "erro" in result_recalculo:
                raise HTTPException(status_code=500, detail=f"Erro ao recalcular preços: {result_recalculo['erro']}")
            
            # 3. Registrar Log (Assumindo tabela API_LOGS existente)
            detalhes_log = json.dumps({
                "acao": "recalculo_precificacao",
                "produto_ids": produto_ids,
                "novo_custo": novo_custo,
                "nova_margem": nova_margem,
                "justificativa": justifica
            })
            
            query_log = """
                INSERT INTO API_LOGS (usuario_id, acao, tabela_afetada, detalhes, data_ocorrencia)
                VALUES (?, ?, ?, ?, GETDATE())
            """
            
            result_log = await executar_query(
                banco="microuni",
                query=query_log,
                params=(usuario_id, "RECALCULO_PRECO", "API_PRODUTOS", detalhes_log),
                is_select=False
            )
            
            if isinstance(result_log, dict) and "erro" in result_log:
                raise HTTPException(status_code=500, detail=f"Erro ao registrar log: {result_log['erro']}")
            
            return {
                "mensagem": "Precificação recalculada com sucesso.",
                "afetados": len(produto_ids) if produto_ids else 0
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao recalcular precificação: {str(e)}")

    async def exportar_produtos(self, formato: str, filtros: Optional[Dict[str, Any]]) -> bytes:
        """
        Gera arquivo de exportação.
        Implementação simplificada retornando dados brutos; em produção, usaria bibliotecas como pandas/openpyxl.
        """
        # Reutiliza a lógica de listagem
        dados = await self.listar_produtos(filtros)
        
        if formato.upper() == "JSON":
            return json.dumps(dados).encode('utf-8')
        
        # Fallback para CSV simples
        if not dados:
            return b""
        
        linhas = []
        cabecalho = ",".join(str(k) for k in dados[0].keys())
        linhas.append(cabecalho)
        
        for item in dados:
            linha = ",".join(str(v) for v in item.values())
            linhas.append(linha)
            
        return "\n".join(linhas).encode('utf-8')
