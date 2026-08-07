"""
Rotas de Configurações do Usuário - Preferências
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

from database import executar_query

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def obter_usuario_atual(token: str = Depends(oauth2_scheme)):
    """Extrai o usuário do token JWT."""
    from jose import jwt, JWTError
    from auth.seguranca import SECRET_KEY, ALGORITHM
    from fastapi import status, HTTPException
    
    credenciais_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario: str = payload.get("sub")
        if usuario is None:
            raise credenciais_exception
        return usuario
    except JWTError:
        raise credenciais_exception

class PreferenciasUpdate(BaseModel):
    preferencias: dict

@router.get("/preferencias")
async def obter_preferencias(usuario_logado: str = Depends(obter_usuario_atual)):
    """Obtém as preferências salvas do usuário."""
    import json
    
    query = "SELECT preferencias_json FROM API_USUARIOS WHERE login = ?"
    res = await executar_query(
        banco="Bddemo", 
        query=query, 
        params=(usuario_logado,), 
        usuario=usuario_logado, 
        endpoint="/api/usuario/preferencias"
    )
    
    if res and res[0].get("preferencias_json"):
        return json.loads(res[0]["preferencias_json"])
    return {}

@router.put("/preferencias")
async def salvar_preferencias(dados: PreferenciasUpdate, usuario_logado: str = Depends(obter_usuario_atual)):
    """Salva as preferências do usuário."""
    import json
    
    json_str = json.dumps(dados.preferencias)
    query = "UPDATE API_USUARIOS SET preferencias_json = ? WHERE login = ?"
    sucesso = await executar_query(
        banco="Bddemo", 
        query=query, 
        params=(json_str, usuario_logado), 
        is_select=False, 
        usuario=usuario_logado, 
        endpoint="/api/usuario/preferencias"
    )
    
    if sucesso is True:
        return {"status": "sucesso"}
    raise HTTPException(status_code=500, detail="Erro ao salvar preferências.")
