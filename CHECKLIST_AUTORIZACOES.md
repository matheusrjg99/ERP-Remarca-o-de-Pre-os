# 🚀 Checklist: Implementação de Autorizações RBAC

## ✅ O que já está implementado e funcionando

### Backend (Python/FastAPI)

- [x] **Autenticação JWT** (`/backend/auth/seguranca.py`)
  - [x] Geração de token com expiração de 24h
  - [x] Inclusão de permissões no payload do token
  - [x] Hash de senhas com PBKDF2
  - [x] Busca de permissões baseado no cargo do usuário
  - [x] Admin total recebe todas as permissões automaticamente

- [x] **Validação de Token** (`/backend/security.py`)
  - [x] Extração e decodificação do JWT
  - [x] Validação de expiração
  - [x] Decorator `requer_permissao()` para proteger rotas
  - [x] Admin bypass automático

- [x] **Endpoints de Auth** (`/backend/routes/core/auth.py`)
  - [x] POST `/auth/login` - Login com retorno de permissões
  - [x] GET `/auth/meus-dados` - Dados do usuário autenticado
  - [x] GET `/auth/usuarios` - Lista usuários para RBAC

- [x] **Gestão RBAC** (`/backend/routes/core/rbac.py`)
  - [x] CRUD completo de permissões
  - [x] CRUD completo de cargos
  - [x] Associação de permissões a cargos
  - [x] Atribuição de cargos a usuários
  - [x] Verificação de permissão por usuário
  - [x] Todas as rotas protegidas com JWT

### Frontend (React)

- [x] **Login e Armazenamento** (`/frontend/src/pages/Login/index.jsx`)
  - [x] Salvamento do token JWT
  - [x] Salvamento das permissões no localStorage
  - [x] Salvamento do nível de acesso

- [x] **HTTP Client com Auth** (`/frontend/src/api/axios.js`)
  - [x] Interceptor adiciona token em todas as requisições
  - [x] Tratamento de erro 401 (token expirado)
  - [x] Logout automático em caso de expiração

- [x] **Hooks de Permissão**
  - [x] `usePermissions.js` - Hook genérico com funções:
    - `hasPermission(code)` - Verifica permissão única
    - `hasAnyPermission([codes])` - Verifica se tem alguma
    - `hasAllPermissions([codes])` - Verifica se tem todas
    - `hasModuleAccess(modulo)` - Verifica acesso ao módulo
    - `refreshPermissions()` - Recarrega do localStorage
    - `can` / `cannot` - Atalhos para verificação
  - [x] `useDashboardPermissions.js` - Hook especializado para dashboard

- [x] **Componentes de Proteção**
  - [x] `ProtectedRoute.jsx` - Protege rotas inteiras
  - [x] `Can.jsx` - Renderiza condicionalmente por permissão
  - [x] `CanAny` - Renderiza se tiver qualquer permissão da lista
  - [x] `CanAll` - Renderiza se tiver todas as permissões
  - [x] `CanModule` - Renderiza se tiver acesso ao módulo
  - [x] `PermissionGuard.jsx` - HOC para proteção de componentes
  - [x] `RBACManager.jsx` - Interface gráfica para gestão de acessos

- [x] **Componentes com RBAC no Dashboard**
  - [x] `EditableCell.jsx` - Verifica permissão por coluna
  - [x] `ProductRow.jsx` - Suporte a `podeVerCustos` e `podeEditarCelulas`
  - [x] Botão de recálculos com verificação de permissão

---

## 📋 Passo a Passo para Configurar Autorizações

### 1️⃣ Criar Permissões Necessárias

```bash
# Via API (requer token admin)
curl -X POST http://localhost:8000/rbac/permissoes \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "dashboard:exportar",
    "descricao": "Exportar dados do dashboard",
    "modulo": "dashboard",
    "ativo": true
  }'
```

**Permissões já disponíveis:**
- `admin_total` - Acesso total (automático para ADMIN)
- `rbac:*` - Gestão de cargos e permissões
- `dashboard:*` - Funcionalidades do dashboard
- `nc:*` - Notas crédito
- `cadastros:*` - Cadastros em geral

### 2️⃣ Criar um Cargo

```bash
curl -X POST http://localhost:8000/rbac/cargos \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Vendedor Júnior",
    "descricao": "Acesso básico para vendedores",
    "ativo": true
  }'
```

### 3️⃣ Associar Permissões ao Cargo

```bash
# Primeiro, liste as permissões para pegar os IDs
curl -X GET http://localhost:8000/rbac/permissoes \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"

# Depois associe (substitua os IDs)
curl -X PUT http://localhost:8000/rbac/cargos/1 \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissoes_ids": [1, 5, 12, 18]
  }'
```

### 4️⃣ Atribuir Cargo ao Usuário

```bash
curl -X PUT http://localhost:8000/rbac/cargos/usuarios/3 \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "cargo_id": 1
  }'
```

### 5️⃣ ⚠️ USUÁRIO DEVE REFAZER LOGIN

**IMPORTANTE:** As permissões são carregadas apenas no momento do login. Após atribuir cargo:

1. Usuário deve clicar em **Logout**
2. Fazer **Login** novamente
3. Novas permissões serão aplicadas

---

## 🧪 Testando a Implementação

### Teste 1: Verificar Permissões no Frontend

```javascript
// No console do navegador (F12)
console.log('Token:', localStorage.getItem('access_token'));
console.log('Permissões:', JSON.parse(localStorage.getItem('permissoes')));
console.log('Nível:', localStorage.getItem('nivel_acesso'));
```

### Teste 2: Usar Hook no React

```javascript
import { usePermissions } from './hooks/usePermissions';

function MeuComponente() {
  const { can, cannot, isAdmin } = usePermissions();
  
  return (
    <div>
      {can('nc:criar') ? (
        <button>Criar NC</button>
      ) : (
        <p>Sem permissão</p>
      )}
      
      {isAdmin && <span>👑 Admin</span>}
    </div>
  );
}
```

### Teste 3: Componente Can

```javascript
import { Can } from './components/Can';

function Menu() {
  return (
    <nav>
      <Can permission="nc:listar">
        <a href="/nc">Notas Crédito</a>
      </Can>
      
      <Can permission="dashboard:ver_custos">
        <a href="/custos">Custos</a>
      </Can>
    </nav>
  );
}
```

### Teste 4: Backend - Acessar Rota Protegida

```bash
# Sem token - deve retornar 401
curl -X GET http://localhost:8000/rbac/cargos

# Com token válido mas sem permissão - deve retornar 403
curl -X GET http://localhost:8000/rbac/cargos \
  -H "Authorization: Bearer TOKEN_SEM_PERMISSAO"

# Com token e permissão - deve retornar 200
curl -X GET http://localhost:8000/rbac/cargos \
  -H "Authorization: Bearer TOKEN_COM_PERMISSAO"
```

### Teste 5: Verificar Permissão Específica de Usuário

```bash
curl -X GET "http://localhost:8000/rbac/usuarios/3/verificar-permissao?permissao_codigo=dashboard:recalcular" \
  -H "Authorization: Bearer TOKEN_ADMIN"

# Retorna:
{
  "usuario_id": 3,
  "permissao": "dashboard:recalcular",
  "autorizado": true
}
```

---

## 🔍 Debug de Problemas Comuns

### Problema: "Usuário não tem permissão"

**Verifique:**

1. **Usuário tem cargo atribuído?**
   ```sql
   SELECT u.login, u.cargo_id, c.nome as cargo_nome 
   FROM API_USUARIOS u
   LEFT JOIN cargos c ON u.cargo_id = c.id
   WHERE u.login = 'joao.silva'
   ```

2. **Cargo está ativo?**
   ```sql
   SELECT id, nome, ativo FROM cargos WHERE id = (SELECT cargo_id FROM API_USUARIOS WHERE login = 'joao.silva')
   ```

3. **Cargo tem permissões associadas?**
   ```sql
   SELECT p.codigo 
   FROM permissoes p
   INNER JOIN cargo_permissoes cp ON p.id = cp.permissao_id
   WHERE cp.cargo_id = (SELECT cargo_id FROM API_USUARIOS WHERE login = 'joao.silva')
   AND p.ativo = 1
   ```

