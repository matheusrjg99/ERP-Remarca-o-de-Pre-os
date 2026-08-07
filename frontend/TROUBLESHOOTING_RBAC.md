# 🔧 Troubleshooting - Permissões RBAC não funcionam

## Problema Comum: Permissões por Cargo Não Funcionam

Se você configurou cargos e permissões, mas os usuários continuam sem acesso ou com acesso indevido, siga este guia:

---

## ✅ Checklist de Verificação

### 1. **O usuário tem um cargo atribuído?**
- Acesse: Avatar → Configurações de Acesso → Aba "Usuários"
- Verifique se o usuário tem um cargo atribuído (não pode estar "Sem cargo")
- Se não tiver cargo, atribua um cargo válido

### 2. **O cargo tem permissões configuradas?**
- Acesse: Avatar → Configurações de Acesso → Aba "Cargos e Permissões"
- Clique em "Editar Permissões" no cargo desejado
- Verifique se há pelo menos uma permissão marcada
- **Importante:** Salve as alterações após marcar as permissões

### 3. **As permissões existem no banco de dados?**
Execute esta query SQL para verificar:
```sql
SELECT id, codigo, modulo, descricao, ativo 
FROM dbo.permissoes 
WHERE ativo = 1 
ORDER BY modulo, codigo
```
- Verifique se os códigos das permissões correspondem aos usados no frontend/backend
- Exemplos válidos: `nc:visualizar`, `cadastros:colaboradores:criar`, `comissoes:configurar`

### 4. **O vínculo cargo-permissão está correto?**
```sql
SELECT c.nome as cargo, p.codigo as permissao
FROM dbo.cargos c
INNER JOIN dbo.cargo_permissoes cp ON c.id = cp.cargo_id
INNER JOIN dbo.permissoes p ON cp.permissao_id = p.id
WHERE c.ativo = 1 AND p.ativo = 1
ORDER BY c.nome, p.codigo
```

### 5. **O usuário fez logout e login novamente?**
⚠️ **CRÍTICO:** As permissões são carregadas **apenas no momento do login** e salvas no localStorage.

**Solução:**
1. Faça logout do usuário afetado
2. Faça login novamente
3. Verifique no console do navegador (F12) se as permissões foram carregadas:
   ```javascript
   console.log(JSON.parse(localStorage.getItem('permissoes')))
   ```

---

## 🐛 Problemas Conhecidos e Soluções

### Problema A: Usuário ADMIN sem acesso total
**Causa:** Campo `nivel_acesso` na tabela `API_USUARIOS` não está como 'ADMIN'

**Solução:**
```sql
UPDATE dbo.API_USUARIOS 
SET nivel_acesso = 'ADMIN' 
WHERE login = 'usuario_afetado'
```

### Problema B: Permissões voltam vazias após login
**Causa:** Query SQL no backend está filtrando permissões incorretamente

**Verifique no arquivo `backend/auth/seguranca.py`:**
- A função `obter_permissoes_usuario()` deve retornar lista de strings
- Query usa LEFT JOIN corretamente
- Filtro `ativo = 1` está presente em cargos e permissões

### Problema C: Frontend não reconhece permissões
**Causa:** Formato inválido no localStorage

**Solução:**
1. Abra o console do navegador (F12)
2. Execute: `localStorage.removeItem('permissoes')`
3. Faça logout e login novamente
4. Verifique se o array foi criado corretamente

### Problema D: Botões aparecem mas ação retorna 403
**Causa:** Backend exige permissão diferente da verificada no frontend

**Solução:**
- Verifique no código do backend qual permissão está sendo exigida:
  ```python
  @router.get("/rota", dependencies=[Depends(requer_permissao("nc:visualizar"))])
  ```
- No frontend, use a MESMA permissão:
  ```jsx
  <Can permission="nc:visualizar">
    <Botao />
  </Can>
  ```

---

## 🔍 Debug Passo a Passo

### Passo 1: Verificar Login
No console do navegador, após login:
```javascript
// Deve mostrar array com códigos de permissão
console.log('Permissões:', JSON.parse(localStorage.getItem('permissoes')));
```

### Passo 2: Testar Hook usePermissions
Em qualquer componente React:
```javascript
import { usePermissions } from './hooks/usePermissions';

function Teste() {
  const { permissions, hasPermission, isAdmin } = usePermissions();
  
  console.log('Todas permissões:', permissions);
  console.log('É admin?', isAdmin);
  console.log('Tem nc:visualizar?', hasPermission('nc:visualizar'));
  
  return null;
}
```

### Passo 3: Testar Backend Diretamente
Use curl ou Postman:
```bash
curl -X GET "http://localhost:8000/rbac/cargos" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Passo 4: Verificar Logs do Backend
No terminal onde o backend está rodando, procure por:
- "Erro ao buscar permissões para [login]"
- Mensagens de erro 403 Forbidden

---

## 📋 Estrutura Esperada das Tabelas

### API_USUARIOS
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | int | PK |
| login | varchar | Username único |
| senha_hash | varchar | Hash da senha |
| nome | varchar | Nome completo |
| cargo_id | int | FK para cargos |
| nivel_acesso | varchar | 'ADMIN' ou NULL |
| ativo | bit | 1 = ativo |

### cargos
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | int | PK |
| nome | varchar | Nome do cargo |
| descricao | text | Descrição opcional |
| ativo | bit | 1 = ativo |

### permissoes
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | int | PK |
| codigo | varchar | Código único (ex: nc:criar) |
| descricao | varchar | Descrição legível |
| modulo | varchar | Módulo (admin, nc, cadastros) |
| ativo | bit | 1 = ativo |

### cargo_permissoes
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| cargo_id | int | FK para cargos |
| permissao_id | int | FK para permissoes |
| criado_em | datetime | Data de vinculação |

---

## 🆘 Ainda não funciona?

Execute estas queries de diagnóstico:

```sql
-- 1. Verificar usuário e seu cargo
SELECT u.login, u.nome, u.nivel_acesso, u.cargo_id, c.nome as cargo_nome
FROM dbo.API_USUARIOS u
LEFT JOIN dbo.cargos c ON u.cargo_id = c.id
WHERE u.login = 'usuario_teste'

-- 2. Verificar permissões do cargo
SELECT p.codigo, p.descricao, p.modulo
FROM dbo.permissoes p
INNER JOIN dbo.cargo_permissoes cp ON p.id = cp.permissao_id
INNER JOIN dbo.cargos c ON cp.cargo_id = c.id
WHERE c.nome = 'Nome do Cargo' AND c.ativo = 1 AND p.ativo = 1

-- 3. Contar permissões por cargo
SELECT c.nome, COUNT(cp.permissao_id) as qtd_permissoes
FROM dbo.cargos c
LEFT JOIN dbo.cargo_permissoes cp ON c.id = cp.cargo_id
GROUP BY c.nome
ORDER BY qtd_permissoes DESC
```

---

## ✨ Melhores Práticas

1. **Sempre teste com um usuário de teste** antes de aplicar em produção
2. **Documente as permissões** de cada cargo em uma planilha
3. **Use nomes descritivos** para cargos (ex: "Supervisor NC" em vez de "Cargo 1")
4. **Revise permissões periodicamente** para garantir conformidade
5. **Nunca edite permissões diretamente no banco** - use a interface RBAC

---

**Última atualização:** Dezembro 2024  
**Versão do sistema:** 2.0+
