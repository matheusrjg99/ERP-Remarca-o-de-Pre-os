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
    Retorna lista de códigos de permissão (ex: ['nc_criar', 'nc_listar', ...]).
    """
    from database import executar_query
    
    # Se for admin/sistema, retorna todas as permissões
    if login.upper() == "SISTEMA":
        return ["admin_total"]
    
    query = """
        SELECT DISTINCT p.codigo
        FROM API_USUARIOS u
        INNER JOIN cargos c ON u.cargo_id = c.id
        INNER JOIN cargo_permissoes cp ON c.id = cp.cargo_id
        INNER JOIN permissoes p ON cp.permissao_id = p.id
        WHERE u.login = ? AND u.ativo = 1
    """
    
    try:
        resultado = await executar_query(
            banco="Bddemo",
            query=query,
            params=(login,),
            usuario="SISTEMA",
            endpoint="/auth/permissoes"
        )
        
        if not resultado or isinstance(resultado, dict):
            return []
        
        return [row['codigo'] for row in resultado]
    except Exception:
        return []