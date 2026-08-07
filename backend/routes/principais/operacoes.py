"""
Rotas de Operações - Atualizações de Preço, Custo e Markup
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer

from database import executar_query
from sql_repo import Scripts

router = APIRouter()

AMBIENTES = {
    "producao": "Bdenter",
    "demo": "bddemo",
    "treina": "bdtreina"
}

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

@router.put("/remarcar")
async def remarcar_preco(
    codigo: str, 
    novo_preco: float, 
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(obter_usuario_atual)
):
    """Atualiza o preço de venda de um produto."""
    db_name = AMBIENTES[ambiente]
    sucesso = await executar_query(
        banco=db_name, 
        query=Scripts.query['remarcação'], 
        params=(novo_preco, codigo), 
        usuario=usuario, 
        endpoint="/api/remarcar",
        is_select=False
    )
    
    if sucesso is True:
        return {"status": "sucesso", "mensagem": f"Preço atualizado para R$ {novo_preco}"}
    raise HTTPException(status_code=500, detail=f"Erro: {sucesso}")

@router.put("/atualizar-custo")
async def atualizar_custo(
    codigo: str, 
    novo_custo: float, 
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(obter_usuario_atual)
):
    """Atualiza o custo de um produto."""
    db_name = AMBIENTES[ambiente]
    
    sucesso = await executar_query(
        banco=db_name, 
        query=Scripts.query['atualiza_custo'], 
        params=(novo_custo, codigo),
        usuario=usuario, 
        endpoint="/api/atualizar-custo",
        is_select=False
    )
    
    if sucesso:
        return {"message": f"Custo do produto {codigo} atualizado com sucesso!"}
    else:
        raise HTTPException(status_code=500, detail=f"Falha ao atualizar o custo do produto {codigo}")

@router.put("/atualizar-mkp")
async def atualizar_markup(
    codigo: str, 
    novo_mkp: float,
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(obter_usuario_atual)
):
    """Atualiza o markup de um produto."""
    db_name = AMBIENTES[ambiente]
    
    sucesso = await executar_query(
        banco=db_name, 
        query=Scripts.query['atualiza_mkp'], 
        params=(novo_mkp, novo_mkp, codigo), 
        usuario=usuario, 
        endpoint="/api/atualizar-mkp",
        is_select=False
    )
    
    if sucesso is True:
        return {"status": "sucesso", "mensagem": f"Markup do produto {codigo} ajustado para {novo_mkp}%"}
    raise HTTPException(status_code=500, detail=f"Erro: {sucesso}")
