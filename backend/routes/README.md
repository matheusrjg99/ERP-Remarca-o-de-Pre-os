# Estrutura de Rotas - Backend

Esta pasta contém todas as rotas da API organizadas seguindo princípios de arquitetura limpa e separação de responsabilidades.

## 📁 Estrutura de Diretórios

```
routes/
├── __init__.py                 # Router principal que consolida todas as rotas
├── README.md                   # Este arquivo
│
├── core/                       # Funcionalidades essenciais do sistema
│   ├── __init__.py
│   └── auth.py                 # Autenticação e autorização (JWT, login)
│
├── business/                   # Regras de negócio principais
│   ├── __init__.py
│   │
│   ├── administration/         # Gestão administrativa
│   │   ├── users.py            # CRUD de usuários
│   │   ├── settings.py         # Configurações e preferências
│   │   └── management.py       # Logs e administração geral
│   │
│   ├── queries/                # Consultas e leitura de dados
│   │   └── general.py          # Produtos, notas, classificações
│   │
│   └── operations/             # Operações de escrita/atualização
│       └── transactions.py     # Atualizações de preço, custo, markup
│
└── modules/                    # Módulos independentes e específicos
    ├── __init__.py
    ├── collaborators.py        # Gestão de colaboradores
    ├── nonconformities.py      # Não conformidades (NCs)
    ├── disputes.py             # Contestações de NCs
    └── commissions.py          # Configuração de comissões
```

## 🏗️ Arquitetura

### Core (Núcleo)
- **Responsabilidade**: Funcionalidades essenciais e transversais
- **Exemplos**: Autenticação, segurança, middleware
- **Dependências**: Nenhuma (é a base do sistema)

### Business (Regras de Negócio)
- **Responsabilidade**: Implementação das regras principais do ERP
- **Subdivisões**:
  - `administration`: Gestão de usuários, configurações, logs
  - `queries`: Operações de leitura (SELECT)
  - `operations`: Operações de escrita (INSERT, UPDATE, DELETE)

### Modules (Módulos)
- **Responsabilidade**: Funcionalidades específicas e independentes
- **Características**: Podem ser removidos ou adicionados sem afetar o core
- **Exemplos**: Módulo de não conformidades, comissões, colaboradores

## 🚀 Como Adicionar Novas Rotas

1. **Identifique a categoria**:
   - É autenticação? → `core/auth.py`
   - É regra de negócio principal? → `business/...`
   - É módulo independente? → `modules/...`

2. **Crie o arquivo** na pasta apropriada

3. **Registre no `__init__.py`**:
   ```python
   from .sua_pasta.seu_arquivo import router as seu_router
   router.include_router(seu_router)
   ```

## 📝 Padrões de Código

- **Prefixos**: Cada router deve definir seu prefixo (ex: `prefix="/users"`)
- **Tags**: Use tags descritivas para documentação Swagger
- **Imports relativos**: Sempre use imports relativos (`from . import ...`)
- **Documentação**: Inclua docstrings em todas as funções de rota

## 🔧 URLs Resultantes

Com esta estrutura, as URLs da API ficam organizadas assim:

| Método | Endpoint | Descrição | Módulo |
|--------|----------|-----------|--------|
| POST | `/auth/login` | Login de usuário | Core |
| GET | `/users` | Listar usuários | Business/Admin |
| POST | `/users` | Criar usuário | Business/Admin |
| GET | `/settings/preferencias` | Obter preferências | Business/Admin |
| GET | `/admin/logs` | Consultar logs | Business/Admin |
| GET | `/queries/produtos` | Consultar produtos | Business/Queries |
| POST | `/operations/atualizar-preco` | Atualizar preços | Business/Ops |
| GET | `/colaboradores` | Listar colaboradores | Modules |
| POST | `/nao-conformidades` | Criar NC | Modules |

## ✅ Vantagens Desta Organização

1. **Manutenibilidade**: Fácil localizar e modificar funcionalidades
2. **Escalabilidade**: Novos módulos podem ser adicionados sem quebrar existentes
3. **Testabilidade**: Cada módulo pode ser testado isoladamente
4. **Legibilidade**: Nomes claros indicam a responsabilidade de cada arquivo
5. **Separação de Concerns**: Leitura e escrita separadas, core isolado
