import aioodbc
import os
from typing import List, Dict, Any, Optional

class Sql:
    def __init__(self, banco_dados: str):
        # Em produção, usaremos variáveis de ambiente. Por enquanto, mantemos seu IP.
        self.servidor = '192.168.0.254'
        self.usuario = 'microuni'
        self.senha = 'microuni'
        self.banco_dados = banco_dados

    # MUDANÇA 1: Transformamos em async def
    async def get_connection(self):
        try:
            conn_str = (
                f"DRIVER={{SQL Server}};"
                f"SERVER={self.servidor};"
                f"DATABASE={self.banco_dados};"
                f"UID={self.usuario};"
                f"PWD={self.senha};"
                "Connection Timeout=30;"
            )
            # MUDANÇA 2: Usamos await e passamos a string no parâmetro dsn
            return await aioodbc.connect(dsn=conn_str)
        except Exception as e:
            # Mantive o print apenas para erros graves de conexão
            print(f"Erro de conexão com o banco {self.banco_dados}: {e}")
            return None

# MUDANÇA 3: A função inteira vira async
async def executar_query(
    banco: str, 
    query: str, 
    params: tuple = None, 
    usuario: str = "SISTEMA", 
    endpoint: str = "/",
    is_select: bool = True
) -> Any:
    """
    Executa comandos SQL com auditoria automática e legível na tabela API_LOGS (Assíncrono).
    """
    db_manager = Sql(banco)
    
    # MUDANÇA 4: Precisamos aguardar a conexão abrir
    conn = await db_manager.get_connection()
    
    if not conn:
        return {"erro": "Falha na conexão com o banco de dados"}

    try:
        # MUDANÇA 5: Aguardar a criação do cursor
        cursor = await conn.cursor()
        
        # 1. Executa a query principal (Aguardando)
        if params:
            await cursor.execute(query, params)
        else:
            await cursor.execute(query)

        # 2. Processa o resultado se for SELECT
        resultado = None
        if is_select:
            columns = [column[0] for column in cursor.description]
            # MUDANÇA 6: Aguardar a busca das linhas
            linhas = await cursor.fetchall()
            resultado = [dict(zip(columns, row)) for row in linhas]
        
        # 3. REGISTRO DE LOG (AUDITORIA INTELIGENTE E LEGÍVEL)
        deve_gravar_log = (not is_select) or ("/nf/" in endpoint) or ("/notas" in endpoint)
        
        if deve_gravar_log:
            # TRADUTOR DE LOGS: Transforma a ação em um texto humano
            detalhes_log = "Ação registrada." # Texto padrão
            
            if params:
                if "/api/remarcar" in endpoint:
                    detalhes_log = f"Produto: {params[1]} | Alterou Preço de Venda para R$ {params[0]}"
                
                elif "/api/atualizar-custo" in endpoint:
                    detalhes_log = f"Produto: {params[1]} | Alterou Custo para R$ {params[0]}"
                
                elif "/api/atualizar-mkp" in endpoint:
                    detalhes_log = f"Produto: {params[2]} | Alterou Markup para {params[0]}%"
                
                elif "/api/usuarios/cadastro" in endpoint:
                    detalhes_log = f"Cadastrou o usuário: {params[0]} (Nível: {params[3]})"
                    
                elif "/api/usuarios/status" in endpoint:
                    status_str = "ATIVO" if params[0] == 1 else "INATIVO"
                    detalhes_log = f"Alterou o status do usuário '{params[1]}' para {status_str}"
                    
                elif "/nf/" in endpoint or "/notas" in endpoint:
                    detalhes_log = f"Consultou dados da Ordem/Nota: {params[0]}"
                else:
                    detalhes_log = f"Parâmetros alterados: {str(params)}"

            tipo_op = "CONSULTA_NOTA" if is_select else "ESCRITA/UPDATE"
            
            log_query = """
            INSERT INTO API_LOGS (data_hora, usuario_login, operacao, banco_destino, endpoint, detalhes)
                VALUES (DATEADD(HOUR, -3, GETUTCDATE()), ?, ?, ?, ?, ?)
            """
            # MUDANÇA 7: Aguardar a inserção do log
            await cursor.execute(log_query, (usuario, tipo_op, banco, endpoint, detalhes_log))
        
        # MUDANÇA 8: Aguardar o commit
        await conn.commit()
        return resultado if is_select else True

    except Exception as e:
        # MUDANÇA 9: Aguardar o rollback
        await conn.rollback()
        print(f"Erro na operação do banco: {e}")
        return {"erro": str(e)}
    finally:
        # MUDANÇA 10: Aguardar o fechamento das portas
        await cursor.close()
        await conn.close()