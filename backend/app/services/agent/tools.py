from langchain_core.tools import tool
from datetime import datetime
from app.db.supabase import get_supabase
from app.db.qdrant import get_qdrant
from app.services.llm import get_embeddings

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


@tool
def create_event(title: str, start_at: str, end_at: str, description: str = "", location: str = "") -> str:
    """새 일정을 생성한다. start_at, end_at은 ISO 8601 형식(예: 2026-06-01T14:00:00)."""
    db = get_supabase()
    payload = {
        "user_id": DEV_USER_ID,
        "title": title,
        "start_at": start_at,
        "end_at": end_at,
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
    """사용자의 지식 베이스에서 쿼리와 가장 관련된 내용을 검색한다."""
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
def get_current_time() -> str:
    """현재 날짜와 시간을 반환한다."""
    return datetime.now().strftime("%Y년 %m월 %d일 %H:%M (%A)")


TOOLS = [get_events, create_event, search_knowledge, get_current_time]
