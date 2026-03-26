from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import BaseModel
from typing import List
from typing import Optional
from typing import Optional

# Nossas importações internas
from database import executar_query
from sql_repo import Scripts
from models.schemas import LoginData, Token
from auth.seguranca import verificar_senha, criar_token_acesso, SECRET_KEY, ALGORITHM

app = FastAPI(title="API de Retaguarda ERP", version="1.0.0")

# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AMBIENTES = {
    "producao": "Bdenter",
    "demo": "bddemo",
    "treina": "bdtreina"
}

# --- DEPENDÊNCIA DE SEGURANÇA ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def obter_usuario_atual(token: str = Depends(oauth2_scheme)):
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

# Adicione UsuarioNovo às importações de modelos ou crie aqui
class UsuarioNovo(BaseModel):
    login: str
    senha: str
    nome: str
    nivel_acesso: str  # 'ADMIN' ou 'COMUM'

# 1. Dependência para validar se o usuário é Administrador
def exigir_admin(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        nivel: str = payload.get("nivel")
        if nivel != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Acesso negado. Recurso exclusivo para administradores."
            )
        return payload.get("sub") # Retorna o login do admin
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

# --- ROTAS DE GESTÃO DE USUÁRIOS (Protegidas) ---

@app.get("/api/usuarios", tags=["Administração"])
async def listar_usuarios(admin_slug: str = Depends(exigir_admin)):
    # Busca todos os usuários da sua tabela API_USUARIOS
    query = "SELECT login, nome, nivel_acesso, ativo FROM API_USUARIOS ORDER BY nome"
    return executar_query(banco="Bdenter", query=query, params=(), usuario=admin_slug, endpoint="/api/usuarios")

@app.post("/api/usuarios", tags=["Administração"])
async def cadastrar_usuario(dados: UsuarioNovo, admin_slug: str = Depends(exigir_admin)):
    from auth.seguranca import gerar_hash_senha
    
    hash_senha = gerar_hash_senha(dados.senha)
    query = """
        INSERT INTO API_USUARIOS (login, senha_hash, nome, nivel_acesso, ativo)
        VALUES (?, ?, ?, ?, 1)
    """
    params = (dados.login.lower().strip(), hash_senha, dados.nome.upper(), dados.nivel_acesso.upper())
    
    sucesso = executar_query(
        banco="Bdenter", 
        query=query, 
        params=params, 
        is_select=False, 
        usuario=admin_slug, 
        endpoint="/api/usuarios/cadastro"
    )
    
    if sucesso is True:
        return {"status": "sucesso", "mensagem": f"Usuário {dados.login} criado!"}
    raise HTTPException(status_code=500, detail="Erro ao salvar usuário no banco.")

@app.put("/api/usuarios/{login_user}/status", tags=["Administração"])
async def alternar_status_usuario(login_user: str, ativo: int, admin_slug: str = Depends(exigir_admin)):
    query = "UPDATE API_USUARIOS SET ativo = ? WHERE login = ?"
    sucesso = executar_query(banco="Bdenter", query=query, params=(ativo, login_user), is_select=False, usuario=admin_slug, endpoint="/api/usuarios/status")
    return {"status": "sucesso"} if sucesso is True else {"status": "erro"}

# --- ROTAS DE AUTENTICAÇÃO ---

@app.post("/login", response_model=Token, tags=["Autenticação"])
async def login(dados: LoginData):
    query = "SELECT login, senha_hash, nivel_acesso FROM API_USUARIOS WHERE login = ? AND ativo = 1"
    resultado = executar_query(banco="Bdenter", query=query, params=(dados.login,), usuario="SISTEMA", endpoint="/login")
    
    if not resultado or not isinstance(resultado, list):
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    usuario_db = resultado[0]
    
    if not verificar_senha(dados.senha, usuario_db["senha_hash"]):
        raise HTTPException(status_code=401, detail="Senha incorreta")
    
    token_jwt = criar_token_acesso(dados={"sub": usuario_db["login"], "nivel": usuario_db["nivel_acesso"]})
    
    return {
        "access_token": token_jwt,
        "token_type": "bearer",
        "nivel_acesso": usuario_db["nivel_acesso"],
        "usuario": usuario_db["login"]
    }

# --- ROTAS DE CONSULTA ---


