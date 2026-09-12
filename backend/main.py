from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import BaseModel
from typing import List, Optional
import os
import logging

from dotenv import load_dotenv

from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.gzip import GZipMiddleware

# Importação do router consolidado com todas as rotas organizadas
from routes import router as main_router

# Nossas importações internas
from database import executar_query
from sql_repo import Scripts
from models.schemas import LoginData, Token
from auth.seguranca import verificar_senha, criar_token_acesso, SECRET_KEY, ALGORITHM


# ==========================================
# 📁 CARREGAR VARIÁVEIS DE AMBIENTE (.env)
# ==========================================
# Carrega o .env ANTES de qualquer os.getenv()
load_dotenv()


# ==========================================
# 🔧 CONFIGURAÇÃO DE LOGGING
# ==========================================
# Nível controlado por variável de ambiente:
# - DEV (padrão): DEBUG → mostra tudo
# - PRODUÇÃO: WARNING → só avisos e erros
LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG").upper()

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.DEBUG),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# Silencia logs verbosos de bibliotecas externas
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("uvicorn.error").setLevel(logging.WARNING)
logging.getLogger("aioodbc").setLevel(logging.WARNING)
logging.getLogger("asyncio").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)
logger.info(f"🔧 Logging configurado com nível: {LOG_LEVEL}")


# ==========================================
# 🚀 APLICAÇÃO FASTAPI
# ==========================================
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
app.include_router(main_router)


# ==========================================
# 📦 HOSPEDAGEM DO FRONTEND REACT (Pasta Dist)
# ==========================================
caminho_assets = os.path.join("dist", "assets")

if os.path.isdir(caminho_assets):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")
    logger.info("📦 Pasta 'dist/assets' montada — frontend React será servido")
else:
    logger.warning(
        "⚠️ Pasta 'dist/assets' não encontrada. Rodando apenas como API. "
        "Rode 'npm run build' no frontend para gerar o dist."
    )


@app.get("/{full_path:path}", include_in_schema=False)
async def renderizar_react(full_path: str):
    caminho_dist = "dist"
    caminho_arquivo = os.path.join(caminho_dist, full_path)
    
    # Se a pasta dist inteira não existir, avisa
    if not os.path.exists(caminho_dist):
        return {"mensagem": "Modo API ativo. Frontend React ainda não foi compilado na pasta dist."}

    # Se pedir um arquivo válido (logo.png, favicon.svg, etc)
    if full_path and os.path.isfile(caminho_arquivo):
        return FileResponse(caminho_arquivo)

    # Qualquer outra rota do navegador → devolve o index.html (SPA)
    index_path = os.path.join(caminho_dist, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    
    return {"erro": "index.html não encontrado na pasta dist."}