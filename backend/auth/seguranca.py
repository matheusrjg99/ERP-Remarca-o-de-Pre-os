from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from functools import wraps
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from typing import List, Optional

# Configurações de Segurança
SECRET_KEY = "chave_secreta_provisoria_mudar_depois"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

# MUDANÇA AQUI: Trocamos 'bcrypt' por 'pbkdf2_sha256'
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Schema OAuth2 para extração do token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Hierarquia de Níveis de Privilégio (quanto maior o número, mais privilegiado)
NIVEIS_PRIVILEGIO = {
    "excluir": 4,
    "editar": 3,
    "remarcar": 2,
    "consultar": 1,
    "visualizar": 1,
    "listar": 1,
}

def verificar_hierarquia_permissao(permissao_requerida: str, permissoes_usuario: list) -> bool:
    """
    Verifica se o usuário possui a permissão requerida, considerando:
    1. Permissão exata
    2. Curinga do módulo (ex: 'precificacao:*')
    3. Admin total
    4. Hierarquia implícita (ações de nível superior incluem inferiores)
    
    Args:
        permissao_requerida: String no formato "modulo:acao" (ex: "precificacao:consultar")
        permissoes_usuario: Lista de permissões do usuário
    
    Returns:
        bool: True se autorizado, False caso contrário
    """
    # Admin total tem acesso a tudo
    if "admin_total" in permissoes_usuario:
        return True
    
    # Permissão exata
    if permissao_requerida in permissoes_usuario:
        return True
    
    # Curinga do módulo (ex: "precificacao:*")
    modulo = permissao_requerida.split(":")[0] if ":" in permissao_requerida else permissao_requerida
    if f"{modulo}:*" in permissoes_usuario:
        return True
    
    # Verificar hierarquia implícita
    if ":" not in permissao_requerida:
        return False
    
    modulo_requerido, acao_requerida = permissao_requerida.split(":", 1)
    nivel_requerido = NIVEIS_PRIVILEGIO.get(acao_requerida.lower(), 0)
    
    # Se não há nível definido, não aplica hierarquia
    if nivel_requerido == 0:
        return False
    
    # Verificar se o usuário tem alguma permissão do mesmo módulo com nível superior
    for permissao in permissoes_usuario:
        if ":" not in permissao:
            continue
        
        usuario_modulo, usuario_acao = permissao.split(":", 1)
        
        # Só compara permissões do mesmo módulo
        if usuario_modulo != modulo_requerido:
            continue
        
        # Ignora curingas (já tratados acima)
        if usuario_acao == "*":
            continue
        
        nivel_usuario = NIVEIS_PRIVILEGIO.get(usuario_acao.lower(), 0)
        
        # Se o usuário tem uma permissão de nível superior no mesmo módulo, autoriza
        if nivel_usuario > nivel_requerido:
            return True
    
    return False

def requer_permissao(permissao_necessaria: str):
    """
    Decorador que valida se o usuário possui a permissão necessária.
    Implementa hierarquia implícita: níveis superiores herdam inferiores.
    
    Uso: @requer_permissao("precificacao:consultar")
    
    Returns uma dependência do FastAPI que pode ser usada com Depends().
    """
    import logging
    
    async def verificar(current_user: dict = Depends(get_current_user)):
        permissoes_usuario = current_user.get("permissoes", [])
        cargo = current_user.get("cargo", "")
        username = current_user.get("nome", "desconhecido")
        
        # LOG: Entrada da verificação
        logging.warning(f"[DEBUG PERMISSAO] Usuário: {username} | Cargo: {cargo}")
        logging.warning(f"[DEBUG PERMISSAO] Permissão requerida: {permissao_necessaria}")
        logging.warning(f"[DEBUG PERMISSAO] Permissões do usuário: {permissoes_usuario}")
        
        # Admin total (cargos especiais) tem acesso a tudo
        if cargo in ["Administrador", "TI"] or "admin_total" in permissoes_usuario:
            logging.warning(f"[DEBUG PERMISSAO] Acesso concedido (ADMIN/CARGO ESPECIAL)")
            return current_user
        
        # Verifica permissão explícita ou hierárquica
        tem_permissao = verificar_hierarquia_permissao(permissao_necessaria, permissoes_usuario)
        
        logging.warning(f"[DEBUG PERMISSAO] Resultado da verificação hierárquica: {tem_permissao}")
        
        if not tem_permissao:
            logging.error(f"[ACESSO NEGADO] {username} não tem {permissao_necessaria}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permissão insuficiente. Requer: {permissao_necessaria}"
            )
        
        logging.warning(f"[DEBUG PERMISSAO] Acesso concedido para {username}")
        return current_user
    
    return verificar


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Dependência do FastAPI para injetar o usuário atual nas rotas.
    Decodifica o JWT e retorna o payload com permissões.
    
    Nota: As permissões são validadas no momento da criação do token.
    Para validação em tempo real contra o banco, usar get_current_user_with_db().
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id: int = payload.get("sub")
        if usuario_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Retorna o payload completo do token
    return {
        "usuario_id": payload.get("sub"),
        "nome": payload.get("nome"),
        "email": payload.get("email"),
        "cargo": payload.get("cargo"),
        "permissoes": payload.get("permissoes", []),
    }


