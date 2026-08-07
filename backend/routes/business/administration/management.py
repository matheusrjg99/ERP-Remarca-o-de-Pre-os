"""
Rotas de Administração - Logs do Sistema
Módulo Business/Administration: Responsável pela gestão administrativa e logs do sistema.
"""
from fastapi import APIRouter, Depends, Query
from fastapi.security import OAuth2PasswordBearer
from typing import Optional

from database import executar_query

router = APIRouter(prefix="/admin", tags=["Administração Geral"])

AMBIENTES = {
    "producao": "Bdenter",
    "demo": "bddemo",
    "treina": "bdtreina"
}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def exigir_admin(token: str = Depends(oauth2_scheme)):
    """Dependência para validar se o usuário é Administrador."""
    from jose import jwt, JWTError
    from auth.seguranca import SECRET_KEY, ALGORITHM
    from fastapi import status, HTTPException
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        nivel: str = payload.get("nivel")
        if nivel != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Acesso negado. Recurso exclusivo para administradores."
            )
        return payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.get("/logs")
async def consultar_logs(
    data_inicio: Optional[str] = "",
    data_fim: Optional[str] = "",
    usuario_filtro: Optional[str] = "",
    operacao: Optional[str] = "",
    termo: Optional[str] = "",
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    admin_slug: str = Depends(exigir_admin)
):
    """Consulta logs do sistema com filtros (Apenas ADMIN)."""
    db_name = AMBIENTES[ambiente]
    
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

    dados = await executar_query(
        banco=db_name, 
        query=query, 
        params=tuple(params), 
        usuario=admin_slug, 
        endpoint="/api/logs"
    )
    
    return dados if dados else []
