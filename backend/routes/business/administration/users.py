"""
Rotas de Gestão de Usuários - CRUD e Status (Apenas ADMIN)
Módulo Business/Administration: Responsável pela administração de usuários do sistema.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from jose import jwt, JWTError

from database import executar_query
from auth.seguranca import gerar_hash_senha, SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/users", tags=["Administração de Usuários"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class UsuarioNovo(BaseModel):
    login: str
    senha: str
    nome: str
    cargo_id: int

def exigir_admin(token: str = Depends(oauth2_scheme)):
    """Dependência para validar se o usuário é Administrador."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        permissoes = payload.get("permissions", [])
        
        # Verifica se tem permissão de admin_total ou gestão de usuários
        if "admin_total" not in permissoes and "usuarios:gerenciar" not in permissoes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Acesso negado. Recurso exclusivo para administradores."
            )
        return payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.get("")
async def listar_usuarios(admin_slug: str = Depends(exigir_admin)):
    """Lista todos os usuários do sistema (Apenas ADMIN)."""
    query = """
        SELECT u.login, u.nome, u.cargo_id, c.nome as cargo_nome, u.ativo 
        FROM API_USUARIOS u
        LEFT JOIN dbo.cargos c ON u.cargo_id = c.id AND c.ativo = 1
        ORDER BY u.nome
    """
    return await executar_query(
        banco="Bddemo", 
        query=query, 
        params=(), 
        usuario=admin_slug, 
        endpoint="/api/usuarios"
    )

@router.post("")
async def cadastrar_usuario(dados: UsuarioNovo, admin_slug: str = Depends(exigir_admin)):
    """Cadastra um novo usuário no sistema (Apenas ADMIN)."""
    hash_senha = gerar_hash_senha(dados.senha)
    query = """
        INSERT INTO API_USUARIOS (login, senha_hash, nome, cargo_id, ativo)
        VALUES (?, ?, ?, ?, 1)
    """
    params = (dados.login.lower().strip(), hash_senha, dados.nome.upper(), dados.cargo_id)
    
    sucesso = await executar_query(
        banco="Bddemo", 
        query=query, 
        params=params, 
        is_select=False, 
        usuario=admin_slug, 
        endpoint="/api/usuarios/cadastro"
    )
    
    if sucesso is True:
        return {"status": "sucesso", "mensagem": f"Usuário {dados.login} criado!"}
    raise HTTPException(status_code=500, detail="Erro ao salvar usuário no banco.")

@router.put("/{login_user}/status")
async def alternar_status_usuario(login_user: str, ativo: int, admin_slug: str = Depends(exigir_admin)):
    """Ativa ou desativa um usuário (Apenas ADMIN)."""
    query = "UPDATE API_USUARIOS SET ativo = ? WHERE login = ?"
    sucesso = await executar_query(
        banco="Bddemo", 
        query=query, 
        params=(ativo, login_user), 
        is_select=False, 
        usuario=admin_slug, 
        endpoint="/api/usuarios/status"
    )
    return {"status": "sucesso"} if sucesso is True else {"status": "erro"}
