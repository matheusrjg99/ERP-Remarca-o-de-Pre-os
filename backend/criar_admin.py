import asyncio
from auth.seguranca import gerar_hash_senha
from database import executar_query

async def setup_admin():
    login_admin = "admin"
    senha_plana = "admin123" # Você poderá alterar depois
    hash_seguro = gerar_hash_senha(senha_plana)
    
    # Primeiro, precisamos garantir que o cargo de Administrador existe e obter seu ID
    query_busca_cargo = """
        SELECT id FROM dbo.cargos WHERE nome = 'Administrador' AND ativo = 1
    """
    
    resultado = await executar_query(
        banco="Bddemo",
        query=query_busca_cargo,
        params=(),
        usuario="SETUP",
        endpoint="/setup_inicial"
    )
    
    if not resultado or len(resultado) == 0:
        print("Erro: Cargo 'Administrador' não encontrado. Execute o script init.sql primeiro.")
        return
    
    cargo_id_admin = resultado[0]['id']
    
    query = """
        INSERT INTO API_USUARIOS (login, senha_hash, nome, cargo_id, ativo)
        VALUES (?, ?, ?, ?, 1)
    """
    
    print("Iniciando criação do usuário Administrador...")
    
    sucesso = await executar_query(
        banco="Bddemo", # Banco de demonstração
        query=query,
        params=(login_admin, hash_seguro, "Administrador Sistema", cargo_id_admin),
        usuario="SETUP",
        endpoint="/setup_inicial",
        is_select=False
    )
    
    if sucesso is True:
        print(f"Sucesso! Usuário '{login_admin}' criado. Senha: {senha_plana}")
    else:
        print(f"Falha ao criar usuário. Detalhes: {sucesso}")

if __name__ == "__main__":
    asyncio.run(setup_admin())