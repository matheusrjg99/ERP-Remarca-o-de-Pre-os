"""Services para o módulo de Precificação de Produtos.

Contém toda a regra de negócio, construção de queries SQL e tratamento de erros lógicos.
Nenhuma lógica de HTTP ou FastAPI deve residir aqui.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import json

# Assumindo que temos um pool de conexão ou utilitário de DB global
# Em produção, isso viria de injeção de dependência ou config centralizada
from backend.database.connection import get_db_connection 
from fastapi import HTTPException


class ProdutoService:
    """Lógica de negócio para precificação de produtos."""

    @staticmethod
    def _construir_query_filtros(filtros: Dict[str, Any]) -> tuple[str, list]:
        """Constrói dinamicamente a cláusula WHERE baseada nos filtros fornecidos."""
        query_base = "SELECT * FROM API_PRODUTOS WHERE 1=1"
        params = []

        if filtros.get("produto_id"):
            query_base += " AND produto_id = %s"
            params.append(filtros["produto_id"])
        
        if filtros.get("descricao"):
            query_base += " AND descricao ILIKE %s"
            params.append(f"%{filtros['descricao']}%")
        
        if filtros.get("grupo"):
            query_base += " AND grupo = %s"
            params.append(filtros["grupo"])
        
        if filtros.get("subgrupo"):
            query_base += " AND subgrupo = %s"
            params.append(filtros["subgrupo"])
        
        if filtros.get("marca"):
            query_base += " AND marca = %s"
            params.append(filtros["marca"])
        
        if filtros.get("fornecedor_id"):
            query_base += " AND fornecedor_id = %s"
            params.append(filtros["fornecedor_id"])
        
        if filtros.get("ativo") is not None:
            query_base += " AND ativo = %s"
            params.append(filtros["ativo"])

        # Ordenação padrão
        query_base += " ORDER BY descricao ASC"

        return query_base, params

    async def listar_produtos(self, filtros: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Lista produtos com precificação aplicando filtros opcionais."""
        filtros = filtros or {}
        
        query, params = self._construir_query_filtros(filtros)
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, params)
            resultados = cursor.fetchall()
            cursor.close()
            return resultados
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao consultar produtos: {str(e)}")
        finally:
            conn.close()

    async def obter_produto_detalhe(self, produto_id: int) -> Dict[str, Any]:
        """Obtém detalhes completos de um único produto."""
        query = """
            SELECT * FROM API_PRODUTOS 
            WHERE produto_id = %s
        """
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, (produto_id,))
            resultado = cursor.fetchone()
            cursor.close()
            
            if not resultado:
                raise HTTPException(status_code=404, detail="Produto não encontrado.")
            
            return resultado
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao buscar produto: {str(e)}")
        finally:
            conn.close()

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
        conn = get_db_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            
            # Construção dinâmica do WHERE para os IDs
            if produto_ids:
                placeholders = ','.join(['%s'] * len(produto_ids))
                where_clause = f"AND produto_id IN ({placeholders})"
                params_ids = produto_ids
            else:
                where_clause = ""
                params_ids = []

            # 1. Atualizar custos/margens se fornecidos
            updates = []
            update_params = []
            
            if novo_custo is not None:
                updates.append("custo_atual = %s")
                update_params.append(novo_custo)
            
            if nova_margem is not None:
                updates.append("margem_atual = %s")
                update_params.append(nova_margem)
            
            if updates:
                update_params.extend(params_ids) # Adiciona os IDs no final
                query_update = f"""
                    UPDATE API_PRODUTOS 
                    SET {', '.join(updates)},
                        ultima_atualizacao = NOW(),
                        usuario_alteracao = %s
                    WHERE 1=1 {where_clause}
                """
                update_params.append(usuario_id)
                cursor.execute(query_update, update_params)
            
            # 2. Recalcular preço de venda (Exemplo: Custo * (1 + Margem/100))
            # Nota: Ajuste a fórmula conforme a regra real do negócio
            query_recalculo = f"""
                UPDATE API_PRODUTOS 
                SET preco_venda = ROUND(custo_atual * (1 + (margem_atual / 100)), 2),
                    ultima_atualizacao = NOW(),
                    usuario_alteracao = %s
                WHERE 1=1 {where_clause}
            """
            params_recalculo = params_ids + [usuario_id]
            cursor.execute(query_recalculo, params_recalculo)
            
            # 3. Registrar Log (Assumindo tabela API_LOGS existente)
            query_log = """
                INSERT INTO API_LOGS (usuario_id, acao, tabela_afetada, detalhes, data_ocorrencia)
                VALUES (%s, %s, %s, %s, NOW())
            """
            detalhes_log = json.dumps({
                "acao": "recalculo_precificacao",
                "produto_ids": produto_ids,
                "novo_custo": novo_custo,
                "nova_margem": nova_margem,
                "justificativa": justifica
            })
            cursor.execute(query_log, (usuario_id, "RECALCULO_PRECO", "API_PRODUTOS", detalhes_log))
            
            conn.commit()
            cursor.close()
            
            return {
                "mensagem": "Precificação recalculada com sucesso.",
                "afetados": cursor.rowcount if hasattr(cursor, 'rowcount') else 0 # Nota: rowcount pode variar dependendo do driver
            }
            
        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=500, detail=f"Erro ao recalcular precificação: {str(e)}")
        finally:
            conn.close()

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
        cabecalho = ",".join(dados[0].keys())
        linhas.append(cabecalho)
        
        for item in dados:
            linha = ",".join(str(v) for v in item.values())
            linhas.append(linha)
            
        return "\n".join(linhas).encode('utf-8')
