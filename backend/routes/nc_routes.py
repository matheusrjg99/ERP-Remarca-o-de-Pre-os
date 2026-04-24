from fastapi import APIRouter, HTTPException, Body, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Importamos o executor de query do próprio Sophon
from database import executar_query

router = APIRouter()

# --- DEPENDÊNCIA DE SEGURANÇA DESACOPLADA ---
# Evita o erro de importação circular com o main.py
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verificar_token(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    return token

# ==========================================
# SCHEMAS (MODELOS DE DADOS)
# ==========================================
class RegistroSchema(BaseModel):
    colaborador: str
    descricao: str
    data_custom: Optional[str] = None

class ContestacaoSchema(BaseModel):
    id_registro: int
    autor: str
    texto: str

class ResolucaoContestacao(BaseModel):
    status_contestacao: str

@router.get("/status")
async def nc_status():
    return {"status": "Módulo NC operante no Sophon (Conexão BDDEMO OK)"}

# ==========================================
# ROTAS: REGISTROS DE AUDITORIA
# ==========================================

@router.get("/registros")
async def listar_registros(mes: int, ano: int, token: str = Depends(verificar_token)):
    try:
        q = """
            SELECT 
                N.ID, 
                N.DATA, 
                N.COLABORADOR, 
                N.DESCRICAO, 
                N.STATUS_CONTESTACAO,
                (SELECT COUNT(*) FROM CONTESTACOES C WHERE C.ID_REGISTRO = N.ID) as qtd_contestacoes
            FROM NAOCONFOR N
            WHERE MONTH(N.DATA) = ? AND YEAR(N.DATA) = ?
            ORDER BY N.ID DESC
        """
        rows = await executar_query("bddemo", q, (mes, ano))
        
        if not rows:
            return []
            
        resultados = []
        for r in rows:
            status = r.get("STATUS_CONTESTACAO")
            if not status:
                status = "ABERTO"
                
            data_raw = r.get("DATA")
            if isinstance(data_raw, str):
                data_formatada = data_raw 
            elif data_raw:
                data_formatada = data_raw.strftime("%d/%m/%Y")
            else:
                data_formatada = ""
            
            resultados.append({
                "id": r.get("ID"),
                "data": data_formatada,
                "colaborador": r.get("COLABORADOR", ""),
                "descricao": r.get("DESCRICAO", ""),
                "qtd_contestacoes": r.get("qtd_contestacoes", 0),
                "status_contestacao": status
            })
            
        return resultados
    except Exception as e:
        print(f"Erro ao listar registros: {e}")
        return []

@router.post("/registros")
async def criar_registro(reg: RegistroSchema, token: str = Depends(verificar_token)):
    try:
        if reg.data_custom:
            q = "INSERT INTO NAOCONFOR (COLABORADOR, DESCRICAO, DATA, STATUS_CONTESTACAO) VALUES (?, ?, ?, 'ABERTO')"
            await executar_query("bddemo", q, (reg.colaborador, reg.descricao, reg.data_custom), is_select=False)
        else:
            q = "INSERT INTO NAOCONFOR (COLABORADOR, DESCRICAO, DATA, STATUS_CONTESTACAO) VALUES (?, ?, GETDATE(), 'ABERTO')"
            await executar_query("bddemo", q, (reg.colaborador, reg.descricao), is_select=False)
        return {"status": "ok"}
    except Exception as e:
        print(f"Erro ao criar registro: {e}")
        raise HTTPException(status_code=500, detail="Erro ao criar")

@router.put("/registros/{id}")
async def editar_registro(id: int, reg: dict = Body(...), token: str = Depends(verificar_token)):
    try:
        q = "UPDATE NAOCONFOR SET COLABORADOR = ?, DESCRICAO = ? WHERE ID = ?"
        await executar_query("bddemo", q, (reg.get('colaborador'), reg.get('descricao'), id), is_select=False)
        return {"status": "ok"}
    except Exception as e:
        print(f"Erro ao editar registro: {e}")
        raise HTTPException(status_code=500, detail="Erro ao editar")

@router.delete("/registros/{id}")
async def excluir_registro(id: int, token: str = Depends(verificar_token)):
    try:
        # Apagar as contestações primeiro para evitar conflito de chaves estrangeiras
        await executar_query("bddemo", "DELETE FROM CONTESTACOES WHERE ID_REGISTRO = ?", (id,), is_select=False)
        
        # Apagar o registro
        q = "DELETE FROM NAOCONFOR WHERE ID = ?"
        await executar_query("bddemo", q, (id,), is_select=False)
        return {"status": "ok"}
    except Exception as e:
        print(f"Erro ao deletar registro: {e}")
        raise HTTPException(status_code=500, detail="Erro ao deletar")

@router.put("/registros/{id_registro}/resolver")
async def resolver_registro(id_registro: int, resolucao: ResolucaoContestacao, token: str = Depends(verificar_token)):
    status_valido = resolucao.status_contestacao in ['DEFERIDO', 'INDEFERIDO']
    if not status_valido:
        raise HTTPException(status_code=400, detail="Status inválido")

    try:
        q = "UPDATE NAOCONFOR SET STATUS_CONTESTACAO = ? WHERE ID = ?"
        await executar_query("bddemo", q, (resolucao.status_contestacao, id_registro), is_select=False)
        return {"status": "ok", "novo_status": resolucao.status_contestacao}
    except Exception as e:
        print(f"Erro ao resolver contestação: {e}")
        raise HTTPException(status_code=500, detail="Falha ao atualizar o status na base de dados")

# ==========================================
# ROTAS: CONTESTAÇÕES (MENSAGENS)
# ==========================================

@router.get("/registros/{id}/contestacoes")
async def listar_contestacoes(id: int, token: str = Depends(verificar_token)):
    try:
        # CORREÇÃO: Usamos DATA_POSTAGEM as DATA para o frontend não quebrar
        q = "SELECT ID, AUTOR, TEXTO, DATA_POSTAGEM as DATA FROM CONTESTACOES WHERE ID_REGISTRO = ? ORDER BY DATA_POSTAGEM ASC"
        rows = await executar_query("bddemo", q, (id,))
        
        # Proteção extra para evitar o erro "'str' object has no attribute 'get'"
        if not isinstance(rows, list):
            print(f"Erro retornado pelo banco: {rows}")
            return []
            
        resultados = []
        for r in rows:
            data_raw = r.get("DATA")
            if isinstance(data_raw, str):
                data_formatada = data_raw
            elif data_raw:
                data_formatada = data_raw.strftime("%d/%m/%Y %H:%M")
            else:
                data_formatada = ""
                
            resultados.append({
                "id": r.get("ID"),
                "autor": r.get("AUTOR", ""),
                "texto": r.get("TEXTO", ""),
                "data": data_formatada
            })
        return resultados
    except Exception as e:
        print(f"Erro ao listar contestacoes: {e}")
        return []

@router.post("/contestacoes")
async def adicionar_contestacao(d: ContestacaoSchema, token: str = Depends(verificar_token)):
    try:
        # CORREÇÃO: Usamos DATA_POSTAGEM no INSERT
        q = "INSERT INTO CONTESTACOES (ID_REGISTRO, AUTOR, TEXTO, DATA_POSTAGEM) VALUES (?, ?, ?, GETDATE())"
        await executar_query("bddemo", q, (d.id_registro, d.autor, d.texto), is_select=False)
        return {"status": "ok"}
    except Exception as e:
        print(f"Erro ao adicionar contestação: {e}")
        raise HTTPException(status_code=500, detail="Erro ao adicionar")

@router.delete("/contestacoes/{id}")
async def excluir_contestacao(id: int, token: str = Depends(verificar_token)):
    try:
        q = "DELETE FROM CONTESTACOES WHERE ID = ?"
        await executar_query("bddemo", q, (id,), is_select=False)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao deletar contestação")

# ==========================================
# ROTAS: GESTÃO DE EQUIPE (COLABORADORES)
# ==========================================

@router.get("/colaboradores")
async def listar_colaboradores(token: str = Depends(verificar_token)):
    try:
        q = "SELECT NOME FROM COLABORADORES ORDER BY NOME"
        rows = await executar_query("bddemo", q, ())
        if not rows or not isinstance(rows, list): 
            return []
        return [r.get("NOME").strip() for r in rows]
    except Exception as e:
        print(f"Erro em colabs: {e}")
        return []

@router.post("/colaboradores")
async def adicionar_colaborador(nome: str = Body(..., embed=True), token: str = Depends(verificar_token)):
    try:
        q = "INSERT INTO COLABORADORES (NOME) VALUES (?)"
        await executar_query("bddemo", q, (nome.upper(),), is_select=False)
        return {"status": "ok"}
    except Exception as e:
        print(f"Erro ao adicionar colaborador: {e}")
        raise HTTPException(status_code=500, detail="Erro ao adicionar colaborador")

@router.delete("/colaboradores/{nome}")
async def remover_colaborador(nome: str, token: str = Depends(verificar_token)):
    try:
        q = "DELETE FROM COLABORADORES WHERE NOME = ?"
        await executar_query("bddemo", q, (nome,), is_select=False)
        return {"status": "ok"}
    except Exception as e:
        print(f"Erro ao remover colaborador: {e}")
        raise HTTPException(status_code=500, detail="Erro ao remover colaborador")