@app.get("/api/produto/{registro}", tags=["Consultas"])
async def buscar_registro_inteligente(
    registro: str, 
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    is_numord: bool = Query(False), # Novo parâmetro!
    usuario: str = Depends(obter_usuario_atual)
):
    db_name = AMBIENTES[ambiente]
    
    # 1. Se o React avisou que é um NumOrd direto (usuário clicou na janelinha)
    if is_numord:
        query = Scripts.query['consulta_nota']
        dados = executar_query(banco=db_name, query=query, params=(registro,), usuario=usuario, endpoint=f"/api/produto/nf/{registro}")
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
            
        dados = executar_query(banco=db_name, query=query, params=(), usuario=usuario, endpoint="/api/produto/multiplos")
        
    # 3. Nota Fiscal (Digitou o número de documento)
    elif len(registro) >= 6 and registro.isdigit():
        query_notas = Scripts.query['buscar_notas_por_numero']
        notas_encontradas = executar_query(banco=db_name, query=query_notas, params=(registro,), usuario=usuario, endpoint="/api/notas")
        
        if not notas_encontradas:
            raise HTTPException(status_code=404, detail="Nenhuma nota encontrada.")
            
        # Se achou mais de uma nota com esse número
        if len(notas_encontradas) > 1:
            return {"action": "select_note", "notes": notas_encontradas}
            
        # Se achou só uma, carrega os itens usando o numord dela direto
        else:
            numord_unico = notas_encontradas[0]['numord']
            query_itens = Scripts.query['consulta_nota']
            dados = executar_query(banco=db_name, query=query_itens, params=(numord_unico,), usuario=usuario, endpoint=f"/api/produto/nf/{numord_unico}")
            
    # 4. Código Individual
    else:
        registro_formatado = str(registro).zfill(5)
        query = Scripts.query['consulta_codigo']
        dados = executar_query(banco=db_name, query=query, params=(registro_formatado,), usuario=usuario, endpoint=f"/api/produto/{registro}")

    if not dados:
        raise HTTPException(status_code=404, detail="Nenhum registro encontrado para esta busca.")
        
    return dados


@app.get("/api/classificacoes", tags=["Filtros"])
async def listar_classificacoes(
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(obter_usuario_atual)
):
    db_name = AMBIENTES[ambiente]
    # Usa a lógica do seu SQL para trazer a árvore (traz todos ordenados pelo código)
    query = "SELECT clasprod as codigo, descr FROM CLASSIFCAD ORDER BY clasprod"
    dados = executar_query(banco=db_name, query=query, params=(), usuario=usuario, endpoint="/api/classificacoes")
    return dados if dados else []


@app.get("/api/fornecedores", tags=["Filtros"])
async def listar_fornecedores(
    termo: str = "", 
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(obter_usuario_atual)
):
    db_name = AMBIENTES[ambiente]
    # AGORA TRAZ O 'OID' JUNTO COM O NOME
    query = "SELECT OID, NOME FROM FORNECECAD WHERE NOME LIKE ? ORDER BY NOME"
    dados = executar_query(banco=db_name, query=query, params=(f"%{termo}%",), usuario=usuario, endpoint="/api/fornecedores")
    return dados if dados else []


@app.get("/api/logs", tags=["Administração"])
async def consultar_logs(
    data_inicio: Optional[str] = "",
    data_fim: Optional[str] = "",
    usuario_filtro: Optional[str] = "",
    operacao: Optional[str] = "",
    termo: Optional[str] = "",
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    admin_slug: str = Depends(exigir_admin)
):
    db_name = AMBIENTES[ambiente]
    
    # Montagem dinâmica da Query com TOP 500 para proteção de memória
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

    dados = executar_query(
        banco=db_name, 
        query=query, 
        params=tuple(params), 
        usuario=admin_slug, 
        endpoint="/api/logs"
    )
    
    return dados if dados else []

# ... (Mantenha a sua listar_classificacoes intacta) ...

@app.get("/api/pesquisar", tags=["Consultas"])
async def pesquisar_produto_avancado(
    termo: Optional[str] = "", 
    codigo: Optional[str] = "",
    fornecedor: Optional[str] = "",
    classificacao: Optional[str] = "",
    disponibilidade: Optional[str] = "",
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(obter_usuario_atual)
):
    db_name = AMBIENTES[ambiente]
    query = Scripts.query['pesquisar_produto']
    params = []
    
    if termo:
        query += " AND p.descr LIKE ?"
        params.append(f"%{termo}%")
        
    if codigo:
        query += " AND p.codpro LIKE ?"
        params.append(f"%{codigo}%")
        
    if fornecedor:
        # Como combinamos: Recebe apenas o NOME limpo do Fornecedor e pesquisa
        query += " AND f.NOME LIKE ?" 
        params.append(f"%{fornecedor}%")
            
    if classificacao:
        # SE O REACT MANDOU "0502 - TINTAS", SEPARA E PEGA SÓ O "0502"
        if " - " in classificacao:
            clasprod = classificacao.split(" - ")[0].strip().replace(".", "")
            query += " AND p.clasprod LIKE ?"
            params.append(f"{clasprod}%")
        else:
            # Se ele só digitou um pedaço livre na caixinha e apertou Enter
            class_limpa = classificacao.replace(".", "").strip()
            if class_limpa.isdigit():
                query += " AND p.clasprod LIKE ?"
                params.append(f"{class_limpa}%")
            else:
                query += " AND c.descr LIKE ?"
                params.append(f"%{classificacao}%")

    if disponibilidade:
        status_list = disponibilidade.split(',')
        placeholders = ",".join(["?"] * len(status_list))
        query += f" AND i.NOME IN ({placeholders})"
        params.extend(status_list)

    dados = executar_query(
        banco=db_name, 
        query=query, 
        params=tuple(params), 
        usuario=usuario, 
        endpoint="/api/pesquisar"
    )
    return dados if dados else []
