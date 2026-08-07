from functools import wraps
from fastapi import HTTPException, status, Request, Depends
from jose import jwt, JWTError
from datetime import datetime
import os

# Chave secreta (deve ser a mesma do auth/seguranca.py)
SECRET_KEY = "chave_secreta_provisoria_mudar_depois"
ALGORITHM = "HS256"

async def get_current_user_permissions(request: Request):
    """Extrai e valida o token, retornando as permissões do usuário."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas ou ausentes",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_login: str = payload.get("sub")
        permissions: list = payload.get("permissions", [])
        
        if user_login is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return {"user_login": user_login, "permissions": permissions}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado ou inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

def requer_permissao(permission_code: str):
    """
    Decorador para proteger rotas exigindo uma permissão específica.
    Uso: @router.get("/rota", dependencies=[Depends(requer_permissao("nc_criar"))])
    """
    async def permission_checker(request: Request):
        user_data = await get_current_user_permissions(request)
        
        # Se for admin (superusuário), libera tudo
        if "admin_total" in user_data["permissions"]:
            return user_data
            
        if permission_code not in user_data["permissions"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Permissão necessária: {permission_code}",
            )
            
        return user_data
        
    return permission_checker
