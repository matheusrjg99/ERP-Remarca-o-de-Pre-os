# 📋 Guia Completo de Implementação RBAC + JWT

## ✅ Status Atual da Implementação

O sistema de autenticação JWT com RBAC (Role-Based Access Control) já está **completamente implementado** e funcional. Este documento explica como tudo funciona e como garantir que as autorizações funcionem corretamente para cada usuário.

---

## 🔐 Fluxo de Autenticação e Autorização

### 1. **Login do Usuário** (`/frontend/src/pages/Login/index.jsx`)

```javascript
// Backend retorna no login:
{
  "access_token": "jwt_token_aqui",
  "token_type": "bearer",
  "nivel_acesso": "USER",  // ou "ADMIN"
  "usuario": "joao.silva",
  "nome": "João Silva",
  "permissions": ["nc:criar", "nc:listar", "dashboard:ver"]  // Lista de permissões
}

// Frontend salva no localStorage:
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('usuario', data.usuario);
localStorage.setItem('nivel_acesso', data.nivel_acesso);
localStorage.setItem('permissoes', JSON.stringify(data.permissions));
```

### 2. **Token JWT Estrutura** (`/backend/auth/seguranca.py`)

O token contém:
```json
{
  "sub": "login_usuario",
  "nivel": "USER",
  "permissions": ["nc:criar", "dashboard:ver"],
  "nome": "Nome Completo",
  "exp": 1234567890  // Expiração em 24h
}
```

### 3. **Backend Valida Token** (`/backend/security.py`)

```python
async def get_current_user_permissions(request: Request):
    # Extrai token do header Authorization: Bearer <token>
    # Decodifica JWT e valida expiração
    # Retorna: {"user_login": "...", "permissions": [...]}
    
def requer_permissao(permission_code: str):
    # Decorator que verifica se usuário tem permissão
    # Admin com "admin_total" passa automaticamente
```

---

## 🗂️ Banco de Dados - Estrutura RBAC

### Tabelas Envolvidas:

1. **`API_USUARIOS`** - Tabela de usuários
   - `cargo_id` (FK) → Liga ao cargo
   - `nivel_acesso` ('ADMIN' ou 'USER')

2. **`cargos`** - Tabela de cargos/funções
   - `id`, `nome`, `descricao`, `ativo`

3. **`permissoes`** - Catálogo de permissões
   - `id`, `codigo` (ex: 'nc:criar'), `descricao`, `modulo`, `ativo`

4. **`cargo_permissoes`** - Tabela pivô
   - `cargo_id`, `permissao_id`

### Query de Permissões (`/backend/auth/seguranca.py`):

```sql
SELECT DISTINCT p.codigo
FROM API_USUARIOS u
LEFT JOIN cargos c ON u.cargo_id = c.id AND c.ativo = 1
LEFT JOIN cargo_permissoes cp ON c.id = cp.cargo_id
LEFT JOIN permissoes p ON cp.permissao_id = p.id 
    AND p.ativo = 1 
    AND p.codigo IS NOT NULL
WHERE u.login = ? AND u.ativo = 1
```

**Regras:**
- Usuários com `nivel_acesso = 'ADMIN'` recebem automaticamente `["admin_total"]`
- Usuário sem cargo → permissões vazias `[]`
- Cargo inativo → permissões não são consideradas

---

## 🎯 Como Garantir que Autorizações Funcionem

### ✅ **Passo a Passo para Configurar um Novo Usuário**

#### 1. Criar Permissões (se necessário)
```http
POST /rbac/permissoes
Authorization: Bearer <token_admin>

{
  "codigo": "dashboard:exportar",
  "descricao": "Exportar dados do dashboard",
  "modulo": "dashboard",
  "ativo": true
}
```

#### 2. Criar um Cargo
```http
POST /rbac/cargos
Authorization: Bearer <token_admin>

{
  "nome": "Vendedor",
  "descricao": "Acesso limitado para vendedores",
  "ativo": true
}
```