# --- ROTAS DE OPERAÇÃO (UPDATE) ---

@app.put("/api/remarcar", tags=["Operações"])
async def remarcar_preco(
    codigo: str, 
    novo_preco: float, 
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(obter_usuario_atual)
):
    db_name = AMBIENTES[ambiente]
    sucesso = executar_query(
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


@app.put("/api/atualizar-custo", tags=["Operações"])
async def atualizar_custo(
    codigo: str, 
    novo_custo: float, 
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(obter_usuario_atual)
):
    db_name = AMBIENTES[ambiente]
    
    # Executa o script que você já deixou pronto no sql_repo.py
    sucesso = executar_query(
        banco=db_name, 
        query=Scripts.query['atualiza_custo'], 
        params=(novo_custo, codigo), # Passa o valor do custo novo e o código do produto
        usuario=usuario, 
        endpoint="/api/atualizar-custo",
        is_select=False
    )
    
    if sucesso:
        return {"message": f"Custo do produto {codigo} atualizado com sucesso!"}
    else:
        raise HTTPException(status_code=500, detail=f"Falha ao atualizar o custo do produto {codigo}")
    

@app.put("/api/atualizar-mkp", tags=["Operações"])
async def atualizar_markup(
    codigo: str, 
    novo_mkp: float,
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(obter_usuario_atual)
):
    db_name = AMBIENTES[ambiente]
    # A query exige o novo_mkp duas vezes para o cálculo e depois o código
    sucesso = executar_query(
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

# --- MODELO PARA RECEBER A LISTA DE CÓDIGOS DO REACT ---
class LoteRequisicao(BaseModel):
    codigos: List[str]

@app.post("/api/produtos-lote", tags=["Consultas"])
async def buscar_produtos_em_lote(
    lote: LoteRequisicao,
    ambiente: str = Query("treina", enum=["producao", "demo", "treina"]),
    usuario: str = Depends(obter_usuario_atual)
):
    if not lote.codigos:
        return []

    db_name = AMBIENTES[ambiente]
    
    # Prepara a lista de códigos no formato: '00001', '00002', '00003'
    # (Exatamente a mesma lógica inteligente que você já usava no buscar_registro_inteligente)
    codigos_formatados = ",".join(f"'{str(c).strip()}'" for c in lote.codigos)
    
    query_base = Scripts.query['consulta_codigo']
    
    # Transforma o "= ?" ou "IN (?)" original em uma lista gigante
    if "IN (?)" in query_base:
        query = query_base.replace("IN (?)", f"IN ({codigos_formatados})")
    else:
        query = query_base.replace("= ?", f"IN ({codigos_formatados})")
        
    dados = executar_query(
        banco=db_name, 
        query=query, 
        params=(), 
        usuario=usuario, 
        endpoint="/api/produtos-lote"
    )
    
    if not dados:
        return []
        
    return dados

class PreferenciasUpdate(BaseModel):
    preferencias: dict

@app.get("/api/usuario/preferencias", tags=["Configurações"])
async def obter_preferencias(usuario_logado: str = Depends(obter_usuario_atual)):
    # Preferências sempre ficam salvas no banco principal (Bdenter)
    query = "SELECT preferencias_json FROM API_USUARIOS WHERE login = ?"
    res = executar_query(banco="Bdenter", query=query, params=(usuario_logado,), usuario=usuario_logado, endpoint="/api/usuario/preferencias")
    
    import json
    if res and res[0].get("preferencias_json"):
        return json.loads(res[0]["preferencias_json"])
    return {}

@app.put("/api/usuario/preferencias", tags=["Configurações"])
async def salvar_preferencias(dados: PreferenciasUpdate, usuario_logado: str = Depends(obter_usuario_atual)):
    import json
    json_str = json.dumps(dados.preferencias)
    query = "UPDATE API_USUARIOS SET preferencias_json = ? WHERE login = ?"
    sucesso = executar_query(banco="Bdenter", query=query, params=(json_str, usuario_logado), is_select=False, usuario=usuario_logado, endpoint="/api/usuario/preferencias")
    
    if sucesso is True:
        return {"status": "sucesso"}
    raise HTTPException(status_code=500, detail="Erro ao salvar preferências.")