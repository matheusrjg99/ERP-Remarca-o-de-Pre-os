# Melhorias de Autenticação JWT e RBAC no Frontend

## 📋 Visão Geral

Foram implementadas melhorias significativas no controle de acesso baseado em permissões (RBAC) nos componentes do Dashboard, garantindo que usuários sem as permissões adequadas não possam acessar ou modificar funcionalidades restritas.

## 🔐 Componentes Criados/Atualizados

### 1. **PermissionGuard.jsx** (NOVO)
Localização: `/frontend/src/components/PermissionGuard.jsx`

**Funcionalidades:**
- `withPermission()` - HOC para proteger componentes inteiros
- `usePermissionGuard()` - Hook para verificação programática de permissões
- `PermissionGuard` - Componente wrapper para proteção granular de elementos UI

**Exemplos de Uso:**

```jsx
// HOC - Protege componente inteiro
const BotaoExcluir = withPermission({
  permissions: 'nc:excluir',
  fallback: <span className="text-gray-400">Sem permissão</span>
})(() => <button>Excluir</button>);

// Hook - Verificação programática
function MinhaTela() {
  const { can, cannot } = usePermissionGuard('dashboard:editar_regras');
  
  if (cannot) return <AcessoNegado />;
  return <EditorRegras />;
}

// Componente Wrapper - Proteção inline
<PermissionGuard 
  permissions={['admin_total', 'dashboard:personalizar']}
  fallback={<BloqueioVisual />}
  renderType="none" // ou 'disabled' ou 'custom'
>
  <BotaoPersonalizar />
</PermissionGuard>
```

### 2. **CustomizeModal.jsx** (ATUALIZADO)
Localização: `/frontend/src/pages/Dashboard/components/CustomizeModal.jsx`

**Permissões Implementadas:**
- `dashboard:personalizar_visual` - Controle para personalização de estilo fixo
- `dashboard:editar_regras` - Controle para criação/edição de regras condicionais

**Comportamentos de Bloqueio:**

| Funcionalidade | Sem Permissão | Com Permissão |
|---------------|---------------|---------------|
| Selecionar colunas | Botões desabilitados + visual cinza | Funcionalidade completa |
| Aba "Estilo Fixo" | Desabilitada + opacity reduzida | Acessível normalmente |
| Aba "Regras (IF)" | Bloqueada com ícone 🔒 | Acessível se tiver permissão |
| Inputs de cor/texto | `disabled={!podePersonalizarVisual}` | Editáveis |
| Criar/Editar regras | Botões bloqueados + 🔒 | Funcionalidade completa |
| Excluir regras | Botões com opacity reduzida | Visíveis no hover |
| Resetar formatação | Botão desabilitado + 🔒 | Funcional |

**Indicadores Visuais:**
- 🔒 Ícone de cadeado aparece quando usuário não tem permissão
- Opacidade reduzida (50%) em seções bloqueadas
- Estados `cursor-not-allowed` em elementos desabilitados
- Mensagem no título: "Personalizar Visual 🔒"

## 🎯 Permissões Necessárias no Backend

Para que o controle funcione corretamente, certifique-se de que estas permissões existem no banco:

```sql
-- Permissões para Dashboard
INSERT INTO dbo.permissoes (codigo, descricao, modulo, ativo) VALUES
('dashboard:personalizar_visual', 'Personalizar visual das colunas', 'dashboard', 1),
('dashboard:editar_regras', 'Criar e editar regras condicionais', 'dashboard', 1);
```

## 📚 Boas Práticas Implementadas

### 1. **Defesa em Profundidade**
- Verificação no nível da função (lógica)
- Verificação no nível do componente (UI)
- Feedback visual claro para usuário

### 2. **Experiência do Usuário**
- Elementos desabilitados permanecem visíveis (não ocultados)
- Ícones indicam restrição de acesso
- Tooltips explicam motivo do bloqueio

### 3. **Manutenibilidade**
- Código centralizado em hooks reutilizáveis
- Fácil adição de novas permissões
- Separação clara entre lógica e apresentação

## 🔄 Como Adicionar Permissões a Outros Componentes

### Passo 1: Importar hook
```jsx
import { usePermissions } from '../../../hooks/usePermissions';
```

### Passo 2: Instanciar verificação
```jsx
const { hasPermission } = usePermissions();
const podeAcaoX = hasPermission('modulo:acao_x') || hasPermission('admin_total');
```

### Passo 3: Aplicar bloqueios
```jsx
// Em funções
const handleAcao = () => {
  if (!podeAcaoX) return;
  // lógica da ação
};

// Em elementos UI
<button 
  onClick={handleAcao}
  disabled={!podeAcaoX}
  className={!podeAcaoX ? 'opacity-50 cursor-not-allowed' : ''}
>
  Ação X {!podeAcaoX && '🔒'}
</button>
```

## 🧪 Testes Recomendados

1. **Login como ADMIN_TOTAL** → Todas funcionalidades disponíveis
2. **Login como USER sem permissões** → Elementos bloqueados visualmente
3. **Login como USER com permissão parcial** → Apenas funcionalidades autorizadas disponíveis
4. **Troca de usuário/cargo** → Recarregar página para atualizar permissões

## ⚠️ Pontos de Atenção

1. **Cache de Permissões**: As permissões são carregadas do localStorage. Após alterar cargo de um usuário, é necessário fazer logout/login.

2. **Admin Total**: Usuários com permissão `admin_total` bypassam todas as verificações automaticamente.

3. **Loading State**: Durante carregamento inicial das permissões, componentes protegidos retornam `null`.

## 📖 Referências

- Hook original: `/frontend/src/hooks/usePermissions.js`
- Componentes Can: `/frontend/src/components/Can.jsx`
- ProtectedRoute: `/frontend/src/components/ProtectedRoute.jsx`
- RBAC Manager: `/frontend/src/components/RBACManager.jsx`
- Backend RBAC: `/backend/routes/core/rbac.py`

---

**Status**: ✅ Implementado e testado  
**Data**: 2024  
**Autor**: Sistema de Autenticação JWT
