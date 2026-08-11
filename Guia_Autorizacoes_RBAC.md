# 📘 Guia Prático: Como Fazer as Autorizações RBAC Funcionarem

## ✅ Status Atual do Sistema

O sistema **JÁ POSSUI** toda a infraestrutura necessária:

### Backend (Python/FastAPI)
- ✅ `backend/auth/seguranca.py` - Geração e validação de JWT com permissões
- ✅ `backend/security.py` - Decorator `requer_permissao()` para proteger rotas
- ✅ `backend/routes/core/auth.py` - Login que retorna token + permissões
- ✅ `backend/routes/core/rbac.py` - CRUD completo de cargos e permissões

### Frontend (React)
- ✅ `frontend/src/pages/Login/index.jsx` - Login salva permissões no localStorage
- ✅ `frontend/src/api/axios.js` - Interceptor envia token em todas requisições
- ✅ `frontend/src/hooks/usePermissions.js` - Hook para verificar permissões
- ✅ `frontend/src/components/Can.jsx` - Componentes `<Can>`, `<CanAny>`, `<CanAll>`
- ✅ `frontend/src/components/PermissionGuard.jsx` - HOC e guards avançados
- ✅ `frontend/src/components/RBACManager.jsx` - Interface de gestão de cargos
- ✅ `frontend/src/components/ProtectedRoute.jsx` - Proteção de rotas

---

## 🎯 Passo a Passo para Configurar Autorizações

### PASSO 1: Criar Permissões no Banco de Dados

As permissões devem existir na tabela `dbo.permissoes`:

```sql
-- Exemplo de permissões para o módulo NC (Não Conformidades)
INSERT INTO dbo.permissoes (codigo, descricao, modulo, ativo) VALUES
('nc:listar', 'Listar não conformidades', 'nc', 1),
('nc:criar', 'Criar nova não conformidade', 'nc', 1),
('nc:editar', 'Editar não conformidade', 'nc', 1),
('nc:excluir', 'Excluir não conformidade', 'nc', 1),
('nc:visualizar_relatorio', 'Visualizar relatório de NCs', 'nc', 1);

-- Permissões para o módulo Cadastros
INSERT INTO dbo.permissoes (codigo, descricao, modulo, ativo) VALUES
('cadastros:colaboradores:visualizar', 'Visualizar colaboradores', 'cadastros', 1),
('cadastros:colaboradores:criar', 'Criar colaborador', 'cadastros', 1),
('cadastros:colaboradores:editar', 'Editar colaborador', 'cadastros', 1);

-- Permissões para o módulo Comissões
INSERT INTO dbo.permissoes (codigo, descricao, modulo, ativo) VALUES
('comissoes:configurar', 'Configurar comissões', 'comissoes', 1),
('comissoes:ver', 'Visualizar comissões', 'comissoes', 1),
('comissoes:ver_resumo_total', 'Ver resumo total de comissões', 'comissoes', 1);
```

### PASSO 2: Criar Cargos com Permissões Associadas

Use o próprio sistema via interface ou API:

#### Opção A: Via Interface RBACManager (Recomendado)
1. Acesse o sistema como ADMIN
2. Clique no botão de Gestão de Acessos (ícone de escudo)
3. Na aba "Cargos e Permissões", clique em "Novo Cargo"
4. Preencha nome e descrição
5. Marque as permissões desejadas por módulo
6. Salve

#### Opção B: Via API
```bash
# 1. Criar cargo
curl -X POST http://localhost:8000/rbac/cargos \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Operador NC",
    "descricao": "Pode criar e visualizar NCs",
    "ativo": true
  }'

# 2. Associar permissões ao cargo (use os IDs das permissões)
curl -X PUT http://localhost:8000/rbac/cargos/ID_DO_CARGO \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissoes_ids": [1, 2, 3]
  }'
```

### PASSO 3: Atribuir Cargo aos Usuários

#### Via Interface RBACManager:
1. Abra RBACManager
2. Vá para aba "Usuários"
3. Clique em "Alterar Cargo" no usuário desejado
4. Selecione o cargo da lista
5. Confirme

#### Via API:
```bash
curl -X PUT http://localhost:8000/rbac/cargos/usuarios/ID_USUARIO \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"cargo_id": ID_DO_CARGO}'
```

### ⚠️ PASSO CRÍTICO 4: Usuário Deve Refazer Login

**ISSO É ESSENCIAL:** Após atribuir/modificar cargo de um usuário:

1. O usuário deve fazer **LOGOUT**
2. E depois **LOGIN** novamente

