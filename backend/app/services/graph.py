"""Neo4j 지식 그래프 서비스.

저장: 텍스트에서 엔티티·관계 추출 → Neo4j 노드/엣지 저장
검색: 키워드로 연결된 지식 경로 탐색
"""

from __future__ import annotations

from app.db.neo4j import get_driver
from app.services.llm import get_llm
from langchain_core.messages import HumanMessage


# ── 엔티티/관계 추출 ────────────────────────────────────────────────────────

_EXTRACT_PROMPT = """다음 텍스트에서 핵심 엔티티와 관계를 JSON으로 추출하라.

텍스트: {text}

형식 (JSON만 출력, 설명 없음):
{{
  "entities": ["엔티티1", "엔티티2"],
  "relations": [["엔티티1", "관계", "엔티티2"]]
}}

엔티티는 명사(사람, 장소, 개념, 도구, 이벤트 등). 관계는 동사구. 최대 5개 관계."""


def extract_graph(text: str) -> dict:
    """LLM으로 텍스트에서 엔티티·관계 추출."""
    llm = get_llm()
    prompt = _EXTRACT_PROMPT.format(text=text)
    response = llm.invoke([HumanMessage(content=prompt)])
    content = response.content.strip()

    # JSON 블록 파싱
    import json, re
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if not match:
        return {"entities": [], "relations": []}
    try:
        return json.loads(match.group())
    except Exception:
        return {"entities": [], "relations": []}


# ── Neo4j 저장 ────────────────────────────────────────────────────────────────

def save_to_graph(knowledge_id: str, text: str, graph_data: dict) -> None:
    """엔티티·관계를 Neo4j에 저장."""
    driver = get_driver()
    entities = graph_data.get("entities", [])
    relations = graph_data.get("relations", [])

    with driver.session() as session:
        # 지식 노드
        session.run(
            "MERGE (k:Knowledge {id: $id}) SET k.text = $text",
            id=knowledge_id, text=text[:500],
        )

        # 엔티티 노드 + 지식 연결
        for entity in entities:
            session.run(
                """
                MERGE (e:Entity {name: $name})
                WITH e
                MATCH (k:Knowledge {id: $kid})
                MERGE (k)-[:MENTIONS]->(e)
                """,
                name=entity, kid=knowledge_id,
            )

        # 관계 엣지
        for rel in relations:
            if len(rel) != 3:
                continue
            src, rel_type, dst = rel
            rel_label = rel_type.upper().replace(" ", "_")[:40]
            session.run(
                f"""
                MERGE (a:Entity {{name: $src}})
                MERGE (b:Entity {{name: $dst}})
                MERGE (a)-[:`{rel_label}`]->(b)
                """,
                src=src, dst=dst,
            )


# ── Neo4j 검색 ────────────────────────────────────────────────────────────────

def search_graph(query: str, hops: int = 2, limit: int = 5) -> list[str]:
    """
    쿼리 키워드와 연결된 엔티티의 Knowledge 노드 텍스트를 반환.
    단어별로 포함 여부를 체크하므로 임베딩 불필요.
    """
    driver = get_driver()
    keywords = [w for w in query.split() if len(w) >= 2]
    if not keywords:
        return []

    results: list[str] = []
    with driver.session() as session:
        for kw in keywords[:3]:  # 최대 3개 키워드
            rows = session.run(
                f"""
                MATCH (e:Entity)
                WHERE toLower(e.name) CONTAINS toLower($kw)
                MATCH (k:Knowledge)-[:MENTIONS]->(e)
                RETURN DISTINCT k.text AS text
                LIMIT {limit}
                """,
                kw=kw,
            )
            for row in rows:
                text = row["text"]
                if text and text not in results:
                    results.append(text)

    return results[:limit]
