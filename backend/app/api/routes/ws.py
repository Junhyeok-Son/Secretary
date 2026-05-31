"""WebSocket 엔드포인트."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.services.realtime import manager
from app.core.config import settings
import json

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    ws: WebSocket,
    session_id: str,
    secret: str = Query(default=""),
):
    """
    클라이언트가 ?secret=<APP_SECRET> 쿼리 파라미터로 인증한다.

    수신 메시지 타입:
    - {"type": "event_created", "data": {...}}
    - {"type": "event_updated", "data": {...}}
    - {"type": "event_deleted", "data": {...}}
    - {"type": "ping"}  → {"type": "pong"} 응답
    """
    if secret != settings.APP_SECRET:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

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