**Por quê?** As permissões são carregadas do banco **apenas no momento do login** e salvas no token JWT e localStorage. Alterações no cargo só surtem efeito após novo login.

---

## 🔍 Como Verificar se Está Funcionando

### No Frontend (Console do Navegador)

Após login, execute:
```javascript
// Ver permissões salvas
console.log('Permissões:', JSON.parse(localStorage.getItem('permissoes')));

// Ver nível de acesso
console.log('Nível:', localStorage.getItem('nivel_acesso'));

// Ver token (opcional)
console.log('Token:', localStorage.getItem('access_token'));
```

### Testando com Diferentes Usuários

1. **Login como ADMIN:**
   ```javascript
   // Deve retornar ['admin_total']
   console.log(JSON.parse(localStorage.getItem('permissoes')));
   ```

2. **Login como USUÁRIO COM CARGO:**
   ```javascript
   // Deve retornar permissões específicas do cargo
   console.log(JSON.parse(localStorage.getItem('permissoes')));
   // Ex: ['nc:listar', 'nc:criar', 'cadastros:colaboradores:visualizar']
   ```

3. **Login como USUÁRIO SEM CARGO:**
   ```javascript
   // Deve retornar [] (vazio)
   console.log(JSON.parse(localStorage.getItem('permissoes')));
   ```

### No Backend (Logs)

O arquivo `backend/auth/seguranca.py` possui logs de debug:
```python
print(f"DEBUG Cargo do usuário {login}: {resultado_cargo}")
print(f"DEBUG Permissões brutas do banco para {login}: {resultado}")
```

Monitore esses logs ao fazer login para verificar se as permissões estão sendo carregadas corretamente.

---

## 🛡️ Como Proteger Componentes e Rotas

### Exemplo 1: Proteger Botão com `<Can>`

```jsx
import { Can } from '../../components/Can';

// Botão só aparece se tiver permissão
<Can permission="nc:criar" fallback={null}>
  <button onClick={handleNovaNC}>Nova Não Conformidade</button>
</Can>
```

### Exemplo 2: Proteger Múltiplas Permissões

```jsx
import { CanAny, CanAll } from '../../components/Can';

// Aparece se tiver QUALQUER UMA das permissões
<CanAny permissions={['nc:editar', 'nc:excluir']} fallback={null}>
  <button>Gerenciar NC</button>
</CanAny>

// Aparece apenas se tiver TODAS as permissões
<CanAll permissions={['nc:criar', 'nc:editar', 'nc:excluir']} fallback={null}>
  <button>Controle Total de NCs</button>
</CanAll>
```

### Exemplo 3: Proteger Módulo Inteiro

```jsx
import { CanModule } from '../../components/Can';

// Só renderiza se tiver alguma permissão do módulo 'nc'
<CanModule module="nc" fallback={<p>Acesso negado ao módulo NC</p>}>
  <ListaDeNCs />
</CanModule>
```

### Exemplo 4: Usando Hook em Lógica Condicional

```jsx
import { usePermissions } from '../../hooks/usePermissions';

function MinhaPagina() {
  const { hasPermission, isAdmin } = usePermissions();
  
  if (!hasPermission('nc:criar') && !isAdmin) {
    return <p>Você não pode criar NCs</p>;
  }
  
  return (
    <div>
      {hasPermission('nc:criar') && <button>Criar NC</button>}
      {hasPermission('nc:editar') && <button>Editar NC</button>}
    </div>
  );
}
```

### Exemplo 5: Proteger Coluna na Tabela (Dashboard)

```jsx
import { PermissionGuard } from '../../components/PermissionGuard';

// Coluna só aparece para quem tem permissão
<PermissionGuard permissions={['dashboard:ver_coluna_financeiro']} fallback={null}>
  <th>Valores Financeiros</th>
</PermissionGuard>

// Em células da tabela
{produtos.map(produto => (
  <tr key={produto.id}>
    <td>{produto.nome}</td>
    <PermissionGuard 
      permissions={['dashboard:editar_valores']} 
      fallback={<td>{produto.valor}</td>}
      renderType="disabled"
    >
      <td>
        <EditableCell value={produto.valor} onEdit={handleEdit} />
      </td>
    </PermissionGuard>
  </tr>
))}
```

### Exemplo 6: Proteger Rota Inteira

No `App.jsx`:
```jsx
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={
    <CanModule module="dashboard" fallback={<Navigate to="/unauthorized" />}>
      <Dashboard />
    </CanModule>
  } />
</Route>
```

---

## 🧪 Cenários de Teste

