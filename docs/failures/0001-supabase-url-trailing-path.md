# 0001 — Supabase URL에 /rest/v1/ 포함 시 연결 실패

**날짜**: 2026-05-31  
**상태**: 해결됨

## 증상

`SUPABASE_URL`에 `/rest/v1/` 경로가 붙어 있으면 supabase-py 클라이언트가 이중 경로를 조합해 모든 API 호출 500 에러 발생.

## 원인

Supabase 대시보드 API 설정 화면에 표시되는 "REST URL"을 복사하면 `/rest/v1/`이 포함됨. supabase-py는 자체적으로 경로를 붙이므로 베이스 URL만 필요.

## 해결

`.env`의 `SUPABASE_URL`은 반드시 베이스 URL만:

```
# 올바름
SUPABASE_URL=https://xxxx.supabase.co

# 틀림
SUPABASE_URL=https://xxxx.supabase.co/rest/v1/
```

## 재발 방지

`scripts/check_harness.py`에 URL 형식 검사 추가 고려.
