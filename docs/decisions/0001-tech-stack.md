# 0001 — 기술 스택 결정

**날짜**: 2026-05-31  
**상태**: 확정

## 결정

| 역할 | 선택 | 이유 |
|---|---|---|
| API 서버 | FastAPI | AI 라이브러리 호환성 최고, async 기본 지원 |
| 관계형+실시간 DB | Supabase | PostgreSQL + Realtime + RLS 통합, 무료 티어 |
| 벡터 DB | Qdrant | 셀프호스팅 무료, 속도 우수 |
| 그래프 DB | Neo4j Community | 지식 관계 저장, 무료 |
| LLM (기본) | Ollama + llama3.1 | 완전 무료, 로컬 실행 |
| 임베딩 | nomic-embed-text | Ollama 통해 무료, 768차원 |
| Agent 워크플로우 | LangGraph | 멀티스텝 에이전트, 메모리 관리 |
| LLM 추상화 | LangChain | 모델 전환 시 코드 변경 최소화 |

## LLM 전환 전략

`LLM_PROVIDER` 환경변수 하나로 전환 가능하도록 추상화.  
전환 순서: `ollama` → `groq` (무료 API) → `anthropic`/`openai` (유료)

## 포트 할당

- `8000`: 기존 다른 프로젝트(Django) 선점
- `8001`: Secretary AI FastAPI 서버
- `6333`: Qdrant
- `7474`/`7687`: Neo4j
