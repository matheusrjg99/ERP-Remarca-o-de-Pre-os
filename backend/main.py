from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import BaseModel
from typing import List, Optional
import os
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.gzip import GZipMiddleware

# Importação do router modular de Não Conformidades
from routes.modules.nonconformities import router as nc_router

# Importação do router modular das rotas principais
from routes.principais import router as main_router

# Nossas importações internas
from database import executar_query
from sql_repo import Scripts
from models.schemas import LoginData, Token
from auth.seguranca import verificar_senha, criar_token_acesso, SECRET_KEY, ALGORITHM

app = FastAPI(title="API de Retaguarda ERP", version="1.0.0")
app.add_middleware(GZipMiddleware, minimum_size=500)

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


# ==========================================
# 🔌 ROTAS PRINCIPAIS DO SISTEMA
# ==========================================
# Inclui todas as rotas modulares organizadas por responsabilidade
app.include_router(main_router, tags=["Rotas Principais"])

# ==========================================
# 🔌 ROTAS DO MÓDULO: NÃO CONFORMIDADES
# ==========================================
# IMPORTANTE: Tem que ficar ANTES do catch-all do React!
app.include_router(nc_router, prefix="", tags=["Não Conformidades"])

# ==========================================
# HOSPEDAGEM DO FRONTEND REACT (Pasta Dist)
# ==========================================
caminho_assets = os.path.join("dist", "assets")

# 1. Só tenta montar a pasta de assets se ela realmente existir
if os.path.isdir(caminho_assets):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")
else:
    print("⚠️ AVISO: Pasta 'dist/assets' não encontrada. Rodando apenas como API.")

@app.get("/{full_path:path}", include_in_schema=False)
async def renderizar_react(full_path: str):
    caminho_dist = "dist"
    caminho_arquivo = os.path.join(caminho_dist, full_path)
    
    # 2. Se a pasta dist inteira não existir, avisa em vez de dar erro 500
    if not os.path.exists(caminho_dist):
        return {"mensagem": "Modo API ativo. Frontend React ainda não foi compilado na pasta dist."}

    # Se pedir um arquivo válido (logo.png, favicon.svg, etc), devolve o arquivo
    if full_path and os.path.isfile(caminho_arquivo):
        return FileResponse(caminho_arquivo)

    # Qualquer outra rota do navegador, devolve a tela principal do React (se existir)
    index_path = os.path.join(caminho_dist, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    
    return {"erro": "index.html não encontrado na pasta dist."}

