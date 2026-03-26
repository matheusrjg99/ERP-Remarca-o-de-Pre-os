from auth.seguranca import gerar_hash_senha
from database import executar_query

def setup_admin():
    login_admin = "admin"
    senha_plana = "admin123" # Você poderá alterar depois
    hash_seguro = gerar_hash_senha(senha_plana)
    
    query = """
        INSERT INTO API_USUARIOS (login, senha_hash, nome, nivel_acesso, ativo)
        VALUES (?, ?, ?, 'ADMIN', 1)
    """
    
    print("Iniciando criação do usuário Administrador...")
    
    sucesso = executar_query(
        banco="Bdenter", # Banco central de usuários
        query=query,
        params=(login_admin, hash_seguro, "Administrador Sistema"),
        usuario="SETUP",
        endpoint="/setup_inicial",
        is_select=False
    )
    
    if sucesso is True:
        print(f"Sucesso! Usuário '{login_admin}' criado. Senha: {senha_plana}")
    else:
        print(f"Falha ao criar usuário. Detalhes: {sucesso}")

if __name__ == "__main__":
    setup_admin()