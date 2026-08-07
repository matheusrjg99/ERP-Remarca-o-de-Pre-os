# Guia de Permissões RBAC - Sistema Sophon

## 📋 Matriz de Permissões

### Módulo: Não Conformidades (nc)
| Permissão | Descrição | Frontend | Backend |
|-----------|-----------|----------|---------|
| `nc:visualizar` | Ver lista de NCs | Consulta.jsx | GET /nao-conformidades |
| `nc:criar` | Criar nova NC | NovoRegistro.jsx, Menu | POST /nao-conformidades |
| `nc:editar` | Editar NC existente | Botão Editar | PUT /nao-conformidades/{id} |
| `nc:excluir` | Excluir NC | Botão Excluir | DELETE /nao-conformidades/{id} |
| `nc:contestar` | Contestar NC | Botão Contestar | POST /contestacoes |

### Módulo: Cadastros > Colaboradores
| Permissão | Descrição | Frontend | Backend |
|-----------|-----------|----------|---------|
| `cadastros:colaboradores:visualizar` | Ver lista de colaboradores | Equipe.jsx, Menu, Select | GET /colaboradores |
| `cadastros:colaboradores:criar` | Adicionar colaborador | Form Novo Colab | POST /colaboradores |
| `cadastros:colaboradores:editar` | Editar colaborador | Botão Editar | PUT /colaboradores/{id} |
| `cadastros:colaboradores:excluir` | Excluir colaborador | Botão Excluir | DELETE /colaboradores/{id} |

### Módulo: Comissões
| Permissão | Descrição | Frontend | Backend |
|-----------|-----------|----------|---------|
| `comissoes:configurar` | Configurar comissões | Menu, Tela Config | (rotas de comissão) |
| `comissoes:ver` | Ver relatório comissões | Menu, Relatório | GET /comissoes/relatorio |

## 🔧 Como Usar no Frontend

### 1. Ocultar Botões/Ações
```jsx
import { Can } from '../../components/Can';

// Botão só aparece se tiver permissão
<Can permission="nc:criar">
  <button>Novo Registro</button>
</Can>
```

### 2. Ocultar Abas/Menu
```jsx
<Can permission="cadastros:colaboradores:visualizar">
  <button onClick={() => setAbaAtiva('equipe')}>Operadores</button>
</Can>
```

### 3. Proteger Tela Inteira
```jsx
<Can permission="nc:criar" fallback={<SemAcesso acao="registrar NC" />}>
  <NovoRegistro />
</Can>
```

### 4. Ocultar Campos em Formulários
```jsx
<Can permission="cadastros:colaboradores:visualizar">
  <select>{/* lista de colaboradores */}</select>
</Can>
```

## 🔐 Como Usar no Backend

```python
from security import requer_permissao
from fastapi import Depends

@router.get("", dependencies=[Depends(requer_permissao("nc:visualizar"))])
async def listar_ncs():
    # Código da rota
    pass

@router.post("", dependencies=[Depends(requer_permissao("nc:criar"))])
async def criar_nc(nc: NaoConformidadeCreate):
    # Código da rota
    pass
```

## 👥 Cargos Sugeridos

### Operador Júnior
- `nc:visualizar`
- `nc:contestar`

### Operador Pleno
- `nc:visualizar`
- `nc:criar`
- `nc:contestar`

### Supervisor
- `nc:visualizar`
- `nc:criar`
- `nc:editar`
- `nc:contestar`
- `nc:deferir`
- `cadastros:colaboradores:visualizar`

### Admin NC
- Todas as permissões `nc:*`
- `cadastros:colaboradores:*`
- `comissoes:*`

### Admin Total
- `admin_total` (concede tudo automaticamente)

## ⚠️ Importante

1. **Sempre teste** após alterar permissões
2. **Logout/Login** necessário para atualizar permissões no frontend
3. **Backend é a fonte da verdade** - mesmo que o frontend mostre, o backend pode negar
4. Use `fallback={null}` para ocultar sem mostrar mensagem de erro
5. Use `fallback={<SemAcesso />}` para mostrar mensagem educativa

## 🐛 Troubleshooting

### Botão não aparece mas deveria
- Verifique se usuário tem a permissão no localStorage
- Confira se escreveu o código da permissão corretamente
- Teste com usuário admin_total

### Backend retorna 403
- Verifique se o decorator `@Depends(requer_permissao(...))` está correto
- Confirme se o token JWT está sendo enviado
- Veja os logs do backend para detalhes

### Permissão não carrega após login
- Limpe o localStorage e faça login novamente
- Verifique se a resposta do /login inclui campo "permissoes"