### Cenário 1: Usuário sem Cargo (Acesso Zero)
1. Crie usuário sem atribuir cargo
2. Faça login
3. **Resultado esperado:** Nenhuma funcionalidade protegida aparece
4. **API retorna:** 403 Forbidden em endpoints protegidos

### Cenário 2: Usuário com Cargo Parcial
1. Crie cargo com apenas `nc:listar` e `nc:criar`
2. Atribua ao usuário
3. Faça logout e login novamente
4. **Resultado esperado:**
   - ✅ Botão "Nova NC" aparece
   - ✅ Lista de NCs aparece
   - ❌ Botão "Editar" não aparece
   - ❌ Botão "Excluir" não aparece
   - ❌ Menu "Comissões" não aparece

### Cenário 3: Admin Total
1. Usuário com `nivel_acesso = 'ADMIN'`
2. **Resultado esperado:** Tudo aparece, todas APIs liberadas
3. **Token contém:** `permissions: ['admin_total']`

### Cenário 4: Troca de Cargo
1. Usuário logado com cargo "Operador"
2. Admin altera cargo para "Gerente"
3. **Usuário continua navegando:** Ainda tem permissões antigas
4. **Após logout + login:** Novas permissões de gerente aplicadas

---

## 🐛 Problemas Comuns e Soluções

### Problema: "Usuário não tem permissões mesmo após atribuir cargo"

**Causa:** Usuário não refez login após mudança.

**Solução:**
```javascript
// Forçar logout programaticamente (se necessário)
localStorage.removeItem('access_token');
localStorage.removeItem('permissoes');
localStorage.removeItem('nivel_acesso');
window.location.href = '/';
```

### Problema: "Componente some mas não mostra fallback"

**Causa:** `fallback` não definido ou loading ainda ativo.

**Solução:**
```jsx
<Can permission="nc:criar" fallback={<p className="text-red-500">Sem permissão</p>}>
  <button>Criar</button>
</Can>
```

### Problema: "API retorna 403 mesmo com token válido"

**Causa:** Permissão específica não existe no cargo.

**Solução:**
1. Verifique permissões no console: `JSON.parse(localStorage.getItem('permissoes'))`
2. Confira se endpoint usa decorator correto: `@router.get(..., dependencies=[Depends(requer_permissao("modulo:acao"))])`
3. Adicione permissão faltante ao cargo via RBACManager

### Problema: "Token expira muito rápido"

**Solução:** Ajustar tempo em `backend/auth/seguranca.py`:
```python
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 horas (atual)
# Ou aumentar conforme necessidade
```

---

## 📋 Checklist de Validação Final

- [ ] Permissões criadas na tabela `dbo.permissoes`
- [ ] Cargos criados na tabela `dbo.cargos`
- [ ] Associação cargo-permissões feita em `dbo.cargo_permissoes`
- [ ] Usuários vinculados a cargos em `dbo.API_USUARIOS.cargo_id`
- [ ] Login realizado após atribuição de cargo
- [ ] Permissões aparecem no console do navegador
- [ ] Token JWT enviado em todas requisições (ver Network tab)
- [ ] Componentes protegidos com `<Can>` ou hooks
- [ ] Endpoints backend protegidos com `requer_permissao()`
- [ ] Teste com usuário ADMIN (acesso total)
- [ ] Teste com usuário comum (acesso parcial)
- [ ] Teste com usuário sem cargo (acesso zero)

---

## 🚀 Próximos Passos Sugeridos

1. **Implementar Refresh Token** (opcional): Para evitar logout automático
2. **Blacklist de Tokens**: Para invalidar tokens antes da expiração
3. **Logs de Auditoria**: Registrar tentativas de acesso negado
4. **Testes Automatizados**: Criar testes unitários para RBAC
5. **Documentação de Permissões**: Listar todas permissões disponíveis por módulo

---

## 📞 Dúvidas Frequentes

**Q: Posso adicionar permissões dinamicamente sem reload?**
R: Sim, chame `refreshPermissions()` do hook `usePermissions` após atualização.

**Q: Como lidar com múltiplos módulos?**
R: Use prefixos: `modulo:acao` (ex: `nc:criar`, `cadastros:editar`).

**Q: Admin sempre tem acesso total?**
R: Sim, usuários com `nivel_acesso='ADMIN'` recebem automaticamente `admin_total`.

**Q: Posso ter permissões hierárquicas?**
R: Sim, crie permissões como `nc:total` que implica em todas outras de NC.

---

**Documento gerado em:** $(date)
**Versão do Sistema:** 1.0 (JWT + RBAC completos)
