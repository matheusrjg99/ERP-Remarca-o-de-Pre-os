"""
Serviços de Autenticação - Lógica de Negócio
Módulo Core: Responsável pelas regras de autenticação e comunicação com o banco.
"""
from fastapi import HTTPException, status
from jose import jwt, JWTError

from database import executar_query
from auth.seguranca import (
    verificar_senha, 
    criar_token_acesso, 
    obter_permissoes_usuario, 
    SECRET_KEY, 
    ALGORITHM
)
from .schemas import LoginData, TokenData, UsuarioInfo, UsuarioSistema


class AuthService:
    """Classe de serviço para operações de autenticação."""
    
    @staticmethod
    async def autenticar_usuario(dados: LoginData) -> dict:
        """
        Autentica um usuário e retorna dados para geração do token.
        
        Args:
            dados: Dados de login (login e senha)
            
        Returns:
            dict: Dados do usuário autenticado
            
        Raises:
            HTTPException: Se usuário não encontrado ou senha incorreta
        """
        query = "SELECT login, senha_hash, cargo_id, nome FROM API_USUARIOS WHERE login = ? AND ativo = 1"
        resultado = await executar_query(
            banco="Bddemo", 
            query=query, 
            params=(dados.login,), 
            usuario="SISTEMA", 
            endpoint="/auth/login"
        )
        
        if not resultado or not isinstance(resultado, list):
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        
        usuario_db = resultado[0]
        
        if not verificar_senha(dados.senha, usuario_db["senha_hash"]):
            raise HTTPException(status_code=401, detail="Senha incorreta")
        
        # Buscar permissões do usuário baseado no cargo
        permissoes = await obter_permissoes_usuario(usuario_db["login"])
        
        return {
            "login": usuario_db["login"],
            "nome": usuario_db.get("nome", ""),
            "cargo": usuario_db.get("cargo_id"),
            "permissoes": permissoes
        }
    
    @staticmethod
    async def gerar_token(usuario_data: dict) -> str:
        """
        Gera token JWT com base nos dados do usuário.
        
        Args:
            usuario_data: Dados do usuário autenticado
            
        Returns:
            str: Token JWT
        """
        token_jwt = criar_token_acesso(dados={
            "sub": usuario_data["login"],
            "permissoes": usuario_data["permissoes"],
            "nome": usuario_data["nome"],
            "cargo": usuario_data["cargo"]
        })
        return token_jwt
    
    @staticmethod
    async def listar_usuarios_sistema() -> list:
        """
        Lista todos usuários ativos do sistema.
        
        Returns:
            list: Lista de usuários com informações básicas
        """
        query = """
            SELECT 
                u.id, 
                u.login as username, 
                u.nome,
                u.cargo_id,
                c.nome as cargo_nome
            FROM dbo.API_USUARIOS u
            LEFT JOIN dbo.cargos c ON u.cargo_id = c.id AND c.ativo = 1
            WHERE u.ativo = 1 
            ORDER BY u.nome
        """
        resultado = await executar_query(
            banco="Bddemo",
            query=query,
            params=(),
            usuario="SISTEMA",
            endpoint="/auth/usuarios"
        )
        
        if isinstance(resultado, dict) and "erro" in resultado:
            raise HTTPException(status_code=500, detail=resultado["erro"])
        
        return resultado if resultado else []
    
    @staticmethod
    async def obter_dados_usuario(login: str) -> dict:
        """
        Obtém dados completos de um usuário pelo login.
        
        Args:
            login: Login do usuário
            
        Returns:
            dict: Dados do usuário
            
        Raises:
            HTTPException: Se usuário não encontrado
        """
        query = "SELECT id, login, nome, email, cargo_id FROM API_USUARIOS WHERE login = ? AND ativo = 1"
        resultado = await executar_query(
            banco="Bddemo",
            query=query,
            params=(login,),
            usuario="SISTEMA",
            endpoint="/auth/meus-dados"
        )
        
        if not resultado:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        return resultado[0]
    
    @staticmethod
    async def validar_token(token: str) -> TokenData:
        """
        Valida e decodifica um token JWT.
        
        Args:
            token: Token JWT a ser validado
            
        Returns:
            TokenData: Dados decodificados do token
            
        Raises:
            HTTPException: Se token inválido ou expirado
        """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            login: str = payload.get("sub")
            
            if login is None:
                raise HTTPException(status_code=401, detail="Token inválido")
            
            return TokenData(
                sub=payload.get("sub"),
                permissoes=payload.get("permissoes", []),
                nome=payload.get("nome"),
                cargo=payload.get("cargo")
            )
        except JWTError:
            raise HTTPException(status_code=401, detail="Token expirado ou inválido")
