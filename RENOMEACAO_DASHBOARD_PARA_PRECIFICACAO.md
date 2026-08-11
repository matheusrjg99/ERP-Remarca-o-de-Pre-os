# ✅ Renomeação: Dashboard → Precificação

## Resumo da Mudança

O módulo anteriormente chamado de "Dashboard" foi renomeado para **"Precificação"** para refletir com precisão sua funcionalidade real: um sistema de remarcação e gestão de preços de produtos.

---

## 📁 Arquivos Alterados

### Frontend

| Arquivo Antigo | Novo Arquivo | Descrição |
|---------------|--------------|-----------|
| `frontend/src/pages/Dashboard/` | `frontend/src/pages/Precificacao/` | Pasta do módulo renomeada |
| `frontend/src/hooks/useDashboardPermissions.js` | `frontend/src/hooks/usePrecificacaoPermissions.js` | Hook de permissões renomeado |

### Código Atualizado

1. **`frontend/src/App.jsx`**
   - Import alterado de `Dashboard` para `Precificacao`
   - Comentário atualizado de "Antigo Dashboard" para "Precificação (Remarcação)"

2. **`frontend/src/pages/Precificacao/index.jsx`**
   - Componente renomeado de `Dashboard` para `Precificacao`
   - Import do hook atualizado para `usePrecificacaoPermissions`

3. **`frontend/src/pages/Precificacao/components/CustomizeModal.jsx`**
   - Hook atualizado para `usePrecificacaoPermissions`

4. **`frontend/src/pages/Precificacao/components/EditableCell.jsx`**
   - Hook atualizado para `usePrecificacaoPermissions`

5. **`frontend/src/hooks/usePrecificacaoPermissions.js`**
   - Todas as permissões alteradas de `dashboard:*` para `precificacao:*`
   - Nomes de funções e comentários atualizados

---

## 🔐 Permissões RBAC Atualizadas

### Novas Permissões do Módulo Precificação

```sql
-- Permissões básicas
precificacao:visualizar              -- Acessar módulo de precificação
precificacao:editar                  -- Editar preços e valores na planilha
precificacao:recalcular              -- Recalcular precificação em lote
precificacao:exportar                -- Exportar dados de precificação
precificacao:importar                -- Importar dados de precificação

-- Permissões de visualização
precificacao:ver_custos              -- Visualizar coluna de custos
precificacao:ver_margens             -- Visualizar colunas de margens e lucros
precificacao:ver_custo               -- Visualizar coluna de custo
precificacao:ver_margem              -- Visualizar coluna de margem
precificacao:ver_lucro               -- Visualizar coluna de lucro

-- Permissões de edição por coluna
precificacao:editar_custo            -- Editar coluna de custo
precificacao:editar_sugerido         -- Editar coluna de preço sugerido
precificacao:editar_preco            -- Editar coluna de preço atual
precificacao:editar_margem           -- Editar coluna de margem
precificacao:editar_desconto         -- Editar coluna de desconto

-- Permissões avançadas
precificacao:selecionar_nota         -- Selecionar nota fiscal para busca
precificacao:personalizar_visual     -- Personalizar visualização da planilha
precificacao:editar_regras           -- Editar regras de precificação
```

---

## 📋 Cargos Atualizados no Script SQL

### Gerente de Qualidade
- ✅ `precificacao:visualizar`
- ✅ `precificacao:ver_custos`
- ✅ `precificacao:ver_margens`
- ✅ `precificacao:exportar`

### Analista Comercial
- ✅ `precificacao:visualizar`
- ✅ `precificacao:editar`
- ✅ `precificacao:recalcular`
- ✅ `precificacao:exportar`
- ✅ `precificacao:ver_custos`
- ✅ `precificacao:ver_margens`
- ✅ `precificacao:editar_custo`
- ✅ `precificacao:editar_preco`

### Visualizador
- ✅ `precificacao:visualizar`
- ✅ `precificacao:ver_custos`
- ✅ `precificacao:ver_margens`

---

## 🚀 Próximos Passos

1. **Executar o script SQL atualizado** no banco de dados:
   ```bash
   # Execute scripts_rbac_popular_banco.sql no SQL Server
   ```

2. **Reiniciar o backend** para carregar as novas permissões

3. **Fazer logout e login** novamente para que as permissões sejam recarregadas

4. **Testar o módulo** com diferentes perfis de usuário:
   - Admin (acesso total)
   - Analista Comercial (edição completa)
   - Gerente de Qualidade (visualização + exportação)
   - Visualizador (apenas leitura)

---

## ⚠️ Atenção

- A rota permanece `/remarcacao` no frontend
- O nome interno do componente mudou de `Dashboard` para `Precificacao`
- Todas as permissões `dashboard:*` foram substituídas por `precificacao:*`
- Usuários precisam refazer login após a atualização das permissões no banco

---

## 📝 Notas Técnicas

- O hook `usePrecificacaoPermissions` mantém a mesma interface do anterior
- Componentes filhos (`CustomizeModal`, `EditableCell`) foram atualizados automaticamente
- Não há breaking changes na API ou nas rotas
- A mudança é principalmente semântica e de organização de permissões

