"""
Rotas de Consultas Gerais - Produtos, Notas, Classificações, Fornecedores
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional

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

@router.get("/divergencias-markup")
async def buscar_divergencias_markup(
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(obter_usuario_atual)
):
    """Busca divergências de markup nos produtos."""
    db_name = AMBIENTES[ambiente]
    query = Scripts.query['divergencia_markup']
    
    dados = await executar_query(
        banco=db_name, 
        query=query, 
        params=(), 
        usuario=usuario, 
        endpoint="/api/divergencias-markup"
    )
    return dados

@router.get("/produto/{registro}")
async def buscar_registro_inteligente(
    registro: str, 
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    is_numord: bool = Query(False),
    usuario: str = Depends(obter_usuario_atual)
):
    """Busca inteligente de produtos por código, nota fiscal ou múltiplos códigos."""
    db_name = AMBIENTES[ambiente]
    
    # 1. Se o React avisou que é um NumOrd direto
    if is_numord:
        query = Scripts.query['consulta_nota']
        dados = await executar_query(
            banco=db_name, 
            query=query, 
            params=(registro,), 
            usuario=usuario, 
            endpoint=f"/api/produto/nf/{registro}"
        )
        return dados

    # 2. Múltiplos códigos
    if "," in registro or "'" in registro:
        codigos = registro.split(",")
        codigos_formatados = ",".join(f"'{c.strip()}'" for c in codigos)
        query_base = Scripts.query['consulta_codigo']
        
        if "IN (?)" in query_base:
            query = query_base.replace("IN (?)", f"IN ({codigos_formatados})")
        else:
            query = query_base.replace("= ?", f"IN ({codigos_formatados})")
            
        dados = await executar_query(
            banco=db_name, 
            query=query, 
            params=(), 
            usuario=usuario, 
            endpoint="/api/produto/multiplos"
        )
        
    # 3. Nota Fiscal
    elif len(registro) >= 6 and registro.isdigit():
        query_notas = Scripts.query['buscar_notas_por_numero']
        notas_encontradas = await executar_query(
            banco=db_name, 
            query=query_notas, 
            params=(registro,), 
            usuario=usuario, 
            endpoint="/api/notas"
        )
        
        if not notas_encontradas:
            raise HTTPException(status_code=404, detail="Nenhuma nota encontrada.")
            
        if len(notas_encontradas) > 1:
            return {"action": "select_note", "notes": notas_encontradas}
            
        else:
            numord_unico = notas_encontradas[0]['numord']
            query_itens = Scripts.query['consulta_nota']
            dados = await executar_query(
                banco=db_name, 
                query=query_itens, 
                params=(numord_unico,), 
                usuario=usuario, 
                endpoint=f"/api/produto/nf/{numord_unico}"
            )
            
    # 4. Código Individual
    else:
        registro_formatado = str(registro).zfill(5)
        query = Scripts.query['consulta_codigo']
        dados = await executar_query(
            banco=db_name, 
            query=query, 
            params=(registro_formatado,), 
            usuario=usuario, 
            endpoint=f"/api/produto/{registro}"
        )

    if not dados:
        raise HTTPException(status_code=404, detail="Nenhum registro encontrado para esta busca.")
        
    return dados

class LoteRequisicao(BaseModel):
    codigos: List[str]

@router.post("/produtos-lote")
async def buscar_produtos_em_lote(
    lote: LoteRequisicao,
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(obter_usuario_atual)
):
    """Busca múltiplos produtos em lote."""
    from pydantic import BaseModel
    
    if not lote.codigos:
        return []

    db_name = AMBIENTES[ambiente]
    codigos_formatados = ",".join(f"'{str(c).strip()}'" for c in lote.codigos)
    
    query_base = Scripts.query['consulta_codigo']
    
    if "IN (?)" in query_base:
        query = query_base.replace("IN (?)", f"IN ({codigos_formatados})")
    else:
        query = query_base.replace("= ?", f"IN ({codigos_formatados})")
        
    dados = await executar_query(
        banco=db_name, 
        query=query, 
        params=(), 
        usuario=usuario, 
        endpoint="/api/produtos-lote"
    )
    
    if not dados:
        return []
        
    return dados

@router.get("/classificacoes")
async def listar_classificacoes(
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(obter_usuario_atual)
):
    """Lista todas as classificações de produtos."""
    db_name = AMBIENTES[ambiente]
    query = "SELECT clasprod as codigo, descr FROM CLASSIFCAD ORDER BY clasprod"
    dados = await executar_query(
        banco=db_name, 
        query=query, 
        params=(), 
        usuario=usuario, 
        endpoint="/api/classificacoes"
    )
    return dados if dados else []

@router.get("/fornecedores")
async def listar_fornecedores(
    termo: str = "", 
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(obter_usuario_atual)
):
    """Lista fornecedores com filtro por nome."""
    db_name = AMBIENTES[ambiente]
    query = "SELECT OID, NOME FROM FORNECECAD WHERE NOME LIKE ? ORDER BY NOME"
    dados = await executar_query(
        banco=db_name, 
        query=query, 
        params=(f"%{termo}%",), 
        usuario=usuario, 
        endpoint="/api/fornecedores"
    )
    return dados if dados else []

@router.get("/pesquisar")
async def pesquisar_produto_avancado(
    termo: Optional[str] = "", 
    codigo: Optional[str] = "",
    fornecedor: Optional[str] = "",
    classificacao: Optional[str] = "",
    disponibilidade: Optional[str] = "",
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(obter_usuario_atual)
):
    """Pesquisa avançada de produtos com múltiplos filtros."""
    db_name = AMBIENTES[ambiente]
    
    query = """
        SELECT
            p.codpro AS CODPRO,
            cp.descricaolonga AS DESCRICAOLONGA,
            f.NOME AS RAZSOC,
            c.descr AS CLASSIFICACAO,
            i.NOME AS STATUS_DISP
        FROM PRODUTOCAD p
        LEFT JOIN complementoproduto cp ON p.codpro = cp.codpro
        LEFT JOIN FORNECECAD f ON p.codfor = f.oid
        LEFT JOIN item i ON p.Disponibilidade = i.OID
        LEFT JOIN CLASSIFCAD c ON p.clasprod = c.clasprod
    """
    
    conditions = []
    params = []
    
    if termo:
        conditions.append("cp.descricaolonga LIKE ?")
        params.append(f"%{termo}%")
        
    if codigo:
        conditions.append("p.codpro LIKE ?")
        params.append(f"%{codigo}%")
        
    if fornecedor:
        conditions.append("f.NOME LIKE ?")
        params.append(f"%{fornecedor}%")
            
    if classificacao:
        if " - " in classificacao:
            clasprod = classificacao.split(" - ")[0].strip().replace(".", "")
            conditions.append("p.clasprod LIKE ?")
            params.append(f"{clasprod}%")
        else:
            class_limpa = classificacao.replace(".", "").strip()
            if class_limpa.isdigit():
                conditions.append("p.clasprod LIKE ?")
                params.append(f"{class_limpa}%")
            else:
                conditions.append("c.descr LIKE ?")
                params.append(f"%{classificacao}%")

    if disponibilidade:
        status_list = disponibilidade.split(',')
        placeholders = ",".join(["?"] * len(status_list))
        conditions.append(f"i.NOME IN ({placeholders})")
        params.extend(status_list)
    
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    
    query += " ORDER BY p.codpro"
    
    dados = await executar_query(
        banco=db_name, 
        query=query, 
        params=tuple(params), 
        usuario=usuario, 
        endpoint="/api/pesquisar"
    )
    return dados if dados else []

# Import necessário no final para evitar circular dependency
from pydantic import BaseModel
