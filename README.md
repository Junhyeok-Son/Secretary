# Secretary AI

개인 AI 비서 — 일정 관리, 지식 베이스, AI 에이전트 채팅을 하나의 백엔드로.

## 기능

- **일정 관리** — 캘린더 이벤트 CRUD, 반복 일정, Google Calendar 연동 준비
- **지식 베이스** — 텍스트/문서를 RAG 파이프라인으로 저장·검색
- **AI 채팅** — 지식 베이스 기반 SSE 스트리밍 응답
- **실시간 동기화** — 앱·웹 양쪽 동시 반영 (Supabase Realtime)
- **LLM 유연성** — 로컬(Ollama) → 유료 모델 한 줄 전환

## 기술 스택

| 역할 | 선택 |
|---|---|
| API 서버 | FastAPI (Python 3.14) |
| 데이터베이스 | Supabase (PostgreSQL + Realtime + RLS) |
| 벡터 DB | Qdrant |
| 그래프 DB | Neo4j Community |
| LLM (기본) | Ollama — llama3.1 |
| 임베딩 | nomic-embed-text |
| Agent | LangGraph |
| LLM 추상화 | LangChain |

## 프로젝트 구조

```
secretary/
├── backend/
│   ├── app/
│   │   ├── api/routes/     # 엔드포인트 (events, knowledge, chat)
│   │   ├── core/           # 설정
│   │   ├── db/             # DB 연결 (Supabase, Qdrant, Neo4j)
│   │   ├── models/         # Pydantic 스키마
│   │   └── services/       # LLM, Agent, RAG 로직
│   ├── requirements.txt
│   ├── .env.example
│   └── supabase_schema.sql
├── docker-compose.yml
├── scripts/                # Harness 검사 스크립트
└── docs/                   # 결정·컨벤션·실패 기록
```

## 시작하기

### 사전 요구 사항

- Python 3.11+
- Docker Desktop
- [Ollama](https://ollama.com/download)
- [Supabase](https://supabase.com) 계정

### 1. 환경 변수 설정

```powershell
cp backend/.env.example backend/.env
```

`backend/.env`에 값 입력:

```env
SUPABASE_URL=https://xxxx.supabase.co        # /rest/v1/ 제외
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEO4J_PASSWORD=your_password
```

### 2. Supabase 스키마 적용

Supabase 대시보드 → SQL Editor → `backend/supabase_schema.sql` 내용 붙여넣고 실행.

### 3. DB 실행

```powershell
docker compose up -d
```

### 4. Python 패키지 설치

```powershell
pip install -r backend/requirements.txt
```

### 5. Ollama 모델 다운로드

```powershell
ollama pull llama3.1
ollama pull nomic-embed-text
```

### 6. 서버 실행

```powershell
cd backend
uvicorn app.main:app --reload --port 8001
```

API 문서: `http://localhost:8001/docs`

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/v1/events/` | 일정 목록 |
| POST | `/api/v1/events/` | 일정 생성 |
| PATCH | `/api/v1/events/{id}` | 일정 수정 |
| DELETE | `/api/v1/events/{id}` | 일정 삭제 |
| POST | `/api/v1/knowledge/` | 지식 저장 |
| GET | `/api/v1/knowledge/search` | 지식 검색 (`?q=검색어`) |
| POST | `/api/v1/chat/` | AI 채팅 (SSE 스트리밍) |

## LLM 모델 전환

`backend/.env`에서 `LLM_PROVIDER`만 변경하면 코드 수정 없이 전환된다.

| 값 | 모델 예시 | 비용 |
|---|---|---|
| `ollama` | `llama3.1` | 무료 (로컬) |
| `groq` | `llama-3.1-70b-versatile` | 무료 API |
| `anthropic` | `claude-sonnet-4-6` | 유료 |
| `openai` | `gpt-4o` | 유료 |

## 개발 검사

```powershell
python -X utf8 scripts/check_harness.py
python scripts/check_docs_drift.py
python scripts/check_structure.py
python scripts/check_encoding_hygiene.py
```

## 개발 로드맵

- [x] Phase 1 — 백엔드 코어 (FastAPI + Supabase + Qdrant + Neo4j)
- [x] Phase 2 — AI Agent (LangGraph + RAG + 일정 툴)
- [x] Phase 3 — 실시간 동기화 (Supabase Realtime + WebSocket)
- [x] Phase 4 — 웹 UI (Next.js + shadcn/ui)
- [x] Phase 5 — 모바일 앱 (Flutter)

## 모바일 앱 (Flutter)

```powershell
cd mobile

# 웹으로 실행 (가장 빠름, Android SDK 불필요)
flutter run -d chrome

# Windows 데스크탑 앱으로 실행
flutter run -d windows

# Android 실기기/에뮬레이터 (Android Studio 설치 후)
# 에뮬레이터는 호스트를 10.0.2.2 로 접근하므로 API_BASE 지정
flutter run --dart-define=API_BASE=http://10.0.2.2:8001
```

Flutter SDK는 `C:\dev\flutter` 에 설치되어 있다 (PATH 등록됨).
