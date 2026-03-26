from pydantic import BaseModel

class LoginData(BaseModel):
    login: str
    senha: str

class Token(BaseModel):
    access_token: str
    token_type: str
    nivel_acesso: str
    usuario: str