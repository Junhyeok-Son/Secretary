# 코딩 컨벤션

## Python

- Python 3.14, Pydantic v2 사용
- 타입 힌트 필수 — 함수 시그니처에 항상 명시
- `Optional[X]` 대신 `X | None` 사용
- 주석은 WHY가 불명확할 때만. WHAT 설명 주석 금지

## FastAPI 라우터

- 라우터는 요청 파싱 + 응답 직렬화만 담당
- 비즈니스 로직은 `services/`에 위치
- DB 직접 접근은 라우터에서 최소화; 복잡한 쿼리는 서비스 레이어로 분리

## 환경변수

- 모든 설정은 `app/core/config.py`의 `Settings` 클래스 경유
- 절대 `os.environ` 직접 접근 금지
- 새 설정 추가 시 `.env.example`에도 반드시 추가

## DB 연결

- `db/` 모듈의 연결 객체는 싱글턴 패턴 유지
- `get_supabase()`, `get_qdrant()`, `get_driver()` 함수로만 접근

## LLM

- `services/llm.py`의 `get_llm()` 통해서만 모델 인스턴스 획득
- 라우터나 다른 서비스에서 LLM 클래스 직접 import 금지

## API 버전

- 모든 엔드포인트는 `/api/v1/` 접두사 사용
- 서버 실행 포트: `8001` (8000은 기존 다른 프로젝트가 사용 중)
