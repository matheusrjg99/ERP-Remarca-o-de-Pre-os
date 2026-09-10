"""
Script utilitário para criar o usuário Administrador inicial.
Uso: python criar_admin.py

⚠️ Rodar apenas no setup inicial. Se o admin já existir, o script avisa.
"""
import asyncio
import sys

from auth.seguranca import gerar_hash_senha
from database import executar_query


# ==================== CONFIGURAÇÕES ====================
LOGIN_ADMIN = "admin"
SENHA_ADMIN = "admin123"  # ⚠️ Trocar após o primeiro login
NOME_ADMIN = "Administrador Sistema"
CARGO_NOME = "Administrador"


async def setup_admin():
    """Cria o usuário admin inicial."""
    
    print("🚀 Iniciando criação do usuário Administrador...\n")
    
    # 1. Buscar ID do cargo "Administrador"
    print(f"🔍 Buscando cargo '{CARGO_NOME}'...")
    resultado = await executar_query(
        banco="Bddemo",
        query="SELECT id FROM dbo.cargos WHERE nome = ? AND ativo = 1",
        params=(CARGO_NOME,),
        usuario="SETUP",
        endpoint="/setup_inicial"
    )
    
    if not resultado or isinstance(resultado, dict) or len(resultado) == 0:
        print(f"❌ Erro: Cargo '{CARGO_NOME}' não encontrado.")
        print("   Execute o script init.sql primeiro para criar os cargos base.")
        sys.exit(1)
    
    cargo_id_admin = resultado[0]['id']
    print(f"✅ Cargo '{CARGO_NOME}' encontrado (ID: {cargo_id_admin})\n")
    
    # 2. Verificar se o usuário já existe
    print(f"🔍 Verificando se '{LOGIN_ADMIN}' já existe...")
    check = await executar_query(
        banco="Bddemo",
        query="SELECT login FROM API_USUARIOS WHERE login = ?",
        params=(LOGIN_ADMIN,),
        usuario="SETUP",
        endpoint="/setup_inicial"
    )
    
    if check and not isinstance(check, dict) and len(check) > 0:
        print(f"⚠️  Usuário '{LOGIN_ADMIN}' já existe. Abortando.")
        print(f"   Se quiser resetar a senha, use um script separado.")
        sys.exit(0)
    
    print(f"✅ Login '{LOGIN_ADMIN}' disponível\n")
    
    # 3. Gerar hash da senha
    print("🔐 Gerando hash da senha...")
    hash_seguro = gerar_hash_senha(SENHA_ADMIN)
    print(f"✅ Hash gerado ({len(hash_seguro)} caracteres)\n")
    
    # 4. Inserir usuário
    print(f"📝 Criando usuário '{LOGIN_ADMIN}'...")
    try:
        sucesso = await executar_query(
            banco="Bddemo",
            query="""
                INSERT INTO API_USUARIOS (login, senha_hash, nome, cargo_id, ativo)
                VALUES (?, ?, ?, ?, 1)
            """,
            params=(LOGIN_ADMIN, hash_seguro, NOME_ADMIN, cargo_id_admin),
            usuario="SETUP",
            endpoint="/setup_inicial",
            is_select=False
        )
    except Exception as e:
        print(f"❌ Erro inesperado: {type(e).__name__} — {str(e)}")
        sys.exit(1)
    
    # 5. Verificar resultado
    if sucesso is True:
        print("\n" + "=" * 60)
        print("✅ USUÁRIO ADMIN CRIADO COM SUCESSO!")
        print("=" * 60)
        print(f"  Login: {LOGIN_ADMIN}")
        print(f"  Senha: {SENHA_ADMIN}  ⚠️  TROQUE APÓS O PRIMEIRO LOGIN")
        print(f"  Cargo: {CARGO_NOME}")
        print("=" * 60 + "\n")
        print("🔒 Recomendação: faça login e troque a senha imediatamente.")
    else:
        print(f"\n❌ Falha ao criar usuário. Retorno do banco: {sucesso}")
        print("   Verifique se o banco está acessível e se o login é único.")
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(setup_admin())
    except KeyboardInterrupt:
        print("\n\n⚠️  Cancelado pelo usuário.")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Erro fatal: {type(e).__name__} — {str(e)}")
        sys.exit(1)