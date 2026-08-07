# 📘 Guia de Implementação RBAC - Controle de Acesso no Sophon ERP

## Visão Geral

O sistema RBAC (Role-Based Access Control) permite controlar o acesso dos usuários com base em **cargos** e **permissões**.

---

## 🔑 Conceitos Principais

### 1. **Permissões**
Códigos que representam ações específicas no sistema. Exemplos:
- `cadastros:colaboradores` - Acesso ao cadastro de colaboradores
- `nc:criar` - Criar não conformidades
- `nc:excluir` - Excluir não conformidades
- `comissoes:configurar` - Configurar comissões
- `admin_total` - Permissão completa (administrador)

### 2. **Cargos**
Conjuntos de permissões agrupadas. Um cargo pode ter múltiplas permissões.

### 3. **Usuários**
Cada usuário tem:
- Um `nivel_acesso` (ADMIN ou comum)
- Um `cargo_id` opcional (vincula a um cargo)

---

## 🛠️ Como Usar no Frontend

### Hook `usePermissions`

Importe o hook em qualquer componente:

```jsx
import { usePermissions } from '../hooks/usePermissions';

function MeuComponente() {
  const { 
    hasPermission,      // Verifica permissão única
    hasAnyPermission,   // Verifica se tem alguma da lista
    hasAllPermissions,  // Verifica se tem todas da lista
    hasModuleAccess,    // Verifica acesso a módulo inteiro
    isAdmin,            // true se tiver admin_total
    permissions         // Array com todas as permissões
  } = usePermissions();

  return (
    <div>
      {hasPermission('cadastros:colaboradores') && (
        <button>Cadastrar Colaborador</button>
      )}
    </div>
  );
}
```

### Componentes `Can` (Recomendado)

Use componentes declarativos para condicionar renderização:

```jsx
import { Can, CanAny, CanAll, CanModule } from '../components/Can';

function TelaColaboradores() {
  return (
    <div>
      {/* Mostra apenas se tiver a permissão */}
      <Can permission="cadastros:colaboradores">
        <BotaoAdicionar />
      </Can>

      {/* Mostra se tiver pelo menos uma das permissões */}
      <CanAny permissions={['nc:criar', 'nc:editar']}>
        <BotaoNovaNaoConformidade />
      </CanAny>

      {/* Mostra se tiver TODAS as permissões */}
      <CanAll permissions={['cadastros:colaboradores', 'cadastros:excluir']}>
        <PainelCompleto />
      </CanAll>

      {/* Mostra se tiver acesso ao módulo */}
      <CanModule module="comissoes">
        <MenuComissoes />
      </CanModule>
      
      {/* Fallback customizado */}
      <Can 
        permission="admin:total" 
        fallback={<SemPermissao />}
      >
        <PainelAdmin />
      </Can>
    </div>
  );
}
```

---

## 🔒 Como Proteger Rotas

### No Backend (FastAPI)

```python
from security import requer_permissao
from fastapi import Depends

@router.get("/colaboradores", dependencies=[Depends(requer_permissao("cadastros:colaboradores"))])
async def listar_colaboradores():
    # Só acessa quem tem a permissão
    ...

@router.delete("/colaboradores/{id}", dependencies=[Depends(requer_permissao("cadastros:excluir"))])
async def excluir_colaborador(id: int):
    # Só acessa quem pode excluir
    ...
```

### No Frontend (React Router)

```jsx
// Em ProtectedRoute.jsx ou similar
import { usePermissions } from '../hooks/usePermissions';

function RotaProtegida({ children, permissaoNecessaria }) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) return <Carregando />;
  
  if (!hasPermission(permissaoNecessaria)) {
    return <Navigate to="/nao-autorizado" replace />;
  }

  return children;
}
```

---

## 👥 Gerenciando Cargos e Permissões

### 1. Acessar Gestão de Acessos
- Clique no avatar do usuário (canto superior direito)
- Selecione "⚙️ Configurações de Acesso" (apenas admins)

### 2. Criar/Editar Cargo
1. Vá na aba **"Cargos e Permissões"**
2. Clique em um cargo existente ou crie um novo
3. Marque as permissões desejadas por módulo:
   - `admin` - Permissões administrativas
   - `nc` - Não Conformidades
   - `precificacao` - Precificação
   - `cadastros` - Cadastros gerais

### 3. Atribuir Cargo a Usuário
1. Vá na aba **"Usuários"**
2. Clique em "Alterar Cargo" no usuário desejado
3. Selecione o cargo ou deixe "Nenhum" para acesso restrito
4. Confirme

---

## 📋 Estrutura de Permissões Sugerida

### Módulo: Cadastros
- `cadastros:colaboradores` - Listar/ver colaboradores
- `cadastros:colaboradores:criar` - Criar colaboradores
- `cadastros:colaboradores:editar` - Editar colaboradores
- `cadastros:colaboradores:excluir` - Excluir colaboradores

### Módulo: Não Conformidades
- `nc:listar` - Ver lista de NCs
- `nc:criar` - Criar nova NC
- `nc:editar` - Editar NC existente
- `nc:excluir` - Excluir NC
- `nc:contestar` - Contestar NC

### Módulo: Comissões
- `comissoes:ver` - Ver relatório de comissões
- `comissoes:configurar` - Configurar parâmetros

### Módulo: Admin
- `admin_total` - Acesso completo (equivalente a superusuário)
- `admin:cargos` - Gerenciar cargos e permissões
- `admin:usuarios` - Gerenciar usuários

---

## 🎯 Boas Práticas

### ✅ Faça:
- Use nomes descritivos para cargos (ex: "Operador de NC", "Gestor de Comissões")
- Agrupe permissões logicamente por função
- Teste sempre com um usuário de teste antes de aplicar em produção
- Documente quais cargos cada função deve ter

### ❌ Não faça:
- Não dê `admin_total` para usuários comuns
- Não crie cargos com permissões contraditórias
- Não remova todas as permissões de um cargo em uso
- Não edite permissões diretamente no banco (use a interface)

---

## 🐛 Troubleshooting

### Problema: Usuário não consegue acessar uma tela
**Solução:**
1. Verifique se o usuário tem cargo atribuído
2. Confira se o cargo tem as permissões necessárias
3. Verifique se o cargo está ativo
4. Faça logout e login novamente para atualizar permissões

### Problema: Botões aparecem mas ação é bloqueada
**Solução:**
- O backend está correto (bloqueou a ação)
- Ajuste o frontend para esconder o botão usando `<Can>` quando não houver permissão

### Problema: Mudança de cargo não surte efeito
**Solução:**
- O usuário precisa fazer logout e login novamente
- As permissões são carregadas no momento do login

---

## 📞 Suporte

Para dúvidas sobre implementação RBAC, consulte a documentação ou entre em contato com a equipe de desenvolvimento.
