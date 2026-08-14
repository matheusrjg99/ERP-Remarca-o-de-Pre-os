from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from functools import wraps
from fastapi import HTTPException, status

# Configurações de Segurança
SECRET_KEY = "chave_secreta_provisoria_mudar_depois"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

# MUDANÇA AQUI: Trocamos 'bcrypt' por 'pbkdf2_sha256'
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

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
    Decorador para verificar permissões com hierarquia implícita.
    
    Args:
        permissao_necessaria: Permissão requerida no formato "modulo:acao"
    """
    def decorador(funcao):
        @wraps(funcao)
        async def wrapper(*args, **kwargs):
            # Tenta obter o token das args ou kwargs
            token = None
            
            # Verifica em kwargs primeiro (comum em FastAPI com Depends)
            if 'token' in kwargs:
                token = kwargs['token']
            elif 'request' in kwargs and hasattr(kwargs['request'], 'headers'):
                auth_header = kwargs['request'].headers.get('Authorization', '')
                if auth_header.startswith('Bearer '):
                    token = auth_header[7:]
            
            # Se não encontrou token, tenta buscar nos args
            if not token:
                for arg in args:
                    if isinstance(arg, dict) and 'access_token' in arg:
                        token = arg['access_token']
                        break
                    elif hasattr(arg, 'headers'):
                        auth_header = getattr(arg, 'headers', {}).get('Authorization', '')
                        if auth_header.startswith('Bearer '):
                            token = auth_header[7:]
                            break
            
            if not token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token não fornecido"
                )
            
            try:
                # Decodifica o token para obter as permissões
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                permissoes_usuario = payload.get("permissoes", [])
                
                # Verifica a permissão com hierarquia
                if not verificar_hierarquia_permissao(permissao_necessaria, permissoes_usuario):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Permissão insuficiente. Requer: {permissao_necessaria}"
                    )
            except jwt.JWTError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token inválido ou expirado"
                )
            
            return await funcao(*args, **kwargs)
        return wrapper
    return decorador

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