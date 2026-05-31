# 0002 — 개발용 UUID가 UUID4 검증 실패로 500 에러

**날짜**: 2026-05-31  
**상태**: 해결됨

## 증상

`GET /api/v1/events/` → 500 Internal Server Error  
`ResponseValidationError: UUID version 4 expected, input: '00000000-0000-0000-0000-000000000001'`

## 원인

`EventResponse.user_id`를 `UUID4` 타입으로 선언했는데, 개발용 더미 user_id가 올-제로 형식이라 UUID v4 규격 불만족.

## 해결

`user_id` 필드를 `UUID4` → `str`로 변경. 인증 구현 전까지 유지.

## 재발 방지

인증 추가 시 실제 `auth.users` UUID를 사용하므로 자연히 해결됨.
