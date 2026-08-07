# Resumo da Centralização de Usuários no Bddemo

## ✅ O que foi feito

### 1. Arquivos Modificados para usar `Bddemo`
Os seguintes arquivos foram atualizados para centralizar os cadastros e autenticação de usuários no banco **Bddemo**:

| Arquivo | Alteração | Status |
|---------|-----------|--------|
| `criar_admin.py` | Já estava usando `Bddemo` | ✅ OK |
| `routes/principais/autenticacao.py` | Já estava usando `Bddemo` | ✅ OK |
| `routes/principais/usuarios.py` | Alterado de `Bdenter` para `Bddemo` (3 ocorrências) | ✅ ALTERADO |
| `routes/principais/configuracoes.py` | Alterado de `Bdenter` para `Bddemo` (2 ocorrências) | ✅ ALTERADO |

### 2. Script SQL Criado
Foi criado o arquivo **`/workspace/backend/configurar_bddemo.sql`** que:
- Cria a tabela `API_USUARIOS` no banco `Bddemo` (se não existir)
- Cria a tabela `API_LOGS` no banco `Bddemo` (se não existir)
- Adiciona colunas faltantes automaticamente
- Cria índices para performance

### 3. O que NÃO foi alterado (intencionalmente)
Os arquivos abaixo continuam usando `Bdenter` como banco de **produção**, pois são relacionados a dados operacionais (produtos, notas, preços, etc.):

| Arquivo | Motivo |
|---------|--------|
| `routes/principais/consultas.py` | Consulta produtos, notas, fornecedores em produção |
| `routes/principais/operacoes.py` | Atualiza preços, custos, markup em produção |
| `routes/principais/administracao.py` | Logs operacionais de produção |
| `main.py` | Configuração de ambientes (producao/demo/treina) |

Estes arquivos possuem um seletor de ambiente (`AMBIENTES`) que permite escolher entre:
- `producao` → `Bdenter`
- `demo` → `bddemo`
- `treina` → `bdtreina`

---

## 📋 Próximos Passos (Obrigatórios)

### Passo 1: Executar o Script SQL no Banco Bddemo
No SQL Server Management Studio (SSMS) ou ferramenta similar:

```sql
-- Conecte-se ao banco Bddemo e execute:
-- /workspace/backend/configurar_bddemo.sql
```

Isso criará as tabelas necessárias:
- `API_USUARIOS` (usuários do sistema)
- `API_LOGS` (logs de auditoria)

### Passo 2: Criar o Usuário Administrador
Após executar o script SQL, rode o script Python:

```bash
cd /workspace/backend
python criar_admin.py
```

Isso criará o usuário:
- **Login:** `admin`
- **Senha:** `admin123`
- **Nível:** `ADMIN`

### Passo 3: Testar a Autenticação
1. Inicie o backend: `uvicorn main:app --reload`
2. Acesse `/login` com as credenciais acima
3. Verifique se o token JWT é retornado corretamente

---

## 🔍 Verificação Final

Para confirmar que tudo está correto, execute:

```bash
# Verifica se todos os arquivos de usuário estão usando Bddemo
grep -r "banco=\"Bddemo\"" /workspace/backend/routes/principais/ --include="*.py"

# Verifica se ainda há Bdenter em arquivos de usuário (deve retornar vazio)
grep -r "banco=\"Bdenter\"" /workspace/backend/routes/principais/usuarios.py
grep -r "banco=\"Bdenter\"" /workspace/backend/routes/principais/autenticacao.py
grep -r "banco=\"Bdenter\"" /workspace/backend/routes/principais/configuracoes.py
```

---

## 📌 Observações Importantes

1. **O programa NÃO cria as tabelas automaticamente** - É necessário executar o script SQL manualmente no banco `Bddemo` antes de usar o sistema.

2. **Separação de responsabilidades**:
   - `Bddemo`: Usuários, autenticação, preferências (dados do sistema)
   - `Bdenter`: Produtos, preços, notas fiscais (dados operacionais de produção)
   - `bdtreina`: Ambiente de testes para operações

3. **Logs de auditoria**: As operações de usuários agora serão logadas no `Bddemo.API_LOGS`, enquanto operações em produtos/notas continuarão sendo logadas no banco correspondente ao ambiente selecionado.

4. **Migração de usuários existentes**: Se já existem usuários no `Bdenter`, você pode copiá-los para `Bddemo` executando:

```sql
-- No banco Bddemo, após criar a tabela API_USUARIOS:
INSERT INTO API_USUARIOS (login, senha_hash, nome, nivel_acesso, ativo)
SELECT login, senha_hash, nome, nivel_acesso, ativo
FROM Bdenter.dbo.API_USUARIOS
WHERE login NOT IN (SELECT login FROM API_USUARIOS);
```

---

## ✅ Checklist Final

- [ ] Executar `configurar_bddemo.sql` no banco `Bddemo`
- [ ] Executar `criar_admin.py` para criar usuário admin
- [ ] Testar login com usuário admin
- [ ] Testar cadastro de novo usuário
- [ ] Testar listagem de usuários
- [ ] Testar alteração de status de usuário
- [ ] Testar salvamento de preferências
