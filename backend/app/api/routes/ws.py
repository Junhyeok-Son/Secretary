"""WebSocket 엔드포인트."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.realtime import manager
import json

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(ws: WebSocket, session_id: str):
    """
    클라이언트가 연결하면 해당 세션의 실시간 이벤트를 수신한다.

    수신 메시지 타입:
    - {"type": "event_created", "data": {...}}
    - {"type": "event_updated", "data": {...}}
    - {"type": "event_deleted", "data": {...}}
    - {"type": "chat_delta",    "data": {"delta": "...", "session_id": "..."}}
    - {"type": "chat_done",     "data": {"session_id": "..."}}
    - {"type": "ping"}  → {"type": "pong"} 응답
    """
    await manager.connect(session_id, ws)
    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except Exception:
                continue

            if msg.get("type") == "ping":
                await ws.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        manager.disconnect(session_id, ws)
