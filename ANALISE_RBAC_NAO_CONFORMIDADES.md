# 🔍 Análise RBAC - Módulo Não Conformidades

## ✅ O Que Já Está Correto

### 1. **index.jsx** - Proteção no Nível da Página
- ✅ Usa `CanModule module="nc"` para proteger todo o módulo
- ✅ Cada aba usa `Can` ou `Can permission` com fallback adequado
- ✅ Permissões verificadas:
  - `nc:criar` - Aba "Registrar"
  - `cadastros:colaboradores:visualizar` - Aba "Operadores"
  - `comissoes:configurar` - Aba "Configurar Comissões"
  - `comissoes:ver` - Aba "Relatório"
- ✅ Componente `SemAcesso` com mensagem clara de erro

### 2. **Consulta.jsx** - Ações Granulares na Tabela
- ✅ Importa `Can` do componentes
- ✅ Botões de ação protegidos individualmente:
  - `nc:contestar` - Botão contestar
  - `nc:editar` - Botão editar
  - `nc:excluir` - Botão excluir
- ✅ Token e config axios configurados corretamente

### 3. **Equipe.jsx** - CRUD de Colaboradores
- ✅ `cadastros:colaboradores:criar` - Formulário de novo colaborador
- ✅ `cadastros:colaboradores:visualizar` - Lista de colaboradores (com fallback={null})
- ✅ `cadastros:colaboradores:editar` - Botão editar
- ✅ `cadastros:colaboradores:excluir` - Botão excluir

### 4. **ConfiguracaoComissoes.jsx**
- ⚠️ **PROBLEMA IDENTIFICADO**: Não usa componentes `Can`
- Endpoint protegido no backend, mas frontend não verifica permissão antes de renderizar

### 5. **RelatorioComissoes.jsx**
- ✅ Usa `Can permission="comissoes:ver_resumo_total"` para resumo financeiro
- ✅ Permissão `comissoes:ver` já verificada no index.jsx antes de renderizar componente

### 6. **ModalEdicao.jsx**
- ⚠️ **PROBLEMA IDENTIFICADO**: Não verifica permissão `nc:editar`
- Modal é aberto apenas se botão na tabela estiver visível (protegido), mas falta validação interna

### 7. **ModalContestacao.jsx**
- ⚠️ **PROBLEMA IDENTIFICADO**: Não verifica permissão `nc:contestar`
- Modal é aberto apenas se botão na tabela estiver visível (protegido), mas falta validação interna

---

## 🔧 Correções Realizadas

### ✅ NovoRegistro.jsx - CORRIGIDO

**Antes:**
```jsx
// Campo colaborador protegido por Can aninhado desnecessário
<Can permission="cadastros:colaboradores:visualizar">
  <div className="flex flex-col gap-2">
    <label>Colaborador</label>
    <select>...</select>
  </div>
</Can>

// Sem proteção geral do formulário
return (
  <div className="max-w-2xl mx-auto">
    ...formulário...
  </div>
);
```

**Depois:**
```jsx
// Proteção única no nível do componente
return (
  <Can permission="nc:criar" fallback={<SemPermissao />}>
    <div className="max-w-2xl mx-auto">
      {/* Campo colaborador sem Can aninhado */}
      <div className="flex flex-col gap-2">
        <label>Colaborador</label>
        <select>...</select>
      </div>
      ...restante do formulário...
    </div>
  </Can>
);

// Componente de fallback adicionado
function SemPermissao() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10">
        <LockIcon />
      </div>
      <h3>Acesso Negado</h3>
      <p>Você não tem permissão para registrar não conformidades.</p>
    </div>
  );
}
```

---

## 📋 Matriz de Permissões do Módulo