async def get_current_user_with_db(token: str = Depends(oauth2_scheme), db=None) -> dict:
    """
    Dependência do FastAPI que valida o usuário e busca permissões atualizadas no banco.
    Usar quando precisar de permissões em tempo real (ex: após mudança de cargo).
    """
    from database import Database
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id: int = payload.get("sub")
        login = payload.get("sub")  # Assume que 'sub' é o login
        if usuario_id is None and login is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Busca permissões atualizadas no banco
    if db is None:
        db = Database()
    
    permissoes = await obter_permissoes_usuario(login or str(usuario_id))
    
    if not permissoes:
        raise credentials_exception
    
    # Busca dados do usuário
    query_usuario = """
        SELECT 
            u.id as usuario_id,
            u.nome,
            u.email,
            c.nome as cargo
        FROM USUARIOS u
        INNER JOIN CARGOS c ON u.cargo_id = c.id
        WHERE u.id = ? OR u.login = ?
    """
    
    resultado = await db.executar_query(query_usuario, (usuario_id, login))
    
    if not resultado:
        raise credentials_exception
    
    row = resultado[0]
    
    return {
        "usuario_id": row['usuario_id'],
        "nome": row['nome'],
        "email": row['email'],
        "cargo": row['cargo'],
        "permissoes": permissoes
    }

def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    """Compara a senha digitada com o hash salvo no banco."""
    try:
        return pwd_context.verify(senha_plana, senha_hash)
    except Exception:
        return False

def gerar_hash_senha(senha: str) -> str:
    """Criptografa uma senha nova usando PBKDF2."""
    return pwd_context.hash(senha)

def criar_token_acesso(dados: dict) -> str:
    """Gera o Token JWT contendo as informações do usuário."""
    dados_token = dados.copy()
    expiracao = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    dados_token.update({"exp": expiracao})
    
    token_codificado = jwt.encode(dados_token, SECRET_KEY, algorithm=ALGORITHM)
    return token_codificado

async def obter_permissoes_usuario(login: str) -> list:
    """
    Busca as permissões do usuário no banco de dados baseado no seu cargo.
    Retorna lista de códigos de permissão (ex: ['nc:criar', 'nc:listar', ...]).
    
    IMPORTANTE: A query usa LEFT JOIN para retornar permissões vazias se o usuário
    não tiver cargo atribuído, evitando que usuários sem cargo recebam permissões
    indevidas por INNER JOINs falharem.
    
    Usuários com login 'SISTEMA' recebem automaticamente a permissão admin_total.
    """
    from database import executar_query
    
    # Se for admin/sistema, retorna todas as permissões
    if login.upper() == "SISTEMA":
        return ["admin_total"]
    
    # Busca dados do usuário incluindo cargo_id
    # NOTA: A coluna nivel_acesso foi removida em favor do sistema RBAC baseado em cargos
    query_usuario_completo = """
        SELECT login, nome, cargo_id 
        FROM dbo.API_USUARIOS 
        WHERE login = ? AND ativo = 1
    """
    
    try:
        resultado_usuario = await executar_query(
            banco="Bddemo",
            query=query_usuario_completo,
            params=(login,),
            usuario="SISTEMA",
            endpoint="/auth/permissoes"
        )
        
        if not resultado_usuario or isinstance(resultado_usuario, dict) or len(resultado_usuario) == 0:
            print(f"DEBUG: Usuário '{login}' não encontrado ou inativo")
            return []
        
        usuario_info = resultado_usuario[0]
        cargo_id = usuario_info.get('cargo_id')
        
        print(f"DEBUG: Usuário '{login}' - cargo_id={cargo_id}")
        
        # Se não tiver cargo atribuído, retorna vazio
        if cargo_id is None:
            print(f"DEBUG: Usuário '{login}' não tem cargo atribuído (cargo_id=None)")
            return []
        
        # Verifica se o cargo está ativo
        query_verifica_cargo = """
            SELECT id, nome, ativo 
            FROM dbo.cargos 
            WHERE id = ? AND ativo = 1
        """
        resultado_cargo = await executar_query(
            banco="Bddemo",
            query=query_verifica_cargo,
            params=(cargo_id,),
            usuario="SISTEMA",
            endpoint="/auth/permissoes-cargo"
        )
        
        if not resultado_cargo or isinstance(resultado_cargo, dict) or len(resultado_cargo) == 0:
            print(f"DEBUG: Cargo {cargo_id} do usuário '{login}' está inativo ou não existe")
            return []
        
        print(f"DEBUG: Cargo ativo confirmado para usuário '{login}'")
        
        # Query otimizada: busca permissões do cargo ativo
        # NOTA: Removido ORDER BY pois não é compatível com SELECT DISTINCT no SQL Server
        # a menos que a coluna esteja na lista de seleção
        query = """
            SELECT DISTINCT LTRIM(RTRIM(p.codigo)) as codigo
            FROM dbo.cargo_permissoes cp
            INNER JOIN dbo.permissoes p ON cp.permissao_id = p.id 
                AND p.ativo = 1 
                AND p.codigo IS NOT NULL 
                AND LTRIM(RTRIM(p.codigo)) <> ''
            WHERE cp.cargo_id = ?
        """
        
        resultado = await executar_query(
            banco="Bddemo",
            query=query,
            params=(cargo_id,),
            usuario="SISTEMA",
            endpoint="/auth/permissoes"
        )
        
        print(f"DEBUG: Permissões brutas do banco para {login} (cargo_id={cargo_id}): {resultado}")
        
        if not resultado or isinstance(resultado, dict):
            return []
        
        # Filtra rigorosamente: apenas strings não vazias (segurança extra)
        permissoes = []
        for row in resultado:
            codigo = row.get('codigo')
            if codigo and isinstance(codigo, str) and codigo.strip():
                permissoes.append(codigo.strip())
        
        permissoes_finais = list(set(permissoes))  # Remove duplicatas extras
        print(f"DEBUG: Permissões finais para {login}: {permissoes_finais}")
        return permissoes_finais
        
    except Exception as e:
        print(f"Erro ao buscar permissões para {login}: {e}")
        import traceback
        traceback.print_exc()
        return []