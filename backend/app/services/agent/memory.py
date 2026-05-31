from collections import defaultdict
from langchain_core.messages import BaseMessage

# 세션별 메시지 히스토리 (인메모리 — Phase 3에서 Supabase로 마이그레이션)
_store: dict[str, list[BaseMessage]] = defaultdict(list)

MAX_HISTORY = 20  # 세션당 최대 보관 메시지 수


def get_history(session_id: str) -> list[BaseMessage]:
    return _store[session_id]


def append_message(session_id: str, message: BaseMessage) -> None:
    _store[session_id].append(message)
    # 오래된 메시지 자동 정리 (system 메시지 제외하고 앞에서 제거)
    history = _store[session_id]
    if len(history) > MAX_HISTORY:
        _store[session_id] = history[-MAX_HISTORY:]


def clear_history(session_id: str) -> None:
    _store.pop(session_id, None)
