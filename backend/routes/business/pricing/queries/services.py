"""
Serviços para o módulo de Consultas de Precificação.
Contém a lógica de negócios e acesso ao banco de dados.
"""
from typing import List, Dict, Any, Optional
from fastapi import HTTPException

from database import executar_query
from sql_repo import Scripts


AMBIENTES = {
    "producao": "Bdenter",
    "demo": "bddemo",
    "treina": "bdtreina"
}

QUERIES = Scripts.query


class QueriesService:
    """Serviço para consultas de precificação."""

    @staticmethod
    async def buscar_divergencias_markup(ambiente: str) -> List[Dict[str, Any]]:
        """Busca divergências de markup nos produtos."""
        db_name = AMBIENTES.get(ambiente)
        if not db_name:
            raise HTTPException(status_code=400, detail="Ambiente inválido")
        
        query = QUERIES['divergencia_markup']
        
        dados = await executar_query(
            banco=db_name, 
            query=query, 
            params=(), 
            usuario="SISTEMA", 
            endpoint="/precificacao/divergencias-markup"
        )
        return dados or []

    @staticmethod
    async def buscar_registro_inteligente(
        registro: str, 
        ambiente: str,
        is_numord: bool = False
    ) -> Dict[str, Any]:
        """Busca inteligente de produtos por código ou nota fiscal."""
        db_name = AMBIENTES.get(ambiente)
        if not db_name:
            raise HTTPException(status_code=400, detail="Ambiente inválido")
        
        # 1. Se o React avisou que é um NumOrd direto (usuário clicou na janelinha)
        if is_numord:
            query = QUERIES['consulta_nota']
            dados = await executar_query(
                banco=db_name, 
                query=query, 
                params=(registro,), 
                usuario="SISTEMA", 
                endpoint=f"/precificacao/produto/nf/{registro}"
            )
            return {"action": "found", "data": dados or []}

        # 2. Múltiplos códigos
        if "," in registro:
            codigos = [c.strip().strip("'").strip() for c in registro.split(",") if c.strip()]
            codigos = [c for c in codigos if c]
            
            if not codigos:
                raise HTTPException(status_code=400, detail="Lista de códigos inválida.")
            
            codigos_formatados = ",".join(f"'{c}'" for c in codigos)
            query_base = QUERIES['consulta_codigo']
            query = query_base.format(codigos=codigos_formatados)
            
            dados = await executar_query(
                banco=db_name, 
                query=query, 
                params=(), 
                usuario="SISTEMA", 
                endpoint="/precificacao/produto/multiplos"
            )
            return {"action": "found", "data": dados or []}

        # 3. Nota Fiscal (Digitou o número de documento)
        elif len(registro) >= 6 and registro.isdigit():
            query_notas = QUERIES['buscar_notas_por_numero']
            notas_encontradas = await executar_query(
                banco=db_name, 
                query=query_notas, 
                params=(registro,), 
                usuario="SISTEMA", 
                endpoint="/precificacao/notas"
            )
            
            if not notas_encontradas:
                raise HTTPException(status_code=404, detail="Nenhuma nota encontrada.")
                
            # Se achou mais de uma nota com esse número
            if len(notas_encontradas) > 1:
                return {"action": "select_note", "notes": notas_encontradas}
                
            # Se achou só uma, carrega os itens usando o numord dela direto
            numord_unico = notas_encontradas[0]['numord']
            query_itens = QUERIES['consulta_nota']
            dados = await executar_query(
                banco=db_name, 
                query=query_itens, 
                params=(numord_unico,), 
                usuario="SISTEMA", 
                endpoint=f"/precificacao/produto/nf/{numord_unico}"
            )
            return {"action": "found", "data": dados or []}

        # 4. Código Individual
        else:
            registro_formatado = str(registro).zfill(5)
            query = QUERIES['consulta_codigo'].format(codigos=f"'{registro_formatado}'")
            dados = await executar_query(
                banco=db_name, 
                query=query, 
                params=(), 
                usuario="SISTEMA", 
                endpoint=f"/precificacao/produto/{registro}"
            )
            
            if not dados:
                raise HTTPException(status_code=404, detail="Nenhum registro encontrado para esta busca.")
            
            return {"action": "found", "data": dados}

    @staticmethod
    async def buscar_produtos_em_lote(
        codigos: List[str], 
        ambiente: str
    ) -> List[Dict[str, Any]]:
        """Busca múltiplos produtos em lote."""
        if not codigos:
            return []

        db_name = AMBIENTES.get(ambiente)
        if not db_name:
            raise HTTPException(status_code=400, detail="Ambiente inválido")
        
        codigos_formatados = ",".join(f"'{str(c).strip()}'" for c in codigos)
        query = Scripts.query['consulta_codigo'].format(codigos=codigos_formatados)
            
        dados = await executar_query(
            banco=db_name, 
            query=query, 
            params=(), 
            usuario="SISTEMA", 
            endpoint="/precificacao/produtos-lote"
        )
        
        return dados or []

    @staticmethod
    async def listar_classificacoes(ambiente: str) -> List[Dict[str, Any]]:
        """Lista todas as classificações de produtos."""
        db_name = AMBIENTES.get(ambiente)
        if not db_name:
            raise HTTPException(status_code=400, detail="Ambiente inválido")
        
        query = "SELECT clasprod as codigo, descr FROM CLASSIFCAD ORDER BY clasprod"
        dados = await executar_query(
            banco=db_name, 
            query=query, 
            params=(), 
            usuario="SISTEMA", 
            endpoint="/precificacao/classificacoes"
        )
        return dados or []

    @staticmethod
    async def listar_fornecedores(
        termo: str, 
        ambiente: str
    ) -> List[Dict[str, Any]]:
        """Lista fornecedores com filtro por nome."""
        db_name = AMBIENTES.get(ambiente)
        if not db_name:
            raise HTTPException(status_code=400, detail="Ambiente inválido")
        
        query = "SELECT OID, NOME FROM FORNECECAD WHERE NOME LIKE ? ORDER BY NOME"
        dados = await executar_query(
            banco=db_name, 
            query=query, 
            params=(f"%{termo}%",), 
            usuario="SISTEMA", 
            endpoint="/precificacao/fornecedores"
        )
        return dados or []

    @staticmethod
    async def pesquisar_produto_avancado(
        termo: str = "", 
        codigo: str = "",
        fornecedor: str = "",
        classificacao: str = "",
        disponibilidade: str = "",
        ambiente: str = "treina"
    ) -> List[Dict[str, Any]]:
        """Pesquisa avançada de produtos com múltiplos filtros."""
        db_name = AMBIENTES.get(ambiente)
        if not db_name:
            raise HTTPException(status_code=400, detail="Ambiente inválido")
        
        query = Scripts.query['pesquisar_produto']
        
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
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " ORDER BY p.codpro"
        
        dados = await executar_query(
            banco=db_name, 
            query=query, 
            params=tuple(params), 
            usuario="SISTEMA", 
            endpoint="/precificacao/pesquisar"
        )
        return dados or []
