"""
Serviços para o módulo de Logs do Sistema.
Contém toda a lógica de negócio e queries SQL relacionadas a logs.
"""
from typing import List, Dict, Any, Optional
from database import executar_query


class LogService:
    """Classe de serviço para operações de logs."""

    # Mapeamento de ambientes para bancos de dados
    AMBIENTES = {
        "producao": "Bdenter",
        "demo": "Bddemo",
        "treina": "Bdtreina"
    }

    def __init__(self, usuario_logado: str):
        self.usuario_logado = usuario_logado

    async def consultar_logs(
        self,
        data_inicio: Optional[str] = None,
        data_fim: Optional[str] = None,
        usuario_filtro: Optional[str] = None,
        operacao: Optional[str] = None,
        termo: Optional[str] = None,
        ambiente: str = "treina"
    ) -> List[Dict[str, Any]]:
        """
        Consulta logs do sistema com filtros dinâmicos.
        Retorna lista de dicionários com registros de log.
        """
        db_name = self.AMBIENTES.get(ambiente, "Bdtreina")
        
        query = """
            SELECT TOP 500 
                id, 
                CONVERT(varchar, data_hora, 120) as data_hora, 
                usuario_login, 
                operacao, 
                banco_destino, 
                endpoint, 
                detalhes 
            FROM API_LOGS 
            WHERE 1=1
        """
        params = []

        if data_inicio:
            query += " AND data_hora >= ?"
            params.append(f"{data_inicio} 00:00:00")
            
        if data_fim:
            query += " AND data_hora <= ?"
            params.append(f"{data_fim} 23:59:59")
            
        if usuario_filtro:
            query += " AND usuario_login LIKE ?"
            params.append(f"%{usuario_filtro}%")
            
        if operacao:
            query += " AND operacao = ?"
            params.append(operacao)
            
        if termo:
            query += " AND detalhes LIKE ?"
            params.append(f"%{termo}%")

        query += " ORDER BY id DESC"

        resultado = await executar_query(
            banco=db_name,
            query=query,
            params=tuple(params),
            usuario=self.usuario_logado,
            endpoint="/api/logs"
        )
        
        return resultado if resultado else []