#### 3. Associar Permissões ao Cargo
```http
PUT /rbac/cargos/{cargo_id}
Authorization: Bearer <token_admin>

{
  "permissoes_ids": [1, 5, 12]  // IDs das permissões
}
```

#### 4. Atribuir Cargo ao Usuário
```http
PUT /rbac/cargos/usuarios/{usuario_id}
Authorization: Bearer <token_admin>

{
  "cargo_id": 3  // ID do cargo "Vendedor"
}
```

#### 5. ⚠️ **IMPORTANTE: Usuário Deve Refazer Login**
As permissões são carregadas **apenas no momento do login**. Após atribuir um cargo:
- O usuário precisa fazer **logout**
- E depois **login novamente** para receber as novas permissões

---

## 🔍 Debug e Verificação

### Backend - Verificar Permissões de um Usuário

```bash
# Endpoint de debug (já implementado em seguranca.py)
GET /auth/permissoes-debug?login=joao.silva
Authorization: Bearer <token_admin>
```

### Frontend - Console do Navegador

```javascript
// No console do navegador (F12)
console.log('Token:', localStorage.getItem('access_token'));
console.log('Permissões:', JSON.parse(localStorage.getItem('permissoes')));
console.log('Nível:', localStorage.getItem('nivel_acesso'));
```

### Testar Permissão Específica

```http
GET /rbac/usuarios/{usuario_id}/verificar-permissao?permissao_codigo=dashboard:recalcular
Authorization: Bearer <token_admin>

# Retorna:
{
  "usuario_id": 1,
  "permissao": "dashboard:recalcular",
  "autorizado": true
}
```

---

## 🛡️ Proteção de Rotas e Componentes

### Backend (FastAPI)

```python
from security import requer_permissao

@router.post("/dashboard/recalculo", dependencies=[Depends(requer_permissao("dashboard:recalcular"))])
async def recalcular_dashboard(request: Request):
    # Só acessa se tiver permissão "dashboard:recalcular" ou for admin
```

### Frontend (React) - Hook usePermissions

```javascript
import { usePermissions } from '../../hooks/usePermissions';

function MeuComponente() {
  const { hasPermission, isAdmin } = usePermissions();
  
  if (!hasPermission('dashboard:exportar')) {
    return <p>Sem permissão para exportar</p>;
  }
  
  return <button>Exportar</button>;
}
```

### Frontend - Hook Especializado Dashboard

```javascript
import { useDashboardPermissions } from '../../hooks/useDashboardPermissions';

function Dashboard() {
  const { 
    podeRecalcular, 
    podeVerCustos, 
    podeEditarColuna 
  } = useDashboardPermissions();
  
  // Botão só habilita se tiver permissão
  <button disabled={!podeRecalcular}>
    Recalcular
  </button>
  
  // Coluna só aparece se tiver permissão
  {podeVerCustos && <ColunaCusto />}
}
```

---

## 📋 Lista de Permissões Implementadas

### Módulo: `admin`
- `admin_total` - Acesso total (automático para ADMIN)

### Módulo: `rbac`
- `rbac:listar_cargos`
- `rbac:criar_cargo`
- `rbac:atualizar_cargo`
- `rbac:excluir_cargo`
- `rbac:listar_permissoes`
- `rbac:criar_permissao`
- `rbac:atualizar_permissao`
- `rbac:excluir_permissao`
- `rbac:atribuir_cargo_usuario`
- `rbac:listar_permissoes_usuario`
- `rbac:verificar_permissao_usuario`

### Módulo: `dashboard`
- `dashboard:editar_valores`
- `dashboard:recalcular`
- `dashboard:personalizar_visual`
- `dashboard:editar_regras`
- `dashboard:exportar`
- `dashboard:importar`
- `dashboard:selecionar_nota`
- `dashboard:ver_custos`
- `dashboard:ver_margens`
- `dashboard:editar_custos`
- `dashboard:editar_sugeridos`
- `dashboard:editar_atuais`
- `dashboard:editar_margens`
- `dashboard:editar_descontos`
- `dashboard:recalcular_em_massa`
- `dashboard:importar_em_massa`

