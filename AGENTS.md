# AGENTS.md

## Project Overview

- **Name**: Secretary AI
- **Harness profile**: fastapi + python
- **Purpose**: 개인 AI 비서 — 일정 관리, 지식 베이스(RAG + GraphDB), AI Agent 채팅을 제공하는 백엔드 서비스
- **Primary stack**: FastAPI (Python 3.14), Supabase, Qdrant, Neo4j, LangGraph, Ollama

## Core Rules

- `backend/` 하위 구조와 기존 라우터/서비스 분리 방식을 유지한다.
- 새 패키지 설치 시 `backend/requirements.txt`에 반드시 추가한다.
- `.env` 파일은 절대 커밋하지 않는다. 변경 사항은 `.env.example`에만 반영한다.
- `harness-starter-kit/` 디렉터리는 읽기 전용 참고 자료다. 편집하거나 커밋하지 않는다.
- `temp_`, `_new`, `_old`, `_backup`, `_fix` 접미사 파일을 남기지 않는다.
- LLM provider 전환은 `.env`의 `LLM_PROVIDER` 값 하나만 바꾸면 된다. 코드 수정 없이 동작해야 한다.

## Commands

작업 완료 전 실행해야 하는 검증 명령어:

```powershell
# 구조 drift 검사
python scripts/check_structure.py

# 문서 링크 drift 검사
python scripts/check_docs_drift.py

# 인코딩 검사
python scripts/check_encoding_hygiene.py

# 서버 헬스 확인 (서버 실행 중일 때)
curl http://localhost:8001/health

# API 스키마 검증 (Windows는 -X utf8 필요)
python -X utf8 scripts/check_harness.py
```

## Project Analysis Rule

분석·요약·온보딩 요청 시 아래 순서로 읽는다:

- `AGENTS.md`
- `backend/app/main.py`
- `backend/app/core/config.py`
- `backend/app/models/schemas.py`
- `docs/decisions/`
- `docs/conventions/`
- `docs/domain/`
- `docs/failures/`
- `scripts/check_harness.py`

## Directory And Architecture Rules

```
secretary/
├── backend/
│   ├── app/
│   │   ├── api/routes/   ← HTTP 엔드포인트만. 비즈니스 로직 금지
│   │   ├── core/         ← 설정(config.py)
│   │   ├── db/           ← DB 연결 싱글턴 (supabase, qdrant, neo4j)
│   │   ├── models/       ← Pydantic 스키마
│   │   └── services/     ← 비즈니스 로직, LLM, Agent
│   ├── requirements.txt
│   ├── .env              ← 커밋 금지
│   └── .env.example      ← 커밋 대상
├── docker-compose.yml    ← Qdrant + Neo4j 로컬 실행
├── scripts/              ← harness 검사 스크립트
└── docs/                 ← 결정, 컨벤션, 도메인, 실패 기록
```

- `api/routes/`는 요청 파싱과 응답 직렬화만 담당한다. DB 직접 호출 최소화.
- LLM 추상화(`services/llm.py`)를 통해서만 모델 호출한다. 라우터에서 직접 호출 금지.
- `db/` 모듈의 연결 객체는 싱글턴으로 유지한다. 요청마다 새로 생성하지 않는다.

## Knowledge Store

아키텍처·도메인·워크플로우 변경 전 반드시 확인:

- `docs/decisions/` — 설계 결정 기록
- `docs/failures/` — 재발 방지 실패 기록
- `docs/conventions/` — 코딩·API 컨벤션
- `docs/domain/` — 도메인 용어·개념

비자명한 코드 변경 시 해당 docs를 업데이트한다.

## LLM Provider 전환 가이드

`backend/.env`에서 `LLM_PROVIDER` 값만 변경:

| 값 | 모델 예시 | 필요 키 |
|---|---|---|
| `ollama` | `llama3.1` | 없음 (로컬) |
| `groq` | `llama-3.1-70b-versatile` | `GROQ_API_KEY` |
| `anthropic` | `claude-sonnet-4-6` | `ANTHROPIC_API_KEY` |
| `openai` | `gpt-4o` | `OPENAI_API_KEY` |

## Commit And PR Rules

- `.env`, `harness-starter-kit/`, `__pycache__/` 를 커밋하지 않는다.
- Conventional Commits 사용: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- 커밋 전 `git status`와 diff를 반드시 확인한다.

## Completion Criteria

작업 완료 보고 전:

1. `python scripts/check_harness.py` 실행 — 이상 없을 것
2. `python scripts/check_docs_drift.py` 실행 — 깨진 링크 없을 것
3. `python scripts/check_structure.py` 실행 — drift 파일 없을 것
4. 비자명한 변경이라면 `docs/` 업데이트 여부 확인
5. 임시 파일 남기지 않았는지 확인
