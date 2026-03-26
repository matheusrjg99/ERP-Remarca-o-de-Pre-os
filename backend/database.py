import pyodbc
import os
from typing import List, Dict, Any, Optional

class Sql:
    def __init__(self, banco_dados: str):
        # Em produção, usaremos variáveis de ambiente. Por enquanto, mantemos seu IP.
        self.servidor = '192.168.0.254'
        self.usuario = 'microuni'
        self.senha = 'microuni'
        self.banco_dados = banco_dados

    def get_connection(self):
        try:
            conn_str = (
                f"DRIVER={{SQL Server}};"
                f"SERVER={self.servidor};"
                f"DATABASE={self.banco_dados};"
                f"UID={self.usuario};"
                f"PWD={self.senha};"
                "Connection Timeout=30;"
            )
            return pyodbc.connect(conn_str)
        except Exception as e:
            print(f"Erro de conexão com o banco {self.banco_dados}: {e}")
            return None

def executar_query(
    banco: str, 
    query: str, 
    params: tuple = None, 
    usuario: str = "SISTEMA", 
    endpoint: str = "/",
    is_select: bool = True
) -> Any:
    """
    Executa comandos SQL com auditoria automática e legível na tabela API_LOGS.
    """
    db_manager = Sql(banco)
    conn = db_manager.get_connection()
    
    if not conn:
        return {"erro": "Falha na conexão com o banco de dados"}

    try:
        cursor = conn.cursor()
        
        # 1. Executa a query principal
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)

        # 2. Processa o resultado se for SELECT
        resultado = None
        if is_select:
            columns = [column[0] for column in cursor.description]
            resultado = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        # 3. REGISTRO DE LOG (AUDITORIA INTELIGENTE E LEGÍVEL)
        deve_gravar_log = (not is_select) or ("/nf/" in endpoint) or ("/notas" in endpoint)
        
        if deve_gravar_log:
            # TRADUTOR DE LOGS: Transforma a ação em um texto humano
            detalhes_log = "Ação registrada." # Texto padrão
            
            if params:
                if "/api/remarcar" in endpoint:
                    # params = (novo_preco, codigo)
                    detalhes_log = f"Produto: {params[1]} | Alterou Preço de Venda para R$ {params[0]}"
                
                elif "/api/atualizar-custo" in endpoint:
                    # params = (novo_custo, codigo)
                    detalhes_log = f"Produto: {params[1]} | Alterou Custo para R$ {params[0]}"
                
                elif "/api/atualizar-mkp" in endpoint:
                    # params = (novo_mkp, novo_mkp, codigo)
                    detalhes_log = f"Produto: {params[2]} | Alterou Markup para {params[0]}%"
                
                elif "/api/usuarios/cadastro" in endpoint:
                    # params = (login, hash, nome, nivel)
                    detalhes_log = f"Cadastrou o usuário: {params[0]} (Nível: {params[3]})"
                    
                elif "/api/usuarios/status" in endpoint:
                    # params = (ativo, login)
                    status_str = "ATIVO" if params[0] == 1 else "INATIVO"
                    detalhes_log = f"Alterou o status do usuário '{params[1]}' para {status_str}"
                    
                elif "/nf/" in endpoint or "/notas" in endpoint:
                    # Consulta de notas
                    detalhes_log = f"Consultou dados da Ordem/Nota: {params[0]}"
                else:
                    # Caso seja uma rota nova não mapeada, salva os parâmetros crus pra não perder o dado
                    detalhes_log = f"Parâmetros alterados: {str(params)}"

            tipo_op = "CONSULTA_NOTA" if is_select else "ESCRITA/UPDATE"
            
            log_query = """
            INSERT INTO API_LOGS (data_hora, usuario_login, operacao, banco_destino, endpoint, detalhes)
                VALUES (DATEADD(HOUR, -3, GETUTCDATE()), ?, ?, ?, ?, ?)
            """
            cursor.execute(log_query, (usuario, tipo_op, banco, endpoint, detalhes_log))
        
        conn.commit()
        return resultado if is_select else True

    except Exception as e:
        conn.rollback()
        print(f"Erro na operação: {e}")
        return {"erro": str(e)}
    finally:
        cursor.close()
        conn.close()