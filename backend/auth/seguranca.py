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
    
    # Primeiro, busca TODOS os dados do usuário incluindo nivel_acesso e cargo_id
    query_usuario_completo = """
        SELECT login, nome, nivel_acesso, cargo_id 
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
        nivel_acesso = usuario_info.get('nivel_acesso', '').upper().strip()
        cargo_id = usuario_info.get('cargo_id')
        
        print(f"DEBUG: Usuário '{login}' - nivel_acesso='{nivel_acesso}', cargo_id={cargo_id}")
        
        # Se for ADMIN, concede todas as permissões IMEDIATAMENTE
        if nivel_acesso == 'ADMIN':
            print(f"DEBUG: Usuário '{login}' é ADMIN, retornando admin_total")
            return ["admin_total"]
        
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