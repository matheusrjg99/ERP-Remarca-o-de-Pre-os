from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class LoginData(BaseModel):
    login: str
    senha: str

class Token(BaseModel):
    access_token: str
    token_type: str
    nivel_acesso: str
    usuario: str
    nome: Optional[str] = None
    permissions: Optional[List[str]] = []

# --- Schemas de Comissão ---

class ComissaoConfigBase(BaseModel):
    colaborador_id: int
    valor_maximo: float

class ComissaoConfigCreate(ComissaoConfigBase):
    pass

class ComissaoConfig(ComissaoConfigBase):
    id: int
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

class PercentualPerdaBase(BaseModel):
    descricao: str
    percentual: float  # Ex: 5.0 para 5%

class PercentualPerdaCreate(PercentualPerdaBase):
    pass

class PercentualPerda(PercentualPerdaBase):
    id: int
    ativo: bool = True
    criado_em: datetime

class ComissaoRelatorioItem(BaseModel):
    colaborador_id: int
    nome_colaborador: str
    valor_maximo_comissao: float
    total_ncs: int
    total_perdas: float
    valor_comissao_final: float
    detalhe_perdas: list

# --- Schemas de RBAC (Controle de Acesso) ---

class PermissaoBase(BaseModel):
    codigo: str
    descricao: str
    modulo: str

class PermissaoCreate(PermissaoBase):
    pass

class Permissao(PermissaoBase):
    id: int

class CargoBase(BaseModel):
    nome: str
    descricao: Optional[str] = None

class CargoCreate(CargoBase):
    permissao_ids: Optional[List[int]] = []

class Cargo(CargoBase):
    id: int
    permissoes: Optional[List[Permissao]] = []

class UsuarioInfo(BaseModel):
    id: int
    login: str
    nome: Optional[str] = None
    email: Optional[str] = None
    cargo_id: Optional[int] = None
    permissions: List[str] = []