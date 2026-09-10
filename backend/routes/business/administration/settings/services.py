"""
Serviços para o módulo de Configurações do Usuário.
Contém toda a lógica de negócio e queries SQL relacionadas a preferências.
"""
import json
import logging
from typing import Dict, Any, Optional
from database import executar_query

logger = logging.getLogger(__name__)


class SettingsService:
    """Classe de serviço para operações de configurações."""

    def __init__(self, usuario_logado: str):
        self.usuario_logado = usuario_logado
        logger.debug(f"SettingsService inicializado para usuário: {usuario_logado}")

    async def obter_preferencias(self) -> Dict[str, Any]:
        """
        Obtém as preferências salvas do usuário.
        Retorna dicionário vazio se não houver preferências salvas.
        """
        logger.debug(f"Buscando preferências do usuário: {self.usuario_logado}")
        
        try:
            query = "SELECT preferencias_json FROM API_USUARIOS WHERE login = ?"
            resultado = await executar_query(
                banco="Bddemo",
                query=query,
                params=(self.usuario_logado,),
                usuario=self.usuario_logado,
                endpoint="/api/usuario/preferencias"
            )
            
            logger.debug(f"Resultado da query: {resultado}")
            
            if resultado and resultado[0].get("preferencias_json"):
                preferencias = json.loads(resultado[0]["preferencias_json"])
                logger.info(f"Preferências encontradas para {self.usuario_logado}")
                logger.debug(f"Conteúdo: {preferencias}")
                return preferencias
            else:
                logger.debug(
                    f"Nenhuma preferência encontrada para {self.usuario_logado}. "
                    "Retornando dicionário vazio."
                )
                return {}
                
        except json.JSONDecodeError as e:
            logger.error(
                f"Erro ao decodificar JSON das preferências do usuário "
                f"{self.usuario_logado}: {str(e)}"
            )
            return {}
        except Exception as e:
            logger.error(
                f"Erro ao obter preferências do usuário {self.usuario_logado}: {str(e)}"
            )
            return {}

    async def salvar_preferencias(self, preferencias: Dict[str, Any]) -> bool:
        """
        Salva as preferências do usuário no banco de dados.
        Retorna True se sucesso, False caso contrário.
        """
        logger.debug(f"Salvando preferências do usuário: {self.usuario_logado}")
        logger.debug(f"Preferências a serem salvas: {preferencias}")
        
        try:
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
            
            if sucesso is True:
                logger.info(f"Preferências salvas com sucesso para {self.usuario_logado}")
            else:
                logger.warning(
                    f"Falha ao salvar preferências para {self.usuario_logado}. "
                    f"Retorno: {sucesso}"
                )
            
            return sucesso is True
            
        except json.JSONEncodeError as e:
            logger.error(
                f"Erro ao codificar preferências em JSON para "
                f"{self.usuario_logado}: {str(e)}"
            )
            return False
        except Exception as e:
            logger.error(
                f"Erro ao salvar preferências do usuário {self.usuario_logado}: {str(e)}"
            )
            return False