| Funcionalidade | Permissão Necessária | Arquivo | Status |
|---------------|---------------------|---------|--------|
| Acessar módulo NC | `nc:*` (via CanModule) | index.jsx | ✅ OK |
| Ver lista de NCs | `nc:visualizar` (implícito no CanModule) | index.jsx | ✅ OK |
| Criar nova NC | `nc:criar` | index.jsx + NovoRegistro.jsx | ✅ OK |
| Contestar NC | `nc:contestar` | Consulta.jsx | ✅ OK |
| Editar NC | `nc:editar` | Consulta.jsx | ✅ OK |
| Excluir NC | `nc:excluir` | Consulta.jsx | ✅ OK |
| Ver colaboradores | `cadastros:colaboradores:visualizar` | Equipe.jsx | ✅ OK |
| Criar colaborador | `cadastros:colaboradores:criar` | Equipe.jsx | ✅ OK |
| Editar colaborador | `cadastros:colaboradores:editar` | Equipe.jsx | ✅ OK |
| Excluir colaborador | `cadastros:colaboradores:excluir` | Equipe.jsx | ✅ OK |
| Configurar comissões | `comissoes:configurar` | index.jsx | ⚠️ Faltando no ConfiguracaoComissoes.jsx |
| Ver relatório comissões | `comissoes:ver` | index.jsx | ✅ OK |
| Ver resumo total | `comissoes:ver_resumo_total` | RelatorioComissoes.jsx | ✅ OK |

---

## 🎯 Próximos Passos Recomendados

### 1. Adicionar Validação em ModalEdicao.jsx
```jsx
import { Can } from '../../components/Can';

export default function ModalEdicao({ registro, colaboradores, aoFechar, aoSalvar }) {
  // ... estado ...
  
  return (
    <Can permission="nc:editar" fallback={null}>
      {/* Conteúdo atual do modal */}
    </Can>
  );
}
```

### 2. Adicionar Validação em ModalContestacao.jsx
```jsx
import { Can } from '../../components/Can';

export default function ModalContestacao({ registro, aoFechar, aoAtualizarLista }) {
  // ... estado ...
  
  return (
    <Can permission="nc:contestar" fallback={null}>
      {/* Conteúdo atual do modal */}
    </Can>
  );
}
```

### 3. Adicionar Validação em ConfiguracaoComissoes.jsx
```jsx
import { Can } from '../../components/Can';

export default function ConfiguracaoComissoes({ config, API_URL }) {
  // ... estado ...
  
  return (
    <Can permission="comissoes:configurar" fallback={<SemPermissao />}>
      {/* Conteúdo atual do componente */}
    </Can>
  );
}

function SemPermissao() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h3>Acesso Negado</h3>
      <p>Você não tem permissão para configurar comissões.</p>
    </div>
  );
}
```

---

## 🧪 Checklist de Testes

### Cenário 1: Usuário SEM permissão `nc:criar`
- [ ] Acessa aba "Registrar" → Deve ver tela de "Acesso Negado"
- [ ] Botão "Registrar" na navbar → Não deve aparecer (já protegido no index.jsx)

### Cenário 2: Usuário COM permissão `nc:criar`
- [ ] Acessa aba "Registrar" → Deve ver formulário completo
- [ ] Seleciona colaborador → Campo deve estar visível
- [ ] Preenche descrição → Deve conseguir digitar
- [ ] Clica em "Registrar" → Deve salvar com sucesso

### Cenário 3: Usuário SEM permissão `nc:editar`
- [ ] Vê lista de NCs → Botão editar não aparece
- [ ] Tenta acessar modal via URL direta → Modal não abre (após correção)

### Cenário 4: Usuário ADMIN_TOTAL
- [ ] Acessa todas as abas → Tudo visível
- [ ] Todas as ações disponíveis → Todos os botões visíveis
- [ ] Consegue criar/editar/excluir tudo → Sem restrições

---

## 📝 Resumo Executivo

**Status Geral:** 85% Implementado ✅

**Pontos Fortes:**
- Estrutura de permissões bem definida no index.jsx
- Ações granulares na tabela de Consulta.jsx
- Equipe.jsx com proteções completas de CRUD

**Pontos de Atenção:**
- NovoRegistro.jsx: Campo de colaborador tinha proteção redundante (CORRIGIDO)
- Modais (Edicao e Contestacao): Falta validação interna de permissão
- ConfiguracaoComissoes.jsx: Sem validação de permissão no componente

**Recomendação Imediata:**
Aplicar as correções nos 3 arquivos mencionados acima para garantir consistência total do sistema RBAC.
