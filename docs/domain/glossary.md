# 도메인 용어집

## 핵심 개념

**Event (일정)**
- Supabase `events` 테이블에 저장되는 캘린더 항목
- `start_at`, `end_at`은 항상 timezone-aware (`timestamptz`)

**Knowledge (지식)**
- 사용자가 직접 입력하거나 문서에서 추출한 텍스트 조각
- Supabase `knowledge` 테이블에 원문, Qdrant에 벡터, Neo4j에 관계 저장

**RAG (Retrieval-Augmented Generation)**
- 질문 임베딩 → Qdrant 유사도 검색 → 컨텍스트 주입 → LLM 응답
- 임계값: cosine similarity 0.6 이상인 결과만 컨텍스트로 사용

**Agent**
- LangGraph로 구성된 멀티스텝 워크플로우
- 도구: 일정 조회/생성, 지식 검색, 일반 대화

**LLM Provider**
- `.env`의 `LLM_PROVIDER` 한 줄로 전환
- 현재 기본값: `ollama` (로컬 llama3.1)

## 데이터 흐름

```
사용자 입력
  → POST /api/v1/chat/
  → RAG: Qdrant 벡터 검색 + Neo4j 관계 조회
  → LLM: 컨텍스트 + 질문 → 응답
  → SSE 스트리밍 응답
```
