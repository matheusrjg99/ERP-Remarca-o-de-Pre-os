"""Services para o módulo de Precificação de Produtos.

Contém toda a regra de negócio, construção de queries SQL e tratamento de erros lógicos.
Nenhuma lógica de HTTP ou FastAPI deve residir aqui.
"""

from typing import List, Optional, Dict, Any
from fastapi import HTTPException

from backend.database import executar_query
from sql_repo import Scripts

# Mapeamento de ambientes
AMBIENTES = {
    "producao": "Bdenter",
    "demo": "bddemo",
    "treina": "bdtreina"
}


class ProdutoService:
    """Lógica de negócio para precificação de produtos."""

    async def listar_produtos(
        self,
        ambiente: str,
        classificacao: Optional[str] = None,
        fornecedor: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Lista produtos para precificação com custos, preços e markups."""

        db_name = AMBIENTES.get(ambiente, "bdtreina")

        query = Scripts.query['pesquisar_produto']
        params = []

        if classificacao:
            query += " AND p.clasprod LIKE ?"
            params.append(f"{classificacao}%")

        if fornecedor:
            query += " AND f.nome LIKE ?"
            params.append(f"%{fornecedor}%")

        query += " ORDER BY p.codpro"

        resultado = await executar_query(
            banco=db_name,
            query=query,
            params=tuple(params) if params else None,
            usuario="SISTEMA",
            endpoint="/pricing/products/produtos"
        )

        if isinstance(resultado, dict) and "erro" in resultado:
            raise HTTPException(status_code=500, detail=resultado["erro"])

        return resultado if resultado else []

    async def pesquisar_produto_avancado(
        self,
        termo: Optional[str] = "",
        codigo: Optional[str] = "",
        fornecedor: Optional[str] = "",
        classificacao: Optional[str] = "",
        disponibilidade: Optional[str] = "",
        ambiente: str = "treina",
        usuario: str = ""
    ) -> List[Dict[str, Any]]:
        """Pesquisa avançada de produtos com múltiplos filtros dinâmicos."""

        db_name = AMBIENTES.get(ambiente, "bdtreina")

        # Base query SEM WHERE (vamos construir dinamicamente)
        query = """
            SELECT
                p.codpro AS CODPRO,
                cp.descricaolonga AS DESCRICAOLONGA,
                f.NOME AS RAZSOC,
                c.descr AS CLASSIFICACAO,
                i.NOME AS STATUS_DISP
            FROM PRODUTOCAD p
            LEFT JOIN complementoproduto cp ON p.codpro = cp.codpro
            LEFT JOIN FORNECECAD f ON p.codfor = f.oid
            LEFT JOIN item i ON p.Disponibilidade = i.OID
            LEFT JOIN CLASSIFCAD c ON p.clasprod = c.clasprod
        """

        conditions = []
        params = []

        if termo:
            conditions.append("cp.descricaolonga LIKE ?")
            params.append(f"%{termo}%")

        if codigo:
            conditions.append("p.codpro LIKE ?")
            params.append(f"%{codigo}%")

        if fornecedor:
            conditions.append("f.NOME LIKE ?")
            params.append(f"%{fornecedor}%")

        if classificacao:
            if " - " in classificacao:
                clasprod = classificacao.split(" - ")[0].strip().replace(".", "")
                conditions.append("p.clasprod LIKE ?")
                params.append(f"{clasprod}%")
            else:
                class_limpa = classificacao.replace(".", "").strip()
                if class_limpa.isdigit():
                    conditions.append("p.clasprod LIKE ?")
                    params.append(f"{class_limpa}%")
                else:
                    conditions.append("c.descr LIKE ?")
                    params.append(f"%{classificacao}%")

        if disponibilidade:
            status_list = disponibilidade.split(',')
            placeholders = ",".join(["?"] * len(status_list))
            conditions.append(f"i.NOME IN ({placeholders})")
            params.extend(status_list)

        # Monta a query final
        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY p.codpro"

        dados = await executar_query(
            banco=db_name,
            query=query,
            params=tuple(params) if params else None,
            usuario=usuario,
            endpoint="/api/pesquisar"
        )

        return dados if dados else []