### Módulo: `nc` (Nota Crédito)
- `nc:criar`
- `nc:listar`
- `nc:editar`
- `nc:excluir`

### Módulo: `cadastros`
- `cadastros:colaboradores`
- `cadastros:clientes`
- `cadastros:fornecedores`

---

## 🚨 Problemas Comuns e Soluções

### ❌ "Usuário não tem permissão mesmo após configurar cargo"

**Causa:** Usuário não refez login após mudança.

**Solução:**
1. Fazer logout
2. Limpar localStorage (opcional)
3. Fazer login novamente

### ❌ "Permissões voltam vazias após login"

**Causas possíveis:**
1. Usuário não tem cargo atribuído
2. Cargo está inativo (`ativo = 0`)
3. Permissões do cargo estão inativas
4. Query falhou (verificar logs do backend)

**Debug:**
```python
# No backend, verificar logs:
DEBUG Cargo do usuário joao.silva: [{'cargo_id': 3, 'cargo_nome': 'Vendedor', 'cargo_ativo': 1}]
DEBUG Permissões brutas do banco: [{'codigo': 'nc:criar'}, {'codigo': 'dashboard:ver'}]
```

### ❌ "Admin não consegue acessar todas as rotas"

**Causa:** Token não está com `admin_total` nas permissões.

**Verificação:**
```javascript
// No frontend
const perms = JSON.parse(localStorage.getItem('permissoes'));
console.log(perms.includes('admin_total'));  // Deve ser true
```

**Solução:** Verificar se `nivel_acesso = 'ADMIN'` no banco para o usuário.

---

## 🔄 Fluxograma Resumido

```
┌─────────────┐
│   LOGIN     │
│  /auth/login│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│ Backend valida senha            │
│ Busca cargo do usuário          │
│ Busca permissões do cargo       │
│ Se ADMIN → ["admin_total"]      │
│ Cria JWT com permissões         │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Frontend recebe:                │
│ - access_token (JWT)            │
│ - permissions: [...]            │
│ Salva no localStorage           │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Cada requisição inclui:         │
│ Authorization: Bearer <token>   │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Backend valida JWT              │
│ Extrai permissões do token      │
│ Decorator verifica permissão    │
│ Se OK → Executa ação            │
│ Se NÃO → 403 Forbidden          │
└─────────────────────────────────┘
```

---

## 📞 Próximos Passos Sugeridos

1. **Refresh Token**: Implementar renovação automática de token antes de expirar
2. **Blacklist de Tokens**: Invalidar tokens antes da expiração (logout forçado)
3. **Logs de Auditoria**: Registrar tentativas de acesso negado
4. **Testes Automatizados**: Criar testes para validar fluxos de permissão
5. **UI de Permissões**: Melhorar interface do RBACManager para gestão visual

---

## 📚 Arquivos Chave

| Arquivo | Responsabilidade |
|---------|------------------|
| `/backend/auth/seguranca.py` | Criar token, hash senha, buscar permissões |
| `/backend/security.py` | Validar token, decorator de permissão |
| `/backend/routes/core/auth.py` | Endpoints de login e dados do usuário |
| `/backend/routes/core/rbac.py` | Gestão de cargos e permissões |
| `/frontend/src/pages/Login/index.jsx` | Login e salvamento de permissões |
| `/frontend/src/hooks/usePermissions.js` | Hook genérico de verificação |
| `/frontend/src/hooks/useDashboardPermissions.js` | Hook específico do dashboard |
| `/frontend/src/components/RBACManager.jsx` | Interface de gestão de acessos |

---

**Última atualização:** Dezembro 2024  
**Status:** ✅ Implementação Completa e Funcional
