"""
Serviços para o módulo de Configurações do Usuário.
Contém toda a lógica de negócio e queries SQL relacionadas a preferências.
"""
import json
from typing import Dict, Any, Optional
from database import executar_query


class SettingsService:
    """Classe de serviço para operações de configurações."""

    def __init__(self, usuario_logado: str):
        self.usuario_logado = usuario_logado

    async def obter_preferencias(self) -> Dict[str, Any]:
        """
        Obtém as preferências salvas do usuário.
        Retorna dicionário vazio se não houver preferências salvas.
        """
        query = "SELECT preferencias_json FROM API_USUARIOS WHERE login = ?"
        resultado = await executar_query(
            banco="Bddemo",
            query=query,
            params=(self.usuario_logado,),
            usuario=self.usuario_logado,
            endpoint="/api/usuario/preferencias"
        )
        
        if resultado and resultado[0].get("preferencias_json"):
            return json.loads(resultado[0]["preferencias_json"])
        return {}

    async def salvar_preferencias(self, preferencias: Dict[str, Any]) -> bool:
        """
        Salva as preferências do usuário no banco de dados.
        Retorna True se sucesso, False caso contrário.
        """
        json_str = json.dumps(preferencias)
        query = "UPDATE API_USUARIOS SET preferencias_json = ? WHERE login = ?"
        params = (json_str, self.usuario_logado)
        
        sucesso = await executar_query(
            banco="Bddemo",
            query=query,
            params=params,
            is_select=False,
            usuario=self.usuario_logado,
            endpoint="/api/usuario/preferencias"
        )
        return sucesso is True
