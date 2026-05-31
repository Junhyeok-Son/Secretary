from langchain_core.tools import tool
from datetime import datetime, timedelta, timezone
import time as _time
from app.db.supabase import get_supabase
from app.db.qdrant import get_qdrant
from app.services.llm import get_embeddings
from app.services.graph import search_graph as _search_graph

DEV_USER_ID = "00000000-0000-0000-0000-000000000001"


@tool
def get_events(start_date: str = "", end_date: str = "") -> str:
    """사용자의 일정을 조회한다. start_date, end_date는 ISO 형식 날짜(YYYY-MM-DD). 생략하면 오늘 이후 일정을 반환한다."""
    db = get_supabase()
    query = db.table("events").select("*")
    if start_date:
        query = query.gte("start_at", start_date)
    if end_date:
        query = query.lte("end_at", end_date + "T23:59:59")
    if not start_date:
        query = query.gte("start_at", datetime.now().isoformat())
    result = query.order("start_at").limit(20).execute()
    if not result.data:
        return "등록된 일정이 없습니다."
    lines = []
    for e in result.data:
        start = e["start_at"][:16].replace("T", " ")
        end = e["end_at"][:16].replace("T", " ")
        lines.append(f"- [{start} ~ {end}] {e['title']}" + (f" ({e['location']})" if e.get("location") else ""))
    return "\n".join(lines)


def _with_local_tz(dt_str: str) -> str:
    """타임존 정보 없는 datetime 문자열에 로컬 UTC 오프셋을 추가한다."""
    if "+" in dt_str[10:] or dt_str.endswith("Z"):
        return dt_str  # 이미 타임존 있음
    offset_sec = -_time.timezone if _time.daylight == 0 else -_time.altzone
    sign = "+" if offset_sec >= 0 else "-"
    h, m = divmod(abs(offset_sec) // 60, 60)
    return f"{dt_str}{sign}{h:02d}:{m:02d}"


@tool
def create_event(title: str, start_at: str, end_at: str, description: str = "", location: str = "") -> str:
    """새 일정을 생성한다. start_at, end_at은 ISO 8601 형식(예: 2026-06-01T14:00:00)."""
    db = get_supabase()
    payload = {
        "user_id": DEV_USER_ID,
        "title": title,
        "start_at": _with_local_tz(start_at),
        "end_at": _with_local_tz(end_at),
        "description": description or None,
        "location": location or None,
        "status": "confirmed",
    }
    result = db.table("events").insert(payload).execute()
    if result.data:
        return f"일정 생성 완료: '{title}' ({start_at[:16]} ~ {end_at[:16]})"
    return "일정 생성 실패"


@tool
def search_knowledge(query: str, limit: int = 4) -> str:
    """사용자의 지식 베이스에서 쿼리와 가장 관련된 내용을 벡터 검색으로 찾는다."""
    embeddings = get_embeddings()
    vector = embeddings.embed_query(query)
    qdrant = get_qdrant()
    results = qdrant.query_points(
        collection_name="knowledge",
        query=vector,
        limit=max(1, limit),
    ).points
    relevant = [r for r in results if r.score > 0.55]
    if not relevant:
        return "관련 지식을 찾지 못했습니다."
    lines = [f"[유사도 {r.score:.2f}] {r.payload.get('content', '')}" for r in relevant]
    return "\n\n".join(lines)


@tool
def search_knowledge_graph(query: str) -> str:
    """지식 그래프에서 쿼리 키워드와 연결된 엔티티·관계를 탐색한다. 개념 간 연결이나 맥락 파악에 유용하다."""
    results = _search_graph(query)
    if not results:
        return "그래프에서 관련 지식을 찾지 못했습니다."
    return "\n\n".join(f"[그래프] {r}" for r in results)


_KO_WEEKDAY = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"]


@tool
def get_current_time() -> str:
    """현재 날짜와 시간을 반환한다. 날짜·일정 계산 전에 반드시 먼저 호출해야 한다."""
    now = datetime.now()
    tomorrow = now + timedelta(days=1)
    return (
        f"현재 날짜: {now.year}년 {now.month}월 {now.day}일 ({_KO_WEEKDAY[now.weekday()]})\n"
        f"현재 시각: {now.strftime('%H:%M')}\n"
        f"내일: {tomorrow.year}년 {tomorrow.month}월 {tomorrow.day}일 ({_KO_WEEKDAY[tomorrow.weekday()]})\n"
        f"내일 ISO 날짜: {tomorrow.strftime('%Y-%m-%d')}"
    )


TOOLS = [get_events, create_event, search_knowledge, search_knowledge_graph, get_current_time]