4. **Usuário refez o login após mudança?**
   - Se não → Fazer logout e login novamente

5. **Token está sendo enviado nas requisições?**
   ```javascript
   // Console do navegador
   console.log(localStorage.getItem('access_token'));
   ```

### Problema: "Admin não tem acesso total"

**Verifique:**

1. **Nível de acesso no banco:**
   ```sql
   SELECT login, nivel_acesso FROM API_USUARIOS WHERE login = 'admin'
   -- Deve retornar 'ADMIN' (maiúsculo)
   ```

2. **Permissões no token:**
   ```javascript
   JSON.parse(localStorage.getItem('permissoes'))
   // Deve incluir 'admin_total'
   ```

3. **Decorator no backend:**
   ```python
   # Em security.py, linha ~53
   if "admin_total" in user_data["permissions"]:
       return user_data  # Admin bypass
   ```

---

## 📊 Exemplo de Uso Prático

### Cenário: Nova funcionária de vendas

1. **Criar permissões necessárias** (se não existirem):
   - `nc:criar` - Criar nota crédito
   - `nc:listar` - Listar notas crédito
   - `dashboard:ver` - Ver dashboard
   - `cadastros:clientes` - Ver clientes

2. **Criar cargo "Vendedor":**
   ```bash
   POST /rbac/cargos {"nome": "Vendedor", "descricao": "Equipe de vendas"}
   ```

3. **Associar permissões ao cargo:**
   ```bash
   PUT /rbac/cargos/{id} {"permissoes_ids": [1, 2, 15, 20]}
   ```

4. **Atribuir cargo à usuária:**
   ```bash
   PUT /rbac/cargos/usuarios/{id_usuario} {"cargo_id": {id_cargo_vendedor}}
   ```

5. **Usuária faz login:**
   - Sistema carrega permissões do cargo
   - Token JWT inclui: `["nc:criar", "nc:listar", "dashboard:ver", "cadastros:clientes"]`

6. **No frontend:**
   ```jsx
   // Botão aparece porque tem permissão
   <Can permission="nc:criar">
     <button>Criar Nota Crédito</button>
   </Can>
   
   // Coluna some porque não tem permissão
   {podeVerCustos && <ColunaCusto />}
   ```

---

## 🎯 Melhores Práticas

### ✅ Faça:
- Sempre verificar permissões no backend E frontend
- Usar hooks (`usePermissions`) para lógica reutilizável
- Componentizar verificações (`<Can permission="...">`)
- Nomear permissões de forma consistente: `modulo:acao`
- Manter permissões ativas/inativas conforme necessidade
- Testar cenários de usuário sem cargo

### ❌ Não faça:
- Confiar apenas na validação frontend (é burlável)
- Hardcode de permissões no código
- Esquecer de invalidar cache após logout
- Usar nomes genéricos como `user_permission_1`
- Permitir edição de cargo sem fazer logout/login

---

## 📚 Arquivos para Referência

| Camada | Arquivo | Finalidade |
|--------|---------|------------|
| **Backend** | `/backend/auth/seguranca.py` | Gera token, busca permissões |
| **Backend** | `/backend/security.py` | Valida token, decorator |
| **Backend** | `/backend/routes/core/auth.py` | Login, dados usuário |
| **Backend** | `/backend/routes/core/rbac.py` | CRUD cargos/permissoes |
| **Frontend** | `/frontend/src/pages/Login/index.jsx` | Autenticação inicial |
| **Frontend** | `/frontend/src/api/axios.js` | Interceptor de token |
| **Frontend** | `/frontend/src/hooks/usePermissions.js` | Hook principal |
| **Frontend** | `/frontend/src/hooks/useDashboardPermissions.js` | Hook dashboard |
| **Frontend** | `/frontend/src/components/Can.jsx` | Componente condicional |
| **Frontend** | `/frontend/src/components/RBACManager.jsx` | UI de gestão |

---

**Status:** ✅ Implementação Completa  
**Última atualização:** Dezembro 2024
