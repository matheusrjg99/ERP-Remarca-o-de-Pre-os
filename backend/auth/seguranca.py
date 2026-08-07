from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

# Configurações de Segurança
SECRET_KEY = "chave_secreta_provisoria_mudar_depois"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

# MUDANÇA AQUI: Trocamos 'bcrypt' por 'pbkdf2_sha256'
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

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
    
    Usuários com nivel_acesso = 'ADMIN' recebem automaticamente a permissão admin_total.
    """
    from database import executar_query
    
    # Se for admin/sistema, retorna todas as permissões
    if login.upper() == "SISTEMA":
        return ["admin_total"]
    
    # Primeiro, verifica o nível de acesso do usuário
    query_nivel = """
        SELECT nivel_acesso FROM dbo.API_USUARIOS 
        WHERE login = ? AND ativo = 1
    """
    
    try:
        resultado_nivel = await executar_query(
            banco="Bddemo",
            query=query_nivel,
            params=(login,),
            usuario="SISTEMA",
            endpoint="/auth/permissoes"
        )
        
        if not resultado_nivel or isinstance(resultado_nivel, dict):
            return []
        
        nivel_acesso = resultado_nivel[0].get('nivel_acesso', '').upper()
        
        # Se for ADMIN, concede todas as permissões
        if nivel_acesso == 'ADMIN':
            return ["admin_total"]
        
        # Query corrigida: Mantém LEFT JOINs e move filtros de permissão para o ON
        # Isso garante que usuários sem cargo ainda retornem uma linha (com permissões vazias)
        query = """
            SELECT DISTINCT LTRIM(RTRIM(p.codigo)) as codigo
            FROM dbo.API_USUARIOS u
            LEFT JOIN dbo.cargos c ON u.cargo_id = c.id AND c.ativo = 1
            LEFT JOIN dbo.cargo_permissoes cp ON c.id = cp.cargo_id
            LEFT JOIN dbo.permissoes p ON cp.permissao_id = p.id AND p.ativo = 1 AND p.codigo IS NOT NULL AND LTRIM(RTRIM(p.codigo)) <> ''
            WHERE u.login = ? AND u.ativo = 1
            ORDER BY p.codigo
        """
        
        print(f"DEBUG: Buscando permissões para usuário '{login}' com cargo_id")
        
        # Query auxiliar para debug: verificar cargo do usuário
        query_debug_cargo = """
            SELECT u.cargo_id, c.nome as cargo_nome, c.ativo as cargo_ativo
            FROM dbo.API_USUARIOS u
            LEFT JOIN dbo.cargos c ON u.cargo_id = c.id
            WHERE u.login = ?
        """
        resultado_cargo = await executar_query(
            banco="Bddemo",
            query=query_debug_cargo,
            params=(login,),
            usuario="SISTEMA",
            endpoint="/auth/permissoes-debug"
        )
        print(f"DEBUG Cargo do usuário {login}: {resultado_cargo}")
        
        resultado = await executar_query(
            banco="Bddemo",
            query=query,
            params=(login,),
            usuario="SISTEMA",
            endpoint="/auth/permissoes"
        )
        
        print(f"DEBUG Permissões brutas do banco para {login}: {resultado}")
        
        if not resultado or isinstance(resultado, dict):
            return []
        
        # Filtra rigorosamente: apenas strings não vazias (segurança extra)
        permissoes = []
        for row in resultado:
            codigo = row.get('codigo')
            if codigo and isinstance(codigo, str) and codigo.strip():
                permissoes.append(codigo.strip())
        
        return list(set(permissoes))  # Remove duplicatas extras
    except Exception as e:
        print(f"Erro ao buscar permissões para {login}: {e}")
        return []