"""WebSocket 연결 관리 + Supabase Realtime 브리지."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Literal

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """세션별 WebSocket 연결을 관리한다."""

    def __init__(self) -> None:
        # session_id → WebSocket 목록 (같은 세션을 여러 탭/기기가 구독 가능)
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, session_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.setdefault(session_id, []).append(ws)
        logger.info("WS connected: session=%s total=%d", session_id, len(self._connections[session_id]))

    def disconnect(self, session_id: str, ws: WebSocket) -> None:
        conns = self._connections.get(session_id, [])
        if ws in conns:
            conns.remove(ws)
        if not conns:
            self._connections.pop(session_id, None)
        logger.info("WS disconnected: session=%s", session_id)

    async def send(self, session_id: str, payload: dict) -> None:
        """특정 세션의 모든 연결에 메시지 전송."""
        dead: list[WebSocket] = []
        for ws in list(self._connections.get(session_id, [])):
            try:
                await ws.send_text(json.dumps(payload, ensure_ascii=False))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(session_id, ws)

    async def broadcast(self, payload: dict) -> None:
        """모든 연결에 브로드캐스트."""
        for session_id in list(self._connections):
            await self.send(session_id, payload)


manager = ConnectionManager()


async def _supabase_realtime_listener() -> None:
    """Supabase Realtime에서 events 테이블 변경을 구독하고 WebSocket으로 전파한다."""
    from app.core.config import settings
    import httpx

    url = settings.SUPABASE_URL.rstrip("/")
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
    }

    # Supabase Realtime WebSocket 엔드포인트
    realtime_url = url.replace("https://", "wss://").replace("http://", "ws://")
    realtime_url = f"{realtime_url}/realtime/v1/websocket?apikey={settings.SUPABASE_ANON_KEY}&vsn=1.0.0"

    import websockets

    backoff = 1
    while True:
        try:
            async with websockets.connect(realtime_url) as ws:
                backoff = 1
                logger.info("Supabase Realtime connected")

                # 하트비트
                async def heartbeat():
                    while True:
                        await asyncio.sleep(25)
                        try:
                            await ws.send(json.dumps({"topic": "phoenix", "event": "heartbeat", "payload": {}, "ref": None}))
                        except Exception:
                            break

                # events 테이블 구독
                await ws.send(json.dumps({
                    "topic": "realtime:public:events",
                    "event": "phx_join",
                    "payload": {"config": {"broadcast": {"self": True}, "presence": {"key": ""}}},
                    "ref": "1",
                }))

                hb_task = asyncio.create_task(heartbeat())
                try:
                    async for raw in ws:
                        msg = json.loads(raw)
                        event = msg.get("event")
                        payload = msg.get("payload", {})

                        if event == "INSERT":
                            await manager.broadcast({"type": "event_created", "data": payload.get("record", {})})
                        elif event == "UPDATE":
                            await manager.broadcast({"type": "event_updated", "data": payload.get("record", {})})
                        elif event == "DELETE":
                            await manager.broadcast({"type": "event_deleted", "data": payload.get("old_record", {})})
                finally:
                    hb_task.cancel()

        except Exception as exc:
            logger.warning("Supabase Realtime disconnected: %s — retry in %ds", exc, backoff)
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, 30)


def start_realtime_listener(loop: asyncio.AbstractEventLoop | None = None) -> asyncio.Task:
    return asyncio.ensure_future(_supabase_realtime_listener())
