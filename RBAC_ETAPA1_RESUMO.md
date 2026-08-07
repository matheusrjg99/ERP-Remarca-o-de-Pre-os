# ✅ ETAPA 1 CONCLUÍDA: Estrutura de Dados RBAC

## Resumo das Implementações

### 1. Banco de Dados (`backend/init.sql`)

#### Tabelas Criadas:
- **`dbo.permissoes`**: Catálogo de permissões do sistema
  - Campos: `id`, `codigo` (único), `descricao`, `modulo`, `ativo`, `criado_em`
  - Índices em `modulo` e `codigo` para performance

- **`dbo.cargos`**: Cargos/funções dos usuários
  - Campos: `id`, `nome` (único), `descricao`, `ativo`, `criado_em`, `atualizado_em`
  - Índices em `nome` e `ativo`

- **`dbo.cargo_permissoes`**: Tabela associativa (many-to-many)
  - Campos: `cargo_id`, `permissao_id`, `criado_em`
  - Chave primária composta: `(cargo_id, permissao_id)`
  - Constraints com CASCADE DELETE

- **`API_USUARIOS.cargo_id`**: Coluna adicionada
  - Foreign key para `dbo.cargos(id)`
  - ON DELETE SET NULL
  - Índice criado para performance

#### Seed de Dados Iniciais:
- **20 Permissões** distribuídas em 4 módulos:
  - `nao_conformidades`: 7 permissões (criar, visualizar, editar, excluir, contestar, auditoria, relatórios)
  - `precificacao`: 5 permissões (visualizar, alterar_preco, alterar_custo, alterar_markup, remarcacao)
  - `cadastros`: 2 permissões (colaboradores, comissoes)
  - `admin`: 3 permissões (usuarios, cargos, configuracoes)

- **4 Cargos Pré-definidos**:
  1. **Administrador**: Todas as 20 permissões
  2. **Gestor**: 12 permissões (auditoria, relatórios, precificação completa, cadastros, configurações)
  3. **Operador**: 9 permissões (NC criar/editar/visualizar/contestar, precificação básica, colaboradores)
  4. **Colaborador**: 2 permissões (apenas visualizar e contestar NCs)

### 2. Backend API (`backend/routes/core/rbac.py`)

#### Rotas de Permissões:
- `GET /rbac/permissoes` - Listar permissões (filtro por módulo)
- `POST /rbac/permissoes` - Criar nova permissão
- `PUT /rbac/permissoes/{id}` - Atualizar permissão
- `DELETE /rbac/permissoes/{id}` - Excluir permissão (se não estiver em uso)

#### Rotas de Cargos:
- `GET /rbac/cargos` - Listar cargos com permissões
- `GET /rbac/cargos/{id}` - Obter cargo detalhado
- `POST /rbac/cargos` - Criar novo cargo
- `PUT /rbac/cargos/{id}` - Atualizar cargo e permissões
- `DELETE /rbac/cargos/{id}` - Excluir cargo (se não tiver usuários)

#### Rotas de Usuário-Cargo:
- `PUT /rbac/usuarios/{usuario_id}/cargo` - Atribuir/remover cargo de usuário

#### Rotas Auxiliares:
- `GET /rbac/usuarios/{usuario_id}/permissoes` - Listar permissões do usuário
- `GET /rbac/usuarios/{usuario_id}/verificar-permissao?permissao_codigo=X` - Verificar permissão específica

#### Modelos Pydantic:
- `PermissaoBase`, `PermissaoCreate`, `PermissaoUpdate`, `PermissaoResponse`
- `CargoBase`, `CargoCreate`, `CargoUpdate`, `CargoResponse`
- `UsuarioCargoUpdate`

### 3. Router Principal (`backend/routes/__init__.py`)
- Importação do módulo `rbac` adicionada
- Router registrado no core da aplicação

## Próximos Passos (Etapa 2)

1. **Decorator de Permissão**: Criar middleware/decorator para proteger rotas
2. **Atualizar Login**: Modificar resposta do login para incluir permissões do usuário
3. **Testes de Integração**: Validar CRUD de cargos e permissões

## Como Executar o Script SQL

No SQL Server Management Studio:
```sql
USE bddemo; -- ou Bdenter para produção
GO

-- Executar o script init.sql completo
-- Ou apenas a parte do RBAC (linhas 225-421)
```

## URLs da API (Após iniciar o backend)

- Swagger UI: `http://localhost:8000/docs`
- Seção RBAC: `/rbac/*`

---

**Status**: ✅ Etapa 1 de 5 concluída  
**Próxima Etapa**: Lógica de Negócio e Segurança (Backend Core)
