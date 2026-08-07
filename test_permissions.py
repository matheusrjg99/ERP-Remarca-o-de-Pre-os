"""
Script de teste para diagnosticar problema de permissões
"""
import asyncio
import sys
sys.path.insert(0, '/workspace/backend')

from auth.seguranca import obter_permissoes_usuario

async def test_permissions():
    print("=" * 60)
    print("TESTE DE PERMISSÕES - DIAGNÓSTICO")
    print("=" * 60)
    
    # Teste 1: Usuário SISTEMA (deve ter admin_total)
    print("\n1. Testando usuário SISTEMA:")
    perms_sistema = await obter_permissoes_usuario("SISTEMA")
    print(f"   Permissões: {perms_sistema}")
    print(f"   ✅ ADMIN_TOTAL presente: {'admin_total' in perms_sistema}")
    
    # Teste 2: Usuário de exemplo (substitua pelo login real)
    print("\n2. Testando usuário de exemplo:")
    print("   Digite o login do usuário para testar (ou ENTER para pular):")
    login_teste = input("   Login: ").strip()
    
    if login_teste:
        perms_user = await obter_permissoes_usuario(login_teste)
        print(f"   Permissões encontradas: {perms_user}")
        print(f"   Total de permissões: {len(perms_user)}")
        
        if not perms_user:
            print("\n   ⚠️  NENHUMA PERMISSÃO ENCONTRADA!")
            print("   Possíveis causas:")
            print("   - Usuário não tem cargo atribuído")
            print("   - Cargo não tem permissões vinculadas")
            print("   - Cargo ou permissões estão inativos (ativo=0)")
            print("   - Query SQL com problema")
        else:
            print(f"   ✅ Permissões carregadas corretamente")
    else:
        print("   Pulando teste de usuário específico")
    
    print("\n" + "=" * 60)
    print("DIAGNÓSTICO CONCLUÍDO")
    print("=" * 60)
    print("\nPRÓXIMOS PASSOS:")
    print("1. Se as permissões aparecem aqui mas não no sistema:")
    print("   → Faça LOGOUT e LOGIN novamente no frontend")
    print("   → Verifique o localStorage: console.log(localStorage.getItem('permissoes'))")
    print("\n2. Se as permissões NÃO aparecem aqui:")
    print("   → Verifique no banco: SELECT u.login, c.nome as cargo FROM API_USUARIOS u")
    print("     LEFT JOIN cargos c ON u.cargo_id = c.id WHERE u.login = 'SEU_LOGIN'")
    print("   → Verifique permissões do cargo: SELECT p.codigo FROM cargo_permissoes cp")
    print("     JOIN permissoes p ON cp.permissao_id = p.id WHERE cp.cargo_id = SEU_CARGO_ID")

if __name__ == "__main__":
    asyncio.run(test_permissions